import React from "react";
import { Annotation, SelectedImage } from "../types";

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
    console.log("set image index to", index)
    setSelectedImageInfo({image: image, imageIndex: index})
  };

  return (
    <div className="p-8">
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      <div className="flex gap-8 mt-6">
        <div className="w-1/3">
            <ul className="space-y-4">
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
