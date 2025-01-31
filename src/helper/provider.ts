import { ImageFile, SelectedImage } from "./types"
import { createContext, SetStateAction } from "react"
export type { ImageState }
export { ImageContext }

interface ImageState {
    images: ImageFile[],
    setImages: React.Dispatch<SetStateAction<ImageFile[]>>,
    selectedImageInfo: SelectedImage | null,
    setSelectedImageInfo: React.Dispatch<SetStateAction<SelectedImage | null>>,
}
  
const ImageContext = createContext<ImageState | undefined>(undefined)


