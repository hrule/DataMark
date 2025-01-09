import { useState } from "react";
import { Annotation, ImageFile } from "../helper/types";
import ExportButton from "./ExportButton";
import JSZip from "jszip"; // Install with npm install jszip
import { saveAs } from "file-saver"; // Install with npm install file-saver
import ConfirmationModal from "./ConfirmationModal";

interface ExportProps {
    annotations: Annotation[][];
    images: ImageFile[];
}

const Export: React.FC<ExportProps> = ({
    annotations,
    images,
}) => {
    const [exportFormat, setExportFormat] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    const fetchImageBlob = async (url: string): Promise<Blob> => {
        const response = await fetch(url);
        return response.blob();
    };
    
    const handleExport = async (annotations: Annotation[][], images: ImageFile[], formats: string[]) => {
        // Currently, no difference between export formats, but can be added later on.
        const selectedFormat = exportFormat || "yolov5";
        const zip = new JSZip();
        
        // zip two arrays of same length together. [image, annotation] format.
        const allFiles:[ImageFile, Annotation[]][] = images.map((image, index) => [image, annotations[index]]);
    
        // Split into train/valid/test 70/20/10 ratios
        const trainSplit = Math.floor(0.7 * images.length);
        const validSplit = Math.floor(0.9 * images.length);
    
        const splits = {
            train: allFiles.slice(0, trainSplit),
            valid: allFiles.slice(trainSplit, validSplit),
            test: allFiles.slice(validSplit),
        };

        for (const [split, files] of Object.entries(splits)) {
            const imagesFolder = zip.folder(`${split}/images`);
            const labelsFolder = zip.folder(`${split}/labels`);
        
            for (const [image, imageAnnotations] of files) {
                const blob = await fetchImageBlob(image.url); // Fetch image blob
                const content = imageAnnotations.map(formatAnnotation).join("\n");
                const baseName = image.name.replace(/\.[^/.]+$/, ""); // Remove extension
        
                if (imagesFolder) {
                    imagesFolder.file(image.name, blob); // Add image as a blob
                }
                if (labelsFolder) {
                    labelsFolder.file(`${baseName}.txt`, content); // Add corresponding label
                }
            }
        }

        zip.generateAsync({ type: "blob" }).then((blob) => {
            saveAs(blob, "annotations.zip");
        });
    };

    const formatAnnotation = (annotation: Annotation) => {
        return `${annotation.labelIndex} ${annotation.left} ${annotation.top} ${annotation.width} ${annotation.height}`
    }
    
    const convertAnnotationsToFormat = (annotations: Annotation[][], formats: string[], selectedFormat: string) => {
        if (formats.includes(selectedFormat)) {
            return annotations
            .flatMap((imageAnnotations) =>
                imageAnnotations.map(formatAnnotation)
            )
            .join("\n");
        }
        return JSON.stringify(annotations, null, 2); 
    };

    const handleButtonClick = (formats: string[]) => {
        const unannotatedCount = annotations.filter((a) => a.length === 0).length;
        if (unannotatedCount > 0) {
            setShowModal(true);
        } else {
            handleExport(annotations, images, formats);
        }
    };

    const formats = ["yolov5", "yolov7", "yolov8"]

    return (
        <div className="bg-gray-800 text-white p-4 rounded">
            <h3 className="text-lg font-bold mb-2">Select Export Format</h3>
            <div className="space-y-2">
                {formats.map((format) => (
                    <ExportButton 
                        key={format} 
                        format={format} 
                        onClick={() => {
                            setExportFormat(format);
                            handleButtonClick(formats);
                        }}
                    />
                ))}
            </div>
            {showModal && (
                <ConfirmationModal
                    unannotatedCount={annotations.filter((a) => a.length === 0).length}
                    onConfirm={() => {
                        setShowModal(false);
                        handleExport(annotations, images, formats);
                    }}
                    onCancel={() => setShowModal(false)}
                />
            )}
        </div>
    );
}

export default Export