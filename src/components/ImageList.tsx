import { useContext } from "react"
import { ImageFile } from "../helper/types"
import { ImageContext } from "../helper/provider"

interface ImageListProps {
    imageClick: (image: ImageFile, index: number) => void
}

const ImageList: React.FC<ImageListProps> = ({
    imageClick,
}) => {
    const imageCtx = useContext(ImageContext)

    if (imageCtx !== undefined){
        if (imageCtx.images.length === 0) {
            return null
        } 
    }

    const images = imageCtx ? imageCtx.images : []

    return (
        <ul className="space-y-4 max-h-full overflow-y-auto bg-gray-800 rounded-md p-4 hide-scrollbar">
            {images.map((image, index) => (
                <li
                    key={index}
                    className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded-md"
                    onClick={() => imageClick(image, index)}
                >
                    <img
                        src={image.imageURL}
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