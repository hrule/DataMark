import { useContext, useState } from "react"
import AnnotationList from "./AnnotationList"
import { ImageContext } from "../helper/provider"

interface ImageAnnotationProps {
  fabricCanvas: fabric.Canvas | null
  annotationCount: number
}

const ImageAnnotation: React.FC<ImageAnnotationProps> = ({
  fabricCanvas,
  annotationCount,
}) => {
  const [showFullDetails, setShowFullDetails] = useState<boolean>(false)

  const imageCtx = useContext(ImageContext)

  return (
    <div className="h-full p-4">
      <div className="flex justify-between items-center">
        <h2 className="panel-heading">Annotations</h2>
        {/* Switch to show details or not. */}
        <label className="flex items-center cursor-pointer">
          <span className="mr-2 text-white">Show Details</span>
          <input
            type="checkbox"
            checked={showFullDetails}
            onChange={() => setShowFullDetails(!showFullDetails)}
            className="toggle-switch"
          />
        </label>
      </div>

      {imageCtx !== undefined &&
      imageCtx.images.length > 0 &&
      imageCtx.selectedImageInfo !== null &&
      imageCtx.selectedImageInfo?.imageIndex >= 0 &&
      imageCtx.selectedImageInfo?.imageIndex <= imageCtx.images.length - 1 ? (
        <>
          <h2 className="text-white font-bold mb-2">
            {imageCtx.images[imageCtx.selectedImageInfo.imageIndex].imageName}
          </h2>

          <AnnotationList
            showFullDetails={showFullDetails}
            fabricCanvas={fabricCanvas}
            annotationCount={annotationCount}
          />
        </>
      ) : (
        <></>
      )}
    </div>
  )
}

export default ImageAnnotation
