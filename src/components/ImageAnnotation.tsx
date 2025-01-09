import { Annotation, ImageFile, SelectedImage } from "../helper/types";

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
        </>
      ) : (
        <></>
      )}
    </div>
  );
};

export default ImageAnnotation;