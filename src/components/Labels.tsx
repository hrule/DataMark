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
      <div className="p-4 bg-gray-600 rounded-md">
        <h2 className="text-white font-bold mb-2">Labels</h2>
  
        {labels.length > 0 ? (
          <ul className="mb-4">
            {labels.map((label, index) => (
              <li
                key={index}
                className={`p-2 rounded cursor-pointer ${
                  selectedLabel === label ? "bg-blue-500 text-white" : "bg-gray-800 text-white"
                }`}
                onClick={() => setSelectedLabel(label)}
              >
                {label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 mb-4">No labels available. Add a new one below.</p>
        )}
  
        <input
          type="text"
          placeholder="Add new label"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="w-full p-2 mb-2 rounded bg-gray-800 text-white"
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
