import React, { useEffect, useState } from "react";
import { Annotation, SelectedImage } from "../helper/types";
import { deleteAnnotationFromImage, getAnnotationsByImageName } from "../helper/server";
import { removeRectangle } from "../helper/view";

interface AnnotationListProps {
    selectedImageInfo: SelectedImage | null;
    showFullDetails: boolean;
    fabricCanvas: fabric.Canvas | null;
    annotationCount: number;
}

const AnnotationList: React.FC<AnnotationListProps> = ({ 
    selectedImageInfo,
    showFullDetails,
    fabricCanvas,
    annotationCount
    // onDelete
}) => {
  const [selectedImageAnnotations, setSelectedImageAnnotations] = useState<Annotation[]>([])
  
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
  }, [annotationCount])

    return (
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
    );
};

export default AnnotationList