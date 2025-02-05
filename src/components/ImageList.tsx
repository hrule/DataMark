import { useContext } from "react"
import { ImageContext } from "../helper/provider"
import { ImageFile } from "../helper/types"
import { getImageURL } from "../helper/util"




const ImageList = () => {
    const imageCtx = useContext(ImageContext)

    if (imageCtx !== undefined){
        if (imageCtx.images.length === 0) {
            return null
        } 
    }

    const images = imageCtx ? imageCtx.images : []

    const handleImageClick = (image: ImageFile, index: number) => {
        // Ensure that if the same image is clicked, rerenders do not occur. 
        if (imageCtx !== undefined){
            if (imageCtx.selectedImageInfo !== null){
                if (imageCtx.selectedImageInfo.image !== image && imageCtx.selectedImageInfo.imageIndex !== index) {
                    imageCtx.setSelectedImageInfo({image: image, imageIndex: index})
                }
            } else {
                imageCtx.setSelectedImageInfo({image: image, imageIndex: index})
            }
        }
    };

    return (
        <ul className="space-y-4 max-h-full overflow-y-auto bg-gray-800 rounded-md p-4 hide-scrollbar">
            {images.map((image, index) => (
                <li
                    key={index}
                    className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded-md"
                    onClick={() => handleImageClick(image, index)}
                >
                    <img
                        // src={image.imageURL}
                        src={getImageURL(image.imageName)}
                        alt={image.imageName}
                        className="w-12 h-12 object-cover rounded-md"
                    />
                    <span className="ml-4 text-white">{image.imageName}</span>
                </li>
            ))}
        </ul>
    )
}

export default ImageList
