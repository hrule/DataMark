import { MdOutlineRectangle } from "react-icons/md";
import { LuGrab } from "react-icons/lu";
import SideBarIcon from "./SideBarIcon";

const SideBar = () => {
    return (
        <div className="w-16 h-full bg-gray-900 content-center">
          <div className="w-full h-1/2 bg-gray-900">
            <SideBarIcon icon={<MdOutlineRectangle size="28" />} text="draw" id="drawIcon"/>
            <SideBarIcon icon={<LuGrab size="28" />} text="pan" id="panIcon"/>
          </div>
        </div>
    );
}

export default SideBar