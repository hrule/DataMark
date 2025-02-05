export type {
  State,
  Action,
  FabricMouseEvent,
  ImageFile,
  Rectangle,
  Annotation,
  SelectedImage,
  Key,
  Event,
  APIImage,
  APIImageEntry,
  APILabel,
  APIMaxAnnotationCount,
}
export {
  Mode,
  MouseMove,
  MouseDown,
  MouseUp,
  SwitchMode,
  NextImage,
  PrevImage,
  reduceState,
  UNSELECTABLE_IMAGE_PROPS,
}

/** Constants */
const UNSELECTABLE_IMAGE_PROPS = {
  selectable: false,
  hasControls: false,
  hasBorders: false,
  lockMovementX: true,
  lockMovementY: true,
  lockScalingX: true,
  lockScalingY: true,
  lockRotation: true,
  evented: false,
} as const

/** User input */
/**
 * a string literal type for each key used
 */
type Key = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"
/**
 * a string literal type for each key event used
 */
type Event = "keydown" | "keyup" | "keypress"

/** Types for Props and others. */
// Custom event type for the Fabric.js mouse events
interface FabricMouseEvent {
  e: MouseEvent
  absolutePointer: { x: number; y: number }
  pointer: { x: number; y: number }
  button: number
  isClick: boolean
}

type ImageFile = Readonly<{
  imageName: string
  // ImageURL is currently not in use.
  // Cloud services, and other situations may result in its requirement.
  imageURL: string
}>

type Rectangle = Readonly<{
  left: number
  top: number
  width: number
  height: number
}>

type Annotation = Rectangle &
  Readonly<{
    labelIndex: number
    annotationId: string
  }>

/** API types. */
// Used when retrieving from API. Can cast down to ImageFile
type APIImage = ImageFile &
  Readonly<{
    annotations: Annotation[]
  }>

type APIImageEntry = Readonly<{
  id: string
}> &
  APIImage

type APILabel = Readonly<{
  id: string
  labelName: string
}>

type APIMaxAnnotationCount = Readonly<{
  highestAnnotationId: number
}>

/** State processing */

type State = Readonly<{
  mouseX: number
  mouseY: number

  rectStartX: number
  rectStartY: number
  rectEndX: number
  rectEndY: number

  renderRectangle: boolean

  panMoveX: number
  panMoveY: number

  mouseDown: boolean
  mouseUp: boolean

  currentMode: Mode

  upArrowPressed: boolean
  downArrowPressed: boolean
}>

const resetState = (s: State): State => {
  return {
    ...s,
    renderRectangle: false,
    mouseUp: false,
    upArrowPressed: false,
    downArrowPressed: false,
  }
}

type SelectedImage = Readonly<{
  image: ImageFile
  imageIndex: number
}>

enum Mode {
  Draw,
  Pan,
}

/**
 * Actions modify state
 */
interface Action {
  /**
   * @param s State to apply the action to.
   * @returns The state after applying the action.
   */
  apply(s: State): State
}

class MouseMove implements Action {
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly moveX: number,
    public readonly moveY: number,
  ) {}
  apply(s: State): State {
    return {
      ...resetState(s),
      mouseX: this.x,
      mouseY: this.y,
      panMoveX: this.moveX,
      panMoveY: this.moveY,
    }
  }
}

class MouseDown implements Action {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}
  apply(s: State): State {
    return {
      ...resetState(s),
      rectStartX: this.x,
      rectStartY: this.y,
      mouseDown: true,
    }
  }
}

class MouseUp implements Action {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}
  apply(s: State): State {
    return {
      ...resetState(s),
      rectEndX: this.x,
      rectEndY: this.y,
      mouseDown: false,
      mouseUp: true,
      renderRectangle: true,
    }
  }
}

class SwitchMode implements Action {
  constructor(public readonly mode: Mode) {}
  apply(s: State): State {
    return {
      ...resetState(s),
      currentMode: this.mode,
    }
  }
}

class NextImage implements Action {
  constructor() {}
  apply(s: State): State {
    return {
      ...resetState(s),
      upArrowPressed: true,
      downArrowPressed: false,
    }
  }
}

class PrevImage implements Action {
  constructor() {}
  apply(s: State): State {
    return {
      ...resetState(s),
      upArrowPressed: false,
      downArrowPressed: true,
    }
  }
}

const /**
   * state transducer
   * @param s input State
   * @param action type of action to apply to the State
   * @returns a new State
   */
  reduceState = (s: State, action: Action) => action.apply(s)
