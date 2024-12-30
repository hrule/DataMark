import React, { useState } from "react";
import { Annotation, ImageFile, SelectedImage } from "../types";

interface ImageAnnotationProps {
  annotations: Annotation[][];
  images: ImageFile[];
  selectedImageInfo: SelectedImage | null;
}

const ImageAnnotation: React.FC<ImageAnnotationProps> = ({
  annotations,
  images,
  selectedImageInfo,
}) => {
  const [exportFormat, setExportFormat] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false); 

  const handleExport = () => {
    const format = exportFormat || "yolov5"; 
    const data = convertAnnotationsToFormat(annotations, format);
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `annotations-${format}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const formatAnnotation = (annotation: Annotation) => {
    return `${annotation.label} ${annotation.left} ${annotation.top} ${annotation.width} ${annotation.height}`
  }

  const convertAnnotationsToFormat = (annotations: Annotation[][], format: string) => {
    if (format === "yolov5" || format === "yolov7" || format === "yolov8") {
      return annotations
        .flatMap((imageAnnotations) =>
          imageAnnotations.map(formatAnnotation)
        )
        .join("\n");
    }
    return JSON.stringify(annotations, null, 2); 
  };

  return (
    <div className="h-full p-4">
      {(images.length > 0 && (selectedImageInfo?.imageIndex !== undefined) && (selectedImageInfo?.imageIndex >= 0) && (selectedImageInfo?.imageIndex <= images.length - 1)) ? (
        <>
          <h2 className="text-white font-bold mb-2">{images[selectedImageInfo.imageIndex].name}</h2>

          <ul className="overflow-y-auto max-h-80 bg-gray-700 rounded p-2">
            {annotations[selectedImageInfo.imageIndex].map((annotation, index) => (
              <li
                key={index}
                className={
                  "p-2 rounded cursor-pointer bg-blue-500 text-white break-words whitespace-pre-wrap max-w-full"
                }
              >
                {JSON.stringify(annotation, null, "\t")}
              </li>
            ))}
          </ul>

          <button
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => setShowPopup(true)}
          >
            Export All
          </button>
        </>
      ) : (
        <></>
      )}

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-gray-800 text-white p-4 rounded">
            <h3 className="text-lg font-bold mb-2">Select Export Format</h3>
            <div className="space-y-2">
              {["yolov5", "yolov7", "yolov8"].map((format) => (
                <button
                  key={format}
                  className="w-full px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                  onClick={() => {
                    setExportFormat(format);
                    setShowPopup(false);
                    handleExport();
                  }}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              className="mt-4 px-4 py-2 bg-red-600 rounded hover:bg-red-700"
              onClick={() => setShowPopup(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageAnnotation;