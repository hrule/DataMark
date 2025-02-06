import { fabric } from "fabric"
import {
  Rectangle,
  SelectedImage,
  UNSELECTABLE_IMAGE_PROPS,
  UNSELECTABLE_OBJECT_PROPS,
} from "./types"
import { getImageURL, scaledToCoordinates } from "./util"
import { getAnnotationsByImageName } from "./server"
export {
  setBackground,
  initCanvas,
  resizeCanvas,
  clearCanvas,
  createRectangle,
  addImage,
  removeAnnotation,
  createLabelText,
  renderAnnotation,
}

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
  canvas.setWidth(container.clientWidth)
  canvas.setHeight(container.clientHeight)
  canvas.renderAll()
}

const clearCanvas = (canvas: fabric.Canvas) => {
  canvas.getObjects().forEach((o) => {
    if (o !== canvas.backgroundImage) {
      canvas.remove(o)
    }
  })
}

const createRectangle = (
  canvas: fabric.Canvas,
  rect: Rectangle,
  id: string,
) => {
  const fabricRect = new fabric.Rect({
    ...rect,
    fill: "green",
    opacity: 0.2,
    ...UNSELECTABLE_OBJECT_PROPS,
    // Will use name for now, because can't use id, makes removing hard (typescript)
    name: id, 
  })
  // fabricRect.set('id', )
  canvas.add(fabricRect)
  canvas.requestRenderAll()
}

const createLabelText = (fabricCanvas: fabric.Canvas, rect: Rectangle, label: string, id: string) => {
  // Make text and background objects has same name as corresponding rectangle. 
  // Easier to find and delete.
  const text = new fabric.Text(label, {
    left: rect.left + 5, 
    top: rect.top - 5, 
    fontSize: 24,
    textAlign: 'left', 
    fill: 'white', 
    originX: 'left', 
    originY: 'bottom',
    ...UNSELECTABLE_OBJECT_PROPS,
    name: id,
  });

  const textWidth = text.width ?? 0;

  const background = new fabric.Rect({
    left: rect.left, 
    top: rect.top - 35, 
    width: textWidth + 10, 
    height: 35, 
    fill: 'green', 
    opacity: 0.75,
    ...UNSELECTABLE_OBJECT_PROPS,
    name: id,
  });

  fabricCanvas.add(background);
  fabricCanvas.add(text);
};

/**
 * Render the bounding box and label of the annotation to the fabric.js canvas.
 * @param canvas 
 * @param rect 
 * @param label 
 */
const renderAnnotation = (canvas: fabric.Canvas, rect: Rectangle, label: string, id: string) => {
  createRectangle(canvas, rect, id)
  createLabelText(canvas, rect, label, id)
}

const removeAnnotation = (canvas: fabric.Canvas, id: string) => {
  canvas.getObjects().forEach((o) => {
    if (o.name === id) {
      canvas.remove(o)
    }
  })
}

/**
 * Called whenever image is switched.
 * Clears canvas, loads image scaled and centered, adds all annotation boxes.
 *
 * @param image
 * @param canvas
 * @param setSelectedFabricImage
 * @param annotations
 */
const addImage = async (
  canvas: fabric.Canvas,
  setSelectedFabricImage: React.Dispatch<
    React.SetStateAction<fabric.Image | null>
  >,
  selectedImageInfo: SelectedImage,
  labels: string[],
) => {
  try {
    const img = await loadImage(getImageURL(selectedImageInfo.image.imageName))

    canvas.clear()

    if (img) {
      const canvasWidth = canvas.getWidth() ?? 0
      const canvasHeight = canvas.getHeight() ?? 0
      const imageWidth = img.width as number
      const imageHeight = img.height as number

      const scaleFactor =
        canvasWidth / imageWidth < canvasHeight / imageHeight
          ? (canvasWidth * 0.9) / imageWidth
          : (canvasHeight * 0.9) / imageHeight

      img.set({
        scaleX: scaleFactor,
        scaleY: scaleFactor,
        left: (canvasWidth - img.getScaledWidth()) / 2,
        top: (canvasHeight - img.getScaledHeight()) / 2,
        ...UNSELECTABLE_IMAGE_PROPS,
      })

      canvas.add(img)
      img.center()

      const imageAnnotations = await getAnnotationsByImageName(
        selectedImageInfo.image.imageName,
      )
      imageAnnotations.forEach((annotation) => {
        // Annotations are scaled. Bring them back to coordinates, then render.
        const scaledRect = annotation as Rectangle // Use ts downcasting
        const coordinateRect = scaledToCoordinates(img, scaledRect)
        renderAnnotation(canvas, coordinateRect, labels[annotation.labelIndex], annotation.annotationId)
      })

      canvas.requestRenderAll()

      setSelectedFabricImage(img)
    }
  } catch {
    console.log("error adding image")
  }
}

const loadImage = (url: string): Promise<fabric.Image> => {
  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(url, (img) => {
      if (img) {
        resolve(img)
      } else {
        reject(new Error("Failed to load image"))
      }
    })
  })
}
