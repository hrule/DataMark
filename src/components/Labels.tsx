import React, { useState } from "react";

interface LabelsProps {
  selectedLabel: string,
  setSelectedLabel: React.Dispatch<React.SetStateAction<string>>;
}

const Labels:React.FC<LabelsProps> = ({
    selectedLabel,
    setSelectedLabel
}) => {
    const [labels, setLabels] = useState<string[]>([]);
    const [newLabel, setNewLabel] = useState<string>("");
  
    const addLabel = () => {
      if (newLabel.trim() && !labels.includes(newLabel)) {
        setLabels([...labels, newLabel]);
        setNewLabel("");
      }
    };
  
    return (
      <div className="p-4 h-full bg-gray-800 rounded-md flex flex-col">
        <h2 className="text-white font-bold mb-2">Labels</h2>
  
        {labels.length > 0 ? (
          <ul className="mb-4 overflow-y-auto hide-scrollbar">
            {labels.map((label, index) => (
              <li
                key={index}
                className={`p-2 mb-2 rounded cursor-pointer text-white ${
                  selectedLabel === label ? "bg-green-500" : "bg-gray-600"
                }`}
                onClick={() => setSelectedLabel(label)}
              >
                {label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 mb-4">No labels. Add one and click on it to select it and start annotating.</p>
        )}

        <input
          type="text"
          placeholder="Add new label"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="w-full p-2 mb-2 rounded bg-gray-600 text-white"
        />
        
        <button
          onClick={addLabel}
          className="w-full p-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          Add Label
        </button>
      </div>
    );
}

export default Labels;
