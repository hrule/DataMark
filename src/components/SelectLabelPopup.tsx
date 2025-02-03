import { memo } from "react";

const SelectLabelPopup = memo(() => {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-orange-700 text-white py-2 px-4 rounded shadow-lg">
        {"Please select a label to start annotating. ➜"}
      </div>
    );
})

export default SelectLabelPopup