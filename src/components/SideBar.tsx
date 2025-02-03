import { MdOutlineRectangle } from "react-icons/md";
import { LuGrab } from "react-icons/lu";
import SideBarIcon from "./SideBarIcon";
import { memo } from "react";

const SideBar = memo(() => {
    return (
        <div className="w-16 h-full bg-gray-900 content-center flex flex-col justify-center gap-4">
          <SideBarIcon icon={<MdOutlineRectangle size="28" />} text="draw" id="drawIcon"/>
          <SideBarIcon icon={<LuGrab size="28" />} text="pan" id="panIcon"/>
        </div>
    );
})

export default SideBar