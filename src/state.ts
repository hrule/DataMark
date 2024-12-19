import { State} from "./types";
import { Mode } from "./types";

export { initialState }

const initialState: State = {
    mouseX: 0,
    mouseY: 0,

    rectStartX: 0,
    rectStartY: 0,
    rectEndX: 0,
    rectEndY: 0,

    renderRectangle: false,

    panMoveX: 0,
    panMoveY: 0, 

    mouseDown: false,
    currentMode: Mode.Pan,

    upArrowPressed: false,
    downArrowPressed: false,
} as const;

