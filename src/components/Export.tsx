import { useState } from "react";
import { Annotation } from "../types";
import ExportButton from "./ExportButton";

interface ExportProps {
    annotations: Annotation[][];
}

const Export: React.FC<ExportProps> = ({
    annotations,
}) => {
    const [exportFormat, setExportFormat] = useState<string | null>(null);

    const handleExport = () => {
        const format = exportFormat || "yolov5"; 
        const data = convertAnnotationsToFormat(annotations, format);
        const blob = new Blob([data], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
    
        const link = document.createElement("a");
        link.href = url;
        link.download = `annotations-${format}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    
        URL.revokeObjectURL(url);
    };

    const formatAnnotation = (annotation: Annotation) => {
        return `${annotation.label} ${annotation.left} ${annotation.top} ${annotation.width} ${annotation.height}`
    }
    
    const convertAnnotationsToFormat = (annotations: Annotation[][], format: string) => {
    if (format === "yolov5" || format === "yolov7" || format === "yolov8") {
        return annotations
        .flatMap((imageAnnotations) =>
            imageAnnotations.map(formatAnnotation)
        )
        .join("\n");
    }
    return JSON.stringify(annotations, null, 2); 
    };

    return (
        <div className="bg-gray-800 text-white p-4 rounded">
        <h3 className="text-lg font-bold mb-2">Select Export Format</h3>
        <div className="space-y-2">
            {["yolov5", "yolov7", "yolov8"].map((format) => (
                <ExportButton format={format} onClick={() => {
                    setExportFormat(format);
                    handleExport();
                }}/>
                ))
            }
        </div>
        </div>
    );
}

export default Export