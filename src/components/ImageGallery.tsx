import React from "react";
import { Annotation, SelectedImage } from "../helper/types";

interface ImageFile {
  name: string;
  url: string;
}

interface ImageGalleryProps {
  images: ImageFile[];
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>;
  setAnnotations: React.Dispatch<React.SetStateAction<Annotation[][]>>;
  setSelectedImageInfo: React.Dispatch<React.SetStateAction<SelectedImage | null>>;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  setImages,
  setAnnotations,
  setSelectedImageInfo,
}) => {
  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const imageList = imageFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setImages(imageList);
    setAnnotations(Array.from({ length: imageList.length }, () => []))
    setSelectedImageInfo(null);
  };

  const handleImageClick = (image: ImageFile, index: number) => {
    setSelectedImageInfo({image: image, imageIndex: index})
  };

  return (
    <div className="p-8 h-full">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        className="image-input"
      />
      <div className="flex gap-8 max-h-full">
        <div className="w-full h-full">
            <ul className="space-y-4 max-h-[calc(100%-64px)] overflow-y-auto bg-gray-800 rounded-md p-4 hide-scrollbar">
                {images.map((image, index) => (
                <li
                    key={index}
                    className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded-md"
                    onClick={() => handleImageClick(image, index)}
                >
                    <img
                    src={image.url}
                    alt={image.name}
                    className="w-12 h-12 object-cover rounded-md"
                    />
                    <span className="ml-4 text-white">{image.name}</span>
                </li>
                ))}
            </ul>
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;
