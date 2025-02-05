import { SetStateAction } from "react";
import { deleteAllData, getImagesPaginated, getMaxAnnotationCount } from "../helper/server";
import { ImageFile, SelectedImage } from "../helper/types";

interface LoadStatePopupProps {
  setShowLoadPopup: React.Dispatch<SetStateAction<boolean>>,
  setImages: React.Dispatch<SetStateAction<ImageFile[]>>,
  setSelectedImageInfo: React.Dispatch<SetStateAction<SelectedImage | null>>,
  setLabels: React.Dispatch<SetStateAction<string[]>>,
  setAnnotationCount: React.Dispatch<SetStateAction<number>>,
}

const LoadStatePopup:React.FC<LoadStatePopupProps> = ({
    setShowLoadPopup,
    setImages,
    setSelectedImageInfo,
    setLabels,
    setAnnotationCount
}) => {
    const handleLoad = async () => {
        const firstPage = await getImagesPaginated(0)
        setImages(firstPage)
        setSelectedImageInfo((_) => ({
        image: firstPage[0],
        imageIndex: 0
        }))
        const maxAnnotationCount = await getMaxAnnotationCount()
        if (maxAnnotationCount){
            setAnnotationCount(maxAnnotationCount + 1)
        }
        setShowLoadPopup(false)
    }

    const handleRestart = async () => {
        deleteAllData()
        setLabels([])
        setShowLoadPopup(false)
    }

    return (
        <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center z-50 pointer-events-auto">
            <div className="bg-slate-200 p-6 rounded-lg shadow-lg text-center relative">
                <h2 className="text-lg font-semibold mb-4">There exists data from a previous session. Load or start anew?</h2>
                <div className="flex justify-center space-x-4">
                    <button
                        className="px-4 py-2 w-32 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => {
                            handleLoad();
                        }}
                    >
                        Load Previous
                    </button>
                    <button
                        className="px-4 py-2 w-32 bg-red-500 text-white rounded hover:bg-red-600"
                        onClick={() => {
                            handleRestart();
                        }}
                    >
                        Restart
                    </button>
                </div>
            </div>
        </div>
    );
    
};

export default LoadStatePopup;
