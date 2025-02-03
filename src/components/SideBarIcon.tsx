import { memo } from "react"

interface SideBarIconProps {
    icon: React.ReactNode,
    text?: string,
    id: string,
}

const SideBarIcon:React.FC<SideBarIconProps> = memo(({ icon, text = 'tooltip', id }) => {
    return (
        <div className="sidebar-icon group" id={id}> 
            { icon }
            <span className="sidebar-tooltip group-hover:scale-100">
                {text}
            </span>
        </div>
    );
})

export default SideBarIcon