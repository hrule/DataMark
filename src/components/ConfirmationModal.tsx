import React from "react"

interface ConfirmationModalProps {
  unannotatedCount: number
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  unannotatedCount,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-slate-700 p-6 rounded shadow-xl text-center">
        <p className="mb-4 text-lg">
          There seems to be {unannotatedCount} unannotated image
          {unannotatedCount !== 1 ? "s" : ""}. Proceed with download?
        </p>
        <div className="flex justify-center gap-4">
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            onClick={onConfirm}
          >
            Confirm
          </button>
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal
