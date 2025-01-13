import { fabric } from 'fabric'
import { Annotation, ImageFile, Rectangle, UNSELECTABLE_IMAGE_PROPS } from './types'
import { scaledToCoordinates } from './util'
export { setBackground, initCanvas, resizeCanvas, clearCanvas, createRectangle, createRectangleFromAnnotation, addImage }

const setBackground = (url: string, canvas: fabric.Canvas) => {
    fabric.Image.fromURL(url, (img) => {
      canvas.backgroundImage = img
      canvas.renderAll()
    })
}

const initCanvas = (id: string) => {
    return new fabric.Canvas(id, {
        width: 500,
        height: 500,
        selection: false,
    })
}

const resizeCanvas = (canvas: fabric.Canvas, container: HTMLElement) => {
    canvas.setWidth(container.clientWidth);
    canvas.setHeight(container.clientHeight);
    canvas.renderAll();
};

const clearCanvas = (canvas: fabric.Canvas) => {
    canvas.getObjects().forEach((o) => {
        if (o !== canvas.backgroundImage) [
        canvas.remove(o)
        ]
    });
}

const createRectangle = (canvas: fabric.Canvas, rect: Rectangle) => {
  const fabricRect = new fabric.Rect({
      ...rect,
      fill: "green",
      borderColor: "red", 
      opacity: 0.2, 
      hasRotatingPoint: false,
      lockRotation: true,
      hasControls: false,
      selectable: false,
  })
  // fabricRect.set('id', )
  canvas.add(fabricRect)
  canvas.requestRenderAll()
}

const createRectangleFromAnnotation = (canvas: fabric.Canvas | null, img: fabric.Image | null,  annotation: Annotation) => {
  if (canvas && img) {
    const scaledRect = annotation as Rectangle
    const rectCoordinates = scaledToCoordinates(img, scaledRect)
    createRectangle(canvas, rectCoordinates)
  }
}

/**
 * Called whenever image is switched.
 * Clears canvas, loads image scaled and centered, adds all annotation boxes.
 * 
 * @param image 
 * @param canvas 
 * @param setSelectedFabricImage 
 * @param annotations 
 * @param selectedImageIndex 
 */
const addImage = async (
    image: ImageFile, 
    canvas: fabric.Canvas, 
    setSelectedFabricImage: React.Dispatch<React.SetStateAction<fabric.Image | null>>,
    annotations: Annotation[][],
    selectedImageIndex: number,
) => {
    try {
      const img = await loadImage(image.url)

      canvas.clear()

      if (img){
        const canvasWidth = canvas.getWidth() ?? 0;
        const canvasHeight = canvas.getHeight() ?? 0;
        const imageWidth = img.width as number;
        const imageHeight = img.height as number;

        const scaleFactor = (canvasWidth / imageWidth < canvasHeight / imageHeight) ? 
          ((canvasWidth * 0.9) / imageWidth) 
          : ((canvasHeight * 0.9) / imageHeight)

        img.set({
          scaleX: scaleFactor,
          scaleY: scaleFactor,
          left: (canvasWidth - img.getScaledWidth()) / 2, 
          top: (canvasHeight - img.getScaledHeight()) / 2, 
          ...UNSELECTABLE_IMAGE_PROPS     
        });

        canvas.add(img);
        img.center()

        annotations[selectedImageIndex].forEach((annotation) => 
          createRectangleFromAnnotation(canvas, img, annotation)
        )

        canvas.requestRenderAll();

        setSelectedFabricImage(img)
      }
    }
    catch {
      console.log("error adding image")
    }    
}

const loadImage = (url: string): Promise<fabric.Image> => {
  return new Promise((resolve, reject) => {
      fabric.Image.fromURL(url, (img) => {
          if (img) {
              resolve(img);
          } else {
              reject(new Error("Failed to load image"));
          }
      });
  });
}