import { useRef, useState } from "react";
import { Annotation, APIImageEntry, ImageFile } from "../helper/types";
import ExportButton from "./ExportButton";
import JSZip from "jszip"; 
import { saveAs } from "file-saver"; 
import ConfirmationModal from "./ConfirmationModal";
import { getAllData, getLabels } from "../helper/server";

const Export = () => {
    const unannotatedCount = useRef(0)
    const [exportFormat, setExportFormat] = useState<string | null>(null)
    const [showModal, setShowModal] = useState(false)

    const fetchImageBlob = async (url: string): Promise<Blob> => {
        const response = await fetch(url)
        return response.blob()
    };

    const splitData = (allData: APIImageEntry[]) => {
        const relevantData: [ImageFile, Annotation[]][] = allData.map((entry) => [{
            imageName: entry.imageName,
            imageURL: entry.imageURL,
        }, entry.annotations])

        // Split into train/valid/test 70/20/10 ratios
        const trainSplit = Math.floor(0.7 * relevantData.length);
        const validSplit = Math.floor(0.9 * relevantData.length);
    
        const splits = {
            train: relevantData.slice(0, trainSplit),
            valid: relevantData.slice(trainSplit, validSplit),
            test: relevantData.slice(validSplit),
        };

        return splits
    }
    
    const handleExportClick = async () => {
        const allData = await getAllData()

        unannotatedCount.current = allData.filter((entry) => entry.annotations.length === 0).length

        if (unannotatedCount.current > 0) {
            setShowModal(true)
        } else {
            exportAnnotations()
        }
    };

    const exportAnnotations = async () => {
        // Currently, no difference between export formats, but can be added later on.
        const selectedFormat = exportFormat || "yolov5";
        const allData = await getAllData()
        const zip = new JSZip();

        const splits = splitData(allData)

        for (const [split, files] of Object.entries(splits)) {
            const imagesFolder = zip.folder(`${split}/images`);
            const labelsFolder = zip.folder(`${split}/labels`);
        
            for (const [image, imageAnnotations] of files) {
                const blob = await fetchImageBlob(image.imageURL);
                const content = imageAnnotations.map(formatAnnotation).join("\n");
                const baseName = image.imageName.replace(/\.[^/.]+$/, ""); // Remove extension
        
                if (imagesFolder) {
                    imagesFolder.file(image.imageName, blob);
                }
                if (labelsFolder) {
                    labelsFolder.file(`${baseName}.txt`, content);
                }
            }
        }

        const yamlContent = await generateYAML();
        if (yamlContent) {
            zip.file("data.yaml", yamlContent);
        }

        zip.generateAsync({ type: "blob" }).then((blob) => {
            saveAs(blob, "annotations.zip");
        });
    }

    const formatAnnotation = (annotation: Annotation) => {
        return `${annotation.labelIndex} ${annotation.left} ${annotation.top} ${annotation.width} ${annotation.height}`
    }
    
    const generateYAML = async () => {
        try {
            const labels = await getLabels()
            const labelNames = labels.map((label) => label.labelName)
            const labelNamesString = labelNames.reduce((acc, name) => acc + `\'${name}\', `, "").slice(0, -2)

            const yamlLines = [
                `train: ../train/images`,
                `val: ../valid/images`,
                `test: ../test/images\n`,
                `nc: ${labels.length}`,
                `names: [${labelNamesString}]`
            ];
            return yamlLines.join("\n");
        } catch (err) {
            console.log(err)
            return 
        }
    };

    // const convertAnnotationsToFormat = (annotations: Annotation[][], formats: string[], selectedFormat: string) => {
    //     if (formats.includes(selectedFormat)) {
    //         return annotations
    //         .flatMap((imageAnnotations) =>
    //             imageAnnotations.map(formatAnnotation)
    //         )
    //         .join("\n");
    //     }
    //     return JSON.stringify(annotations, null, 2); 
    // };

    const formats = ["yolov5", "yolov7", "yolov8"]

    return (
        <div className="bg-gray-800 text-white p-4 rounded">
            <h2 className="panel-heading">Select Export Format</h2>
            <div className="space-y-2">
                {formats.map((format) => (
                    <ExportButton 
                        key={format} 
                        format={format} 
                        onClick={() => {
                            setExportFormat(format);
                            handleExportClick();
                        }}
                    />
                ))}
            </div>
            {showModal && (
                <ConfirmationModal
                    unannotatedCount={unannotatedCount.current}
                    onConfirm={() => {
                        setShowModal(false);
                        exportAnnotations();
                    }}
                    onCancel={() => setShowModal(false)}
                />
            )}
        </div>
    );
}

export default Export