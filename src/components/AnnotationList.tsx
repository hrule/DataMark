import React from "react";
import { Annotation } from "../helper/types";

interface AnnotationListProps {
    annotations: Annotation[];
    showFullDetails: boolean;
    onDelete: (annotationId: string) => void;
}

const AnnotationList: React.FC<AnnotationListProps> = ({ 
    annotations,
    showFullDetails,
    onDelete
}) => {
    if (annotations.length === 0) return null;

    return (
        <ul className="overflow-y-auto max-h-80 bg-gray-700 rounded p-2">
            {annotations.map((annotation, index) => (
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
                  onClick={() => onDelete(annotation.annotationId)}
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