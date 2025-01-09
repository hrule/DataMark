import { fromEventPattern } from "rxjs";
import { Annotation, Rectangle, SelectedImage, State } from "./types";
import { fabric } from 'fabric'
import { createRectangle } from "./view";

export { createFabricEventObservable, handlePanMode, handleDrawMode, coordinateToScaled, scaledToCoordinates }

const createFabricEventObservable = (fabricCanvas: fabric.Canvas, eventName: string) => {
  return fromEventPattern(
    (handler) => fabricCanvas.on(eventName, handler),
    (handler) => fabricCanvas.off(eventName, handler)
  );
}

const removeLinesFromCanvas = (canvas: fabric.Canvas) => {
  const allObjects = canvas.getObjects('line');
  allObjects.forEach((obj) => {
    canvas.remove(obj); 
  });
  canvas.requestRenderAll();
}

const addDottedLine = (canvas: fabric.Canvas, points: number[]) => {
  const DOTTED_LINE_PROPS = {
    strokeDashArray: [5, 5],
    stroke: 'white'
  }
  canvas.add(new fabric.Line(points, DOTTED_LINE_PROPS))
}

const addXLine = (canvas: fabric.Canvas, x: number) => {
  const panOffset = getPanOffset(canvas);
  const adjustedX = x - panOffset.x; // Adjust for pan
  addDottedLine(canvas, [adjustedX, 0, adjustedX, canvas.getHeight()]);
};

const addYLine = (canvas: fabric.Canvas, y: number) => {
  const panOffset = getPanOffset(canvas);
  const adjustedY = y - panOffset.y; // Adjust for pan
  addDottedLine(canvas, [0, adjustedY, canvas.getWidth(), adjustedY]);
};

const getPanOffset = (canvas: fabric.Canvas) => {
  const transform = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
  return {
    x: transform[4],
    y: transform[5],
  };
};

const dimCanvas = (canvas: fabric.Canvas, x1: number, y1: number, x2: number, y2: number) => {
  const panOffset = getPanOffset(canvas);

  // Adjust mouse coordinates (x2, y2) by pan offset
  const adjustedX2 = x2 - panOffset.x;
  const adjustedY2 = y2 - panOffset.y;

  // const left = Math.min(x1, x2);  
  // const top = Math.min(y1, y2);   
  // const width = Math.max(x1, x2) - left; 
  // const height = Math.max(y1, y2) - top; 

  const left = Math.min(x1, adjustedX2);  
  const top = Math.min(y1, adjustedY2);   
  const width = Math.max(x1, adjustedX2) - left; 
  const height = Math.max(y1, adjustedY2) - top; 

  const dimRect = new fabric.Rect({
    name: 'temporary',
    left: 0,
    top: 0,
    width: canvas.getWidth(),
    height: canvas.getHeight(),
    fill: 'rgba(0, 0, 0, 0.5)', 
    selectable: false,
    evented: false,
  });

  const clearRect = new fabric.Rect({
    name: 'temporary',
    left: left,
    top: top,
    width: width,
    height: height,
    fill: 'rgba(255, 255, 255, 0.5)', 
    selectable: false,
    evented: false,
  });

  canvas.add(dimRect);
  canvas.add(clearRect);

  canvas.requestRenderAll();
}

const undimCanvas = (canvas: fabric.Canvas) => {
  canvas.getObjects().forEach((obj) => {
    if (obj.name === 'temporary') {
      canvas.remove(obj)
  }})
  canvas.requestRenderAll()
}

const handleDrawMode = (
  state: State, 
  fabricCanvas: fabric.Canvas,
  selectedFabricImage: fabric.Image | null,
  selectedImageInfo: SelectedImage | null,
  selectedLabelIndex: number,
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[][]>>,
) => {
  fabricCanvas.setCursor('crosshair')

  removeLinesFromCanvas(fabricCanvas)
  addXLine(fabricCanvas, state.mouseX)
  addYLine(fabricCanvas, state.mouseY)

  if (state.mouseDown && selectedFabricImage){
    undimCanvas(fabricCanvas)
    dimCanvas(fabricCanvas, state.rectStartX, state.rectStartY, state.mouseX, state.mouseY)
  }
  
  if (state.mouseUp){
    undimCanvas(fabricCanvas)
  }

  if (state.renderRectangle){
    const rectangleToRender: Rectangle = {
      left: state.rectStartX,
      top: state.rectStartY,
      width: state.rectEndX - state.rectStartX,
      height: state.rectEndY - state.rectStartY,
    }

    createRectangle(fabricCanvas, rectangleToRender)
    
    if (selectedFabricImage && selectedImageInfo){
      const fabricImage = selectedFabricImage
      const scaledRect = coordinateToScaled(fabricImage, rectangleToRender)

      const newAnnotation: Annotation = {
        ...scaledRect,
        labelIndex: selectedLabelIndex, 
      };

      setAnnotations((prevAnnotations) => {
        const updatedAnnotations = [...prevAnnotations];
        if (selectedImageInfo?.imageIndex !== undefined){
          updatedAnnotations[selectedImageInfo.imageIndex] = [
            ...(updatedAnnotations[selectedImageInfo.imageIndex] || []),
            newAnnotation,
          ];
        }
        return updatedAnnotations;
      });
    }
  }
}

const handlePanMode = (state: State, fabricCanvas: fabric.Canvas) => {
  fabricCanvas.setCursor('grab')
  removeLinesFromCanvas(fabricCanvas)
  if (state.mouseDown) {
    fabricCanvas.setCursor('grabbing'); 
    fabricCanvas.relativePan(new fabric.Point(state.panMoveX, state.panMoveY));
  }
  fabricCanvas.requestRenderAll();
}

const coordinateToScaled = (
  img: fabric.Image, 
  rect: Rectangle,
): Rectangle => {
  const imageLeft = img.left || 0
  const imageTop = img.top || 0
  const imageWidth = img.getScaledWidth()
  const imageHeight = img.getScaledHeight()

  const scaledRectLeft = ((rect.left || 0) - imageLeft) / imageWidth
  const scaledRectTop = ((rect.top || 0) - imageTop) / imageHeight
  const scaledRectWidth = rect.width / imageWidth
  const scaledRectHeight = rect.height / imageHeight

  return ({left: scaledRectLeft, top: scaledRectTop, width: scaledRectWidth, height: scaledRectHeight})
}

const scaledToCoordinates = (
  img: fabric.Image,
  rect: Rectangle,
):Rectangle => {
  const imgScaledWidth = img.getScaledWidth();
  const imgScaledHeight = img.getScaledHeight();
  const imgLeft = img.left || 0;
  const imgTop = img.top || 0;

  const rectWidth = rect.width * imgScaledWidth;
  const rectHeight = rect.height * imgScaledHeight;
  const rectLeft = imgLeft + rect.left * imgScaledWidth; 
  const rectTop = imgTop + rect.top * imgScaledHeight;   

  return ({left: rectLeft, top: rectTop, width: rectWidth, height: rectHeight})
}