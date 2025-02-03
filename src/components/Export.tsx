import { memo } from "react";
import ExportButton from "./ExportButton";

const Export = memo(() => {
    console.log("Export rendered")

    const formats = ["yolov5", "yolov7", "yolov8"]

    return (
        <div className="bg-gray-800 text-white p-4 rounded">
            <h2 className="panel-heading">Select Export Format</h2>
            <div className="space-y-2">
                {formats.map((format) => (
                    <ExportButton 
                        key={format} 
                        format={format}
                    />
                ))}
            </div>
        </div>
    );
})

export default Export