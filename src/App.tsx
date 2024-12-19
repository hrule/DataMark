// Components
import ImageGallery from "./components/ImageGallery"
import Labels from "./components/Labels"
import ImageAnnotation from "./components/ImageAnnotation"
// Libaries
import { useEffect, useRef, useState } from "react"
import { filter, fromEvent, map, merge, Observable, scan } from "rxjs"
import { fabric } from 'fabric'
// Self-made
import { addImage, initCanvas, resizeCanvas } from "./view"
import { Action, Annotation, FabricMouseEvent, ImageFile, Key, Event, Mode, MouseDown, MouseMove, MouseUp, reduceState, SelectedImage, State, SwitchMode, NextImage, PrevImage } from "./types"
import { initialState } from "./state"
import { createFabricEventObservable, handleDrawMode, handlePanMode } from "./util"
import SideBar from "./components/SideBar"

function App() {
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null) 

  const [images, setImages] = useState<ImageFile[]>([])
  const imagesRef = useRef<ImageFile[]>(images)

  const [selectedLabel, setSelectedLabel] = useState<string>("");
  const selectedLabelRef = useRef<string>(selectedLabel)

  const [annotations, setAnnotations] = useState<Annotation[][]>([])
  const annotationsRef = useRef<Annotation[][]>(annotations)

  const [selectedImageInfo, setSelectedImageInfo] = useState<SelectedImage | null>(null);
  const selectedImageInfoRef = useRef(selectedImageInfo)

  const [selectedFabricImage, setSelectedFabricImage] = useState<fabric.Image | null>(null);
  const selectedFabricImageRef = useRef(selectedFabricImage)

  useEffect(() => {
    const fabricCanvas = initCanvas('canvas')
    fabricCanvasRef.current = fabricCanvas
    const canvasContainer = document.querySelector("#canvasContainer") as HTMLDivElement
    resizeCanvas(fabricCanvasRef.current, canvasContainer)

    const imageInput = document.querySelector("#imageInput") as HTMLInputElement
    imageInputRef.current = imageInput

    const drawBtn = document.querySelector("#drawIcon") as HTMLDivElement
    const panBtn = document.querySelector("#panIcon") as HTMLDivElement
    
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
      if (fabricCanvasRef.current) {
        switch (s.currentMode){
          case Mode.Draw:
            handleDrawMode(
              s,
              fabricCanvasRef.current,
              selectedFabricImageRef.current,
              selectedImageInfoRef.current,
              selectedLabelRef.current,
              setAnnotations,
            )
            break
          case Mode.Pan:
            handlePanMode(s, fabricCanvasRef.current)
            break
          default:
        }

        if (imagesRef.current.length > 0 && selectedImageInfoRef.current){
          const newImageIndex = s.upArrowPressed ? (Math.min(imagesRef.current.length - 1, selectedImageInfoRef.current.imageIndex + 1)) 
          : (s.downArrowPressed ? (Math.max(0, selectedImageInfoRef.current.imageIndex - 1)) : (
            null
          ))
          if (newImageIndex !== null){
            setSelectedImageInfo((prevImageInfo) => {
              if (prevImageInfo && selectedImageInfoRef.current){
                return ({
                  image: imagesRef.current[newImageIndex],
                  imageIndex: newImageIndex,
                })
              }else{
                return null
              }
            })
          }
        }
      }  
    })

    return () => {
      subscription.unsubscribe(); 
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [])

  useEffect(() => {
    selectedImageInfoRef.current = selectedImageInfo;
    if (selectedImageInfo && fabricCanvasRef.current){
      addImage(
        selectedImageInfo.image, 
        fabricCanvasRef.current, 
        setSelectedFabricImage,
        annotationsRef.current, 
        selectedImageInfo.imageIndex
      )
    }
  }, [selectedImageInfo]);
  
  useEffect(() => {
    annotationsRef.current = annotations;
  }, [annotations]);

  useEffect(() => {
    selectedLabelRef.current = selectedLabel;
  }, [selectedLabel]);

  useEffect(() => {
    imagesRef.current = images
  }, [images]);

  useEffect(() => {
    selectedFabricImageRef.current = selectedFabricImage;
  }, [selectedFabricImage]);

  return (
    <div className="h-screen w-screen">
      <div className="flex h-full w-full">
        <div className="w-64 h-full bg-gray-600">
          <ImageGallery 
            images={images}
            setImages={setImages}
            setAnnotations={setAnnotations}
            setSelectedImageInfo={setSelectedImageInfo}
            />
          <Labels 
            selectedLabel={selectedLabel} 
            setSelectedLabel={setSelectedLabel} 
          />
        </div>
        <SideBar/>
        <div className="w-3/4 h-full bg-gray-900" id="canvasContainer">
          <canvas className="w-full h-full" id="canvas"></canvas>
        </div>
        <div className="w-1/4 h-full bg-gray-800">
          <div className="w-full h-1/3 bg-gray-800 border-4 border-cyan-100">
            <ImageAnnotation 
              annotations={annotations}
              images={images}
              selectedImageInfo={selectedImageInfo}
              />
          </div>
          <div className="w-full h-1/3 bg-gray-800 border-4 border-cyan-100"></div>
          <div className="w-full h-1/3 bg-gray-800 border-4 border-cyan-100"></div>
        </div>
      </div>
    </div>
  );
}

export default App
