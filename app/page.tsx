"use client"

import { Canvas } from "@react-three/fiber";
import LoadingOverlay from "./components/loading-overlay";
import SceneTimeline from "./components/scene-timeline";
import ThreeWorld from "./components/three-world";
import FileSelector from "./components/file-selector";
import Panel from "./components/panel";
import dynamic from "next/dynamic";
import usePresetStore from "./stores/usePresetStore";
import { WebGPURenderer } from "three/webgpu";
const ControlBar = dynamic(() => import('./components/control-bar'), { ssr: false })

export default function Home() {
  const isWebGPU = usePresetStore(state => state.isWebGPU)
  const pr1 = usePresetStore(state => state["set pixelratio 1.0"])

  return (
    <>
      <LoadingOverlay></LoadingOverlay>
      <SceneTimeline></SceneTimeline>
      <Canvas
        dpr={pr1 ? 1.0 : undefined}
        key={isWebGPU ? "webgpu" : "webgl"}
        gl={isWebGPU ? (async (props) => {
          const renderer = new WebGPURenderer(props as any)
          await renderer.init()
          return renderer
        }) : null} shadows>
        <ThreeWorld />
      </Canvas>
      <ControlBar></ControlBar>
      <FileSelector></FileSelector>
      <Panel></Panel>
    </>
  )
}
