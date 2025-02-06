import { memo } from "react"
import ExportButton from "./ExportButton"
import { deleteAllData } from "../helper/server"

const Export = memo(() => {
  const formats = ["yolov5", "yolov7", "yolov8"]

  return (
    <div className="h-full bg-gray-800 text-white p-4 rounded flex flex-col justify-between overflow-y-auto">
      <div>
        <h2 className="panel-heading">Select Export Format</h2>
        <div className="space-y-2">
          {formats.map((format) => (
            <ExportButton key={format} format={format} />
          ))}
        </div>
      </div>
      <button
        className="w-full px-4 py-2 bg-red-600 rounded hover:bg-red-700"
        onClick={() => deleteAllData()}
      >
        Restart (Delete All Information)
      </button>
    </div>
  )
})

export default Export
