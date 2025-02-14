import { fromEventPattern } from "rxjs"
import { Annotation, ImageFile, Rectangle, SelectedImage, State } from "./types"
import { fabric } from "fabric"
import { renderAnnotation } from "./view"
import { postAnnotationToImage } from "./server"

export {
  createFabricEventObservable,
  handlePanMode,
  handleDrawMode,
  handleArrowKeyPress,
  coordinateToScaled,
  scaledToCoordinates,
  cleanupFabricCanvas,
  getImageURL,
}

const createFabricEventObservable = (
  fabricCanvas: fabric.Canvas,
  eventName: string,
) => {
  return fromEventPattern(
    (handler) => fabricCanvas.on(eventName, handler),
    (handler) => fabricCanvas.off(eventName, handler),
  )
}

const removeLinesFromCanvas = (canvas: fabric.Canvas) => {
  const allObjects = canvas.getObjects("line")
  allObjects.forEach((obj) => {
    canvas.remove(obj)
  })
  canvas.requestRenderAll()
}

const addDottedLine = (canvas: fabric.Canvas, points: number[]) => {
  const DOTTED_LINE_PROPS = {
    strokeDashArray: [5, 5],
    stroke: "white",
  }
  canvas.add(new fabric.Line(points, DOTTED_LINE_PROPS))
}

const addXLine = (canvas: fabric.Canvas, x: number) => {
  const panOffset = getPanOffset(canvas)
  const adjustedX = x - panOffset.x // Adjust for pan
  addDottedLine(canvas, [adjustedX, 0, adjustedX, canvas.getHeight()])
}

const addYLine = (canvas: fabric.Canvas, y: number) => {
  const panOffset = getPanOffset(canvas)
  const adjustedY = y - panOffset.y // Adjust for pan
  addDottedLine(canvas, [0, adjustedY, canvas.getWidth(), adjustedY])
}

const getPanOffset = (canvas: fabric.Canvas) => {
  const transform = canvas.viewportTransform || [1, 0, 0, 1, 0, 0]
  return {
    x: transform[4],
    y: transform[5],
  }
}

/**
 * Given the start and end mouse points in (x,y) coordinate form, calculate the rectangle dimensions.
 * Take into account pan offset of canvas.
 * Ensure the rectangle can be drawn no matter the difference between the two points.
 * @param canvas
 * @param x1
 * @param y1
 * @param x2
 * @param y2
 * @returns
 */
const rectFromCoordinates = (
  canvas: fabric.Canvas,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Rectangle => {
  const panOffset = getPanOffset(canvas)

  // Adjust mouse coordinates (x2, y2) by pan offset
  const adjustedX2 = x2 - panOffset.x
  const adjustedY2 = y2 - panOffset.y

  const left = Math.min(x1, adjustedX2)
  const top = Math.min(y1, adjustedY2)
  const width = Math.max(x1, adjustedX2) - left
  const height = Math.max(y1, adjustedY2) - top

  return {
    left: left,
    top: top,
    width: width,
    height: height,
  }
}

/**
 * Dim the canvas, except for an opaque rectangle showing the result of the users annotation.
 * @param canvas
 * @param rect The rectangle that will be added to the canvas upon the users mouse release.
 */
const dimCanvas = (canvas: fabric.Canvas, rect: Rectangle) => {
  const dimRect = new fabric.Rect({
    name: "temporary",
    left: 0,
    top: 0,
    width: canvas.getWidth(),
    height: canvas.getHeight(),
    fill: "rgba(0, 0, 0, 0.5)",
    selectable: false,
    evented: false,
  })

  const clearRect = new fabric.Rect({
    name: "temporary",
    ...rect,
    fill: "rgba(255, 255, 255, 0.5)",
    selectable: false,
    evented: false,
  })

  canvas.add(dimRect)
  canvas.add(clearRect)

  canvas.requestRenderAll()
}

const undimCanvas = (canvas: fabric.Canvas) => {
  canvas.getObjects().forEach((obj) => {
    if (obj.name === "temporary") {
      canvas.remove(obj)
    }
  })
  canvas.requestRenderAll()
}

const handleDrawMode = async (
  state: State,
  fabricCanvas: fabric.Canvas,
  selectedFabricImage: fabric.Image | null,
  selectedImageInfo: SelectedImage | null,
  selectedLabelIndex: number,
  annotationCount: number,
  setAnnotationCount: React.Dispatch<React.SetStateAction<number>>,
  labels: string[],
) => {
  fabricCanvas.setCursor("crosshair")

  removeLinesFromCanvas(fabricCanvas)
  addXLine(fabricCanvas, state.mouseX)
  addYLine(fabricCanvas, state.mouseY)

  const rectToRender = rectFromCoordinates(
    fabricCanvas,
    state.rectStartX,
    state.rectStartY,
    state.mouseX,
    state.mouseY,
  )

  if (state.mouseDown && selectedFabricImage) {
    undimCanvas(fabricCanvas)
    dimCanvas(fabricCanvas, rectToRender)
  }

  if (state.mouseUp) {
    undimCanvas(fabricCanvas)
  }

  if (state.renderRectangle && selectedFabricImage && selectedImageInfo) {
    const fabricImage = selectedFabricImage

    const scaledRect = coordinateToScaled(fabricImage, rectToRender)

    const newAnnotationId = `annotation${annotationCount}`

    const newAnnotation: Annotation = {
      annotationId: newAnnotationId,
      labelIndex: selectedLabelIndex,
      ...scaledRect,
    }

    // createRectangle(fabricCanvas, rectangleToRender, newAnnotationId)
    // createLabelText(fabricCanvas, rectangleToRender, labels[selectedLabelIndex], newAnnotationId)
    renderAnnotation(fabricCanvas, rectToRender, labels[selectedLabelIndex], newAnnotationId)

    await postAnnotationToImage(selectedImageInfo.image.imageName, newAnnotation)
    
    setAnnotationCount((prev) => prev + 1)
  }
}

const handlePanMode = (state: State, fabricCanvas: fabric.Canvas) => {
  fabricCanvas.setCursor("grab")
  removeLinesFromCanvas(fabricCanvas)
  if (state.mouseDown) {
    fabricCanvas.setCursor("grabbing")
    fabricCanvas.relativePan(new fabric.Point(state.panMoveX, state.panMoveY))
  }
  fabricCanvas.requestRenderAll()
}

const handleArrowKeyPress = (
  state: State,
  images: ImageFile[],
  selectedImageInfo: SelectedImage | null,
  setSelectedImageInfo: React.Dispatch<
    React.SetStateAction<SelectedImage | null>
  >,
) => {
  const imagesLength = images.length
  if (imagesLength > 0 && selectedImageInfo) {
    // If up arrow key is pressed, new image index is increased if not already at max.
    // Similar logic for down arrow key.
    // If neither key pressed, null and don't do anything.
    const newImageIndex = state.upArrowPressed
      ? Math.min(imagesLength - 1, selectedImageInfo.imageIndex + 1)
      : state.downArrowPressed
        ? Math.max(0, selectedImageInfo.imageIndex - 1)
        : null

    if (newImageIndex !== null) {
      setSelectedImageInfo((prevImageInfo) => {
        if (prevImageInfo && selectedImageInfo) {
          return {
            image: images[newImageIndex],
            imageIndex: newImageIndex,
          }
        } else {
          return null
        }
      })
    }
  }
}

const coordinateToScaled = (img: fabric.Image, rect: Rectangle): Rectangle => {
  const imageLeft = img.left || 0
  const imageTop = img.top || 0
  const imageWidth = img.getScaledWidth()
  const imageHeight = img.getScaledHeight()

  const scaledRectLeft = ((rect.left || 0) - imageLeft) / imageWidth
  const scaledRectTop = ((rect.top || 0) - imageTop) / imageHeight
  const scaledRectWidth = rect.width / imageWidth
  const scaledRectHeight = rect.height / imageHeight

  return {
    left: scaledRectLeft,
    top: scaledRectTop,
    width: scaledRectWidth,
    height: scaledRectHeight,
  }
}

const scaledToCoordinates = (img: fabric.Image, rect: Rectangle): Rectangle => {
  const imgScaledWidth = img.getScaledWidth()
  const imgScaledHeight = img.getScaledHeight()
  const imgLeft = img.left || 0
  const imgTop = img.top || 0

  const rectWidth = rect.width * imgScaledWidth
  const rectHeight = rect.height * imgScaledHeight
  const rectLeft = imgLeft + rect.left * imgScaledWidth
  const rectTop = imgTop + rect.top * imgScaledHeight

  return { left: rectLeft, top: rectTop, width: rectWidth, height: rectHeight }
}

const cleanupFabricCanvas = (
  fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>,
) => {
  if (fabricCanvasRef.current) {
    fabricCanvasRef.current.dispose()
    fabricCanvasRef.current = null
  }
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL

const getImageURL = (imageName: string) => {
  return `${BASE_URL}/uploads/${encodeURIComponent(imageName)}`
}
