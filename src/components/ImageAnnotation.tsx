import { useEffect, useState } from "react";
import { Annotation, ImageFile, SelectedImage } from "../helper/types";
import { removeRectangle } from "../helper/view";
import { deleteAnnotationFromImage, getAnnotationsByImageName } from "../helper/server";

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
  const [selectedImageAnnotations, setSelectedImageAnnotations] = useState<Annotation[]>([])
  const [showFullDetails, setShowFullDetails] = useState<boolean>(false);

  const handleDelete = (annotationId: string) => {
    if (fabricCanvas && selectedImageInfo) {
      removeRectangle(fabricCanvas, annotationId)
      deleteAnnotationFromImage(selectedImageInfo.image.imageName, annotationId)
      // Might be more efficient to filter out the annotation from the array, than refetch everything. 
      setSelectedImageAnnotations((prevAnnotations) =>
        prevAnnotations.filter((annotation) => annotation.annotationId !== annotationId)
      );
    }
  };

  useEffect(() => {
    async function getSelectedImageAnnotations() {
      if (selectedImageInfo) {
        const annotations = await getAnnotationsByImageName(selectedImageInfo.image.imageName)
        setSelectedImageAnnotations(annotations);
      }
    }
    getSelectedImageAnnotations();
  }, [selectedImageInfo, annotationCount])

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
        selectedImageInfo?.imageIndex !== undefined &&
        selectedImageInfo?.imageIndex >= 0 &&
        selectedImageInfo?.imageIndex <= images.length - 1) ? (
        <>
          <h2 className="text-white font-bold mb-2">
            {images[selectedImageInfo.imageIndex].imageName}
          </h2>

          <ul className="overflow-y-auto max-h-80 bg-gray-700 rounded p-2">

            {selectedImageAnnotations.map((annotation, index) => (
              <li
                key={index}
                className="p-2 rounded cursor-pointer bg-blue-500 text-white break-words whitespace-pre-wrap max-w-full flex justify-between items-center"
              >
                <span>
                  {showFullDetails
                    ? JSON.stringify(annotation, null, "\t")
                    : `ID: ${annotation.annotationId}`}
                </span>
                <button
                  onClick={() => handleDelete(annotation.annotationId)}
                  className="ml-2 bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <></>
      )}
    </div>
  );
};

export default ImageAnnotation;

