// Components
import ImageGallery from "./components/ImageGallery"
import Labels from "./components/Labels"
import ImageAnnotation from "./components/ImageAnnotation"
// Libaries
import { useEffect, useMemo, useRef, useState } from "react"
import { filter, fromEvent, map, merge, Observable, scan } from "rxjs"
import { fabric } from 'fabric'
// Self-made
import { addImage, initCanvas, resizeCanvas } from "./helper/view"
import { Action, FabricMouseEvent, ImageFile, Key, Event, Mode, MouseDown, MouseMove, MouseUp, reduceState, SelectedImage, State, SwitchMode, NextImage, PrevImage } from "./helper/types"
import { initialState } from "./helper/state"
import { cleanupFabricCanvas, createFabricEventObservable, handleArrowKeyPress, handleDrawMode, handlePanMode } from "./helper/util"
import SideBar from "./components/SideBar"
import Export from "./components/Export"
import SelectLabelPopup from "./components/SelectLabelPopup"
import { getImagesPaginated } from "./helper/server"
import { ImageContext } from "./helper/provider"
import LoadStatePopup from "./components/LoadStatePopup"

function App() {
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const [images, setImages] = useState<ImageFile[]>([])
  const imagesRef = useRef<ImageFile[]>(images)

  const [labels, setLabels] = useState<string[]>([]);

  const [selectedLabelIndex, setSelectedLabelIndex] = useState<number | null>(null);
  const selectedLabelIndexRef = useRef<number | null>(selectedLabelIndex)

  const [selectedImageInfo, setSelectedImageInfo] = useState<SelectedImage | null>(null);
  const selectedImageInfoRef = useRef(selectedImageInfo)

  const [selectedFabricImage, setSelectedFabricImage] = useState<fabric.Image | null>(null);
  const selectedFabricImageRef = useRef(selectedFabricImage)

  const [annotationCount, setAnnotationCount] = useState<number>(0);
  const annotationCountRef = useRef(annotationCount)

  const [showLoadPopup, setShowLoadPopup] = useState(false);

  const memoImageState = useMemo(() => ({
    images, 
    setImages,
    selectedImageInfo,
    setSelectedImageInfo
  }), [images, selectedImageInfo])

  // Consider an error popup to let user know errors.
  // const [isError, setIsError] = useState<boolean>(false);


  useEffect(() => {
    const fabricCanvas = initCanvas('canvas')
    fabricCanvasRef.current = fabricCanvas

    const canvasContainer = document.querySelector("#canvasContainer") as HTMLDivElement
    resizeCanvas(fabricCanvasRef.current, canvasContainer)

    const imageInput = document.querySelector("#imageInput") as HTMLInputElement
    imageInputRef.current = imageInput

    const drawBtn = document.querySelector("#drawIcon") as HTMLDivElement
    const panBtn = document.querySelector("#panIcon") as HTMLDivElement

    // Load from database currently stored info. 
    async function loadDatabaseState() {
      try {
        const firstPage = await getImagesPaginated(0)
        if (firstPage.length > 0) {
          setShowLoadPopup(true)
        }
      } catch (error) {
        return 
      }
    }

    loadDatabaseState()
    
    const drawClick$ = fromEvent(drawBtn, 'click').pipe(map(() => new SwitchMode(Mode.Draw)))
    const panClick$ = fromEvent(panBtn, 'click').pipe(map(() => new SwitchMode(Mode.Pan)))

    const key$ = (e: Event, k: Key) =>
      fromEvent<KeyboardEvent>(document, e).pipe(
          filter(({ code }) => code === k),
          filter(({ repeat }) => repeat === false),
      );
    
    const upArrowPress$ = key$('keydown', 'ArrowUp').pipe(map(() => new NextImage()))
    const downArrowPress$ = key$('keydown', 'ArrowDown').pipe(map(() => new PrevImage()))

    const canvasMouseMove$ = createFabricEventObservable(fabricCanvasRef.current, "mouse:move") as Observable<FabricMouseEvent>
    const canvasMouseDown$ = createFabricEventObservable(fabricCanvasRef.current, "mouse:down") as Observable<FabricMouseEvent>
    const canvasMouseUp$ = createFabricEventObservable(fabricCanvasRef.current, "mouse:up") as Observable<FabricMouseEvent>

    const canvasMouseMoveAction$ = canvasMouseMove$.pipe(map((event) => new MouseMove(event.e.offsetX, event.e.offsetY, event.e.movementX, event.e.movementY)))
    const canvasMouseDownAction$ = canvasMouseDown$.pipe(
      map((event) => {
        const pointer = fabricCanvasRef.current?.getPointer(event.e);
        return new MouseDown(pointer?.x || 0, pointer?.y || 0);
      })
    );
    
    const canvasMouseUpAction$ = canvasMouseUp$.pipe(
      map((event) => {
        const pointer = fabricCanvasRef.current?.getPointer(event.e);
        return new MouseUp(pointer?.x || 0, pointer?.y || 0);
      })
    );

    window.addEventListener("resize", () => {
      if (fabricCanvasRef.current){
        resizeCanvas(fabricCanvasRef.current, canvasContainer)
      }
    })

    const action$:Observable<Action> = merge(
      canvasMouseMoveAction$, 
      canvasMouseDownAction$, 
      canvasMouseUpAction$, 
      drawClick$, 
      panClick$,
      upArrowPress$,
      downArrowPress$
    )
    const source$:Observable<State> = action$.pipe(scan(reduceState, initialState))

    const subscription = source$.subscribe((s) => {
      if (fabricCanvasRef.current && selectedLabelIndexRef.current !== null) {
        switch (s.currentMode){
          case Mode.Draw:
            handleDrawMode(
              s,
              fabricCanvasRef.current,
              selectedFabricImageRef.current,
              selectedImageInfoRef.current,
              selectedLabelIndexRef.current,
              annotationCountRef.current,
              setAnnotationCount,
            )
            break
          case Mode.Pan:
            handlePanMode(s, fabricCanvasRef.current)
            break
          default:
        }
        
        handleArrowKeyPress(
          s,
          imagesRef.current, 
          selectedImageInfoRef.current, 
          setSelectedImageInfo
        )
      }  
    })

    return () => {
      subscription.unsubscribe(); 
      cleanupFabricCanvas(fabricCanvasRef)
    };
  }, [])

  useEffect(() => {
    selectedImageInfoRef.current = selectedImageInfo;
    if (selectedImageInfo && fabricCanvasRef.current){
      addImage(
        fabricCanvasRef.current, 
        setSelectedFabricImage,
        selectedImageInfo
      )
    }
  }, [selectedImageInfo]);

  useEffect(() => {
    selectedLabelIndexRef.current = selectedLabelIndex;
  }, [selectedLabelIndex]);

  useEffect(() => {
    imagesRef.current = images
  }, [images]);

  useEffect(() => {
    selectedFabricImageRef.current = selectedFabricImage;
  }, [selectedFabricImage]);

  useEffect(() => {
    annotationCountRef.current = annotationCount
  }, [annotationCount]);

  return (
    <div className="h-screen w-screen overflow-hidden">
      {/* Popups */}
      {showLoadPopup && <LoadStatePopup 
        setShowLoadPopup={setShowLoadPopup} 
        setImages={setImages} 
        setSelectedImageInfo={setSelectedImageInfo}
        setLabels={setLabels}  
        setAnnotationCount={setAnnotationCount}
      />}
      {selectedLabelIndex === null && showLoadPopup === false ? <SelectLabelPopup/> : <></>}

      <div className="flex h-full w-full">
        {/* Image Panel */}
        <div className="w-1/6 h-full bg-gray-600">
          <ImageContext.Provider value={memoImageState}>
            <ImageGallery/>
          </ImageContext.Provider>
        </div>
        {/* Side Bar */}
        <SideBar/>
        {/* Canvas */}
        <div className="w-3/4 h-full bg-gray-900" id="canvasContainer">
          <canvas className="w-full h-full" id="canvas"></canvas>
        </div>
        {/* Right Side Utility Panels */}
        <div className="w-1/4 h-full bg-gray-800">
          <div className="right-side-panel">
            <Labels 
              labels={labels}
              setLabels={setLabels}
              selectedLabelIndex={selectedLabelIndex} 
              setSelectedLabelIndex={setSelectedLabelIndex} 
            />
          </div>
          <div className="right-side-panel">
            <ImageContext.Provider value={memoImageState}>
              <ImageAnnotation fabricCanvas={fabricCanvasRef.current} annotationCount={annotationCount}/>
            </ImageContext.Provider>
          </div>
          <div className="right-side-panel">
            <Export />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App
