export enum CameraMode {
    MOTION_FILE,
    COMPOSITION,
    FIXED_FOLLOW
}

export type CameraObj = {
    near: number
    far: number
    fov: number
    zoom: number
    position: {
        x: number
        y: number
        z: number
    }
    rotation : {
        x: number
        y: number
        z: number
    }
    scale : {
        x: number
        y: number
        z: number
    }
}