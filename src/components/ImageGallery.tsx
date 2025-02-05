import React, { useContext, useEffect, useState, memo } from "react"
import { ImageFile, SelectedImage } from "../helper/types"
import { getImagesPaginated, postImageFile } from "../helper/server"
import ImageList from "./ImageList"
import { ImageContext } from "../helper/provider"

const ImageGallery = memo(() => {
  const [page, setPage] = useState(0)

  const imageCtx = useContext(ImageContext)

  const handleFileInput = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files ? Array.from(event.target.files) : []
    if (files && imageCtx !== undefined) {
      const imageFiles = files.filter((file) => file.type.startsWith("image/"))

      for (const imageFile of imageFiles) {
        await postImageFile(imageFile)
      }

      const imageList = imageFiles.map((file) => ({
        imageName: file.name,
        // imageURL: URL.createObjectURL(file),
        imageURL: "",
      }))
      imageCtx.setImages(imageList.slice(0, 10))

      // In the case of changing file input, make selected image empty.
      imageCtx.setSelectedImageInfo((prev) => (prev ? null : prev))
    }
  }

  const prevPage = async (currentPage: number) => {
    if (currentPage - 1 >= 0 && imageCtx !== undefined) {
      setPage((p) => (p > 0 ? p - 1 : p))
      const imageEntries = await getImagesPaginated(currentPage - 1)
      const imageFiles: ImageFile[] = imageEntries
      imageCtx.setImages(imageFiles)
      imageCtx.setSelectedImageInfo((prev) =>
        switchSelectedImageByPageChange(prev, imageFiles),
      )
    }
  }

  const nextPage = async (currentPage: number) => {
    // Should make a request that confirms whether page number exists.
    // Currently works because if page number doesn't exist, error returned.
    const imageEntries = await getImagesPaginated(currentPage + 1)
    if (imageEntries && imageCtx) {
      const imageFiles: ImageFile[] = imageEntries
      if (imageFiles.length > 0) {
        setPage((p) => p + 1)
      }
      imageCtx.setImages(imageFiles)
      imageCtx.setSelectedImageInfo((prev) =>
        switchSelectedImageByPageChange(prev, imageFiles),
      )
    }
  }

  const switchSelectedImageByPageChange = (
    prev: SelectedImage | null,
    imageFiles: ImageFile[],
  ): SelectedImage | null => {
    // Make sure that if the page is going to change, the selectedImage is reasonable.
    // This fn makes it image at the same current index unless it is out of bounds.
    if (prev) {
      const prevImageIndex =
        prev.imageIndex < imageFiles.length ? prev.imageIndex : 0
      return {
        image: {
          imageName: imageFiles[prevImageIndex].imageName,
          imageURL: "",
        },
        imageIndex: prev.imageIndex,
      }
    } else {
      return prev
    }
  }

  useEffect(() => {
    const handleSideArrowKeys = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        prevPage(page)
      } else if (event.key === "ArrowRight") {
        nextPage(page)
      }
    }

    window.addEventListener("keydown", handleSideArrowKeys)
    return () => {
      window.removeEventListener("keydown", handleSideArrowKeys)
    }
  }, [page])

  return (
    <div className="p-8 h-full flex flex-col">
      {/* File Input */}
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        className="image-input"
        id="image-upload"
      />
      {/* Image List */}
      <div className="flex gap-8 h-5/6">
        <div className="w-full h-full">
          <ImageList />
        </div>
      </div>
      {/* Buttons and Instructions */}
      <div className="flex justify-between items-center mt-4 h-1/12">
        <button className="page-button" onClick={() => prevPage(page)}>
          &#8592; Previous Page
        </button>
        <button className="page-button" onClick={() => nextPage(page)}>
          Next Page &#8594;
        </button>
      </div>
      <div className="h-1/12">
        <p className="mt-2 text-center text-sm text-gray-400">
          Use the up and down arrow keys to change images. Use the left and
          right arrow keys to change pages.
        </p>
      </div>
    </div>
  )
})

export default ImageGallery
