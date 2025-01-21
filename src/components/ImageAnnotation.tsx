import { useState } from "react";
import { ImageFile, SelectedImage } from "../helper/types";
import AnnotationList from "./AnnotationList";

interface ImageAnnotationProps {
  images: ImageFile[];
  selectedImageInfo: SelectedImage | null;
  fabricCanvas: fabric.Canvas | null;
  annotationCount: number;
}

const ImageAnnotation: React.FC<ImageAnnotationProps> = ({
  images,
  selectedImageInfo,
  fabricCanvas,
  annotationCount,
}) => {
  const [showFullDetails, setShowFullDetails] = useState<boolean>(false);

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

      {(images.length > 0 &&
        selectedImageInfo !== null &&
        selectedImageInfo?.imageIndex >= 0 &&
        selectedImageInfo?.imageIndex <= images.length - 1) ? (
        <>
          <h2 className="text-white font-bold mb-2">
            {images[selectedImageInfo.imageIndex].imageName}
          </h2>

          <AnnotationList 
            selectedImageInfo={selectedImageInfo}
            showFullDetails={showFullDetails}
            fabricCanvas={fabricCanvas}
            annotationCount={annotationCount}
          />
        </>
      ) : (
        <></>
      )}
    </div>
  );
};

export default ImageAnnotation;

