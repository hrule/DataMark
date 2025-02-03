import React, { useEffect, useState, memo } from "react";
import { deleteAllData, getLabels, postLabel } from "../helper/server";

interface LabelsProps {
  labels: string[],
  setLabels: React.Dispatch<React.SetStateAction<string[]>>,
  selectedLabelIndex: number | null,
  setSelectedLabelIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

const Labels:React.FC<LabelsProps> = memo(({
  labels,
  setLabels,
  selectedLabelIndex,
  setSelectedLabelIndex
}) => {
  console.log("Labels rendered")
  const [newLabel, setNewLabel] = useState<string>("");

  const addLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel)) {
      setLabels([...labels, newLabel]);
      setNewLabel("");
      postLabel(newLabel)
    }
  };

  useEffect(() => {
    async function loadLabels() {
      try {
        const labels = await getLabels()
        setLabels(labels.map(label => label.labelName))
      } catch (error) {
        return
      }
    }
    loadLabels()
  }, [])

  return (
    <div className="p-4 h-full bg-gray-800 rounded-md flex flex-col">
      <div className="flex flex-row justify-between">
        <h2 className="panel-heading">Labels</h2>
        <button className="bg-red-500 text-white rounded-md w-32" onClick={deleteAllData}>
          Restart
        </button>
      </div>

      {labels.length > 0 ? (
        <ul className="mb-4 overflow-y-auto hide-scrollbar">
          {labels.map((label, index) => (
            <li
              key={index}
              className={`p-2 mb-2 rounded cursor-pointer text-white ${
                selectedLabelIndex === index ? "bg-green-500" : "bg-gray-600"
              }`}
              onClick={() => setSelectedLabelIndex(index)}
            >
              {label}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 mb-4">No labels. Add one and click on it to select it and start annotating. Restart to delete all information.</p>
      )}

      <input
        type="text"
        placeholder="Add new label"
        value={newLabel}
        onChange={(e) => setNewLabel(e.target.value)}
        className="w-full p-2 mb-2 rounded bg-gray-600 text-white"
        id="label-input"
      />
      
      <button
        onClick={addLabel}
        className="w-full p-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
      >
        Add Label
      </button>
    </div>
  );
})

export default Labels;
