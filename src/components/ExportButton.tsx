import React from "react";

interface ExportButtonProps {
  format: string;
  onClick: () => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({ format, onClick }) => (
  <button
    className="w-full px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
    onClick={onClick}
  >
    {format.toUpperCase()}
  </button>
);

export default ExportButton;
