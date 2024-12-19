import { fromEventPattern } from "rxjs";
import { Annotation, Rectangle, SelectedImage, State } from "./types";
import { fabric } from 'fabric'
import { createRectangle } from "./view";

export { createFabricEventObservable, handlePanMode, handleDrawMode, coordinatesToScaled, scaledToCoordinates }

const createFabricEventObservable = (fabricCanvas: fabric.Canvas, eventName: string) => {
  return fromEventPattern(
    (handler) => fabricCanvas.on(eventName, handler),
    (handler) => fabricCanvas.off(eventName, handler)
  );
}

const handleDrawMode = (
  state: State, 
  fabricCanvas: fabric.Canvas,
  selectedFabricImage: fabric.Image | null,
  selectedImageInfo: SelectedImage | null,
  selectedLabel: string,
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[][]>>,
) => {
  fabricCanvas.setCursor('crosshair')
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
      const scaledRect = coordinatesToScaled(fabricImage, rectangleToRender)

      const newAnnotation: Annotation = {
        ...scaledRect,
        label: selectedLabel, 
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
  if (state.mouseDown) {
    fabricCanvas.setCursor('grabbing'); 
    fabricCanvas.relativePan(new fabric.Point(state.panMoveX, state.panMoveY));
  }
  fabricCanvas.requestRenderAll();
}

const coordinatesToScaled = (
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