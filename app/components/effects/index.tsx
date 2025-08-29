import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useControls } from "leva";
import { useMemo, useState } from "react";
import OutlinePass from "./OutlinePass";

import { HexDofEffect } from "@/app/modules/effects/HexDofEffect";
import { buildGuiItem, buildGuiObj, buildGuiFunc } from "@/app/utils/gui";
import { useFrame, useThree } from "@react-three/fiber";
import { DepthOfField } from "./DepthOfField";
import { FloatType, Texture, Vector3 } from "three";
import { TextureEffectComp } from "./TextureEffectComp";
import { ColorChannel } from "postprocessing";
import { WebGPURenderer } from "three/webgpu";
import WebGPUEffectComposer from "./WebGPUEffectComposer";
import usePresetStore from "@/app/stores/usePresetStore";
import { NormalBlending } from "./NormalBlending";
import usePngTex from "../three-world/model/helper/usePngTex";
import { NormalBlendingPass } from "@/app/modules/effects/NormalBlendingPass";
import WithReady from "@/app/stores/WithReady";

function Effects() {
    const [dof, setDof] = useState<HexDofEffect>()
    const [normal, setNormal] = useState<NormalBlendingPass>()

    const effectConfig = useControls('Effects', {
        ...buildGuiObj("show outline")
    }, { order: 2 })

    const debugTextures = useMemo(() => {
        if (!normal) return { None: null }
        const rts = dof ? [
            dof.renderTarget,
            dof.renderTargetBokehTemp,
            dof.renderTargetCoC,
            dof.renderTargetDepth,
            dof.renderTargetFar,
            dof.renderTargetFocusDistance,
            dof.renderTargetFocalBlurred,
            dof.renderTargetCoCNear
        ] : [
            normal.outputBuffer
        ]

        const obj: Record<string, Texture> = {
            None: null
        }
        for (const rt of rts) {
            for (const t of rt.textures) {
                obj[t.name] = t
            }
        }
        return obj
    }, [dof, normal])

    const debugChannels = {
        r: [ColorChannel.RED],
        g: [ColorChannel.GREEN],
        b: [ColorChannel.BLUE],
        a: [ColorChannel.ALPHA],
        rgb: [ColorChannel.RED, ColorChannel.GREEN, ColorChannel.BLUE],
        rgba: [ColorChannel.RED, ColorChannel.GREEN, ColorChannel.BLUE, ColorChannel.ALPHA]
    } as { [k: string]: [number, number?, number?, number?] }

    const preset = usePresetStore()

    const buildDofGui = buildGuiFunc({
        disabled: !preset["bokeh enabled"]
    })

    const dofConfig = useControls('Effects.DepthOfField', {
        enabled: buildGuiItem("bokeh enabled"),
        "focalDistance": {
            ...buildDofGui("bokeh focal distance", (value) => {
                if (!dof) return
                dof.hexBokehFocalDistancePass.fullscreenMaterial.uniforms.mFocalDistance.value = value
            }),
            min: 0.0,
            max: 100.0
        },
        focalLength: {
            ...buildDofGui("bokeh focal length", (value) => {
                if (!dof) return
                dof.hexBokehFocalDistancePass.fullscreenMaterial.uniforms.mFocalLength.value = value
            }),
            min: 1.0,
            max: 70.0
        },
        focusRange: {
            ...buildDofGui("bokeh focus range", (value) => {
                if (!dof) return
                dof.uniforms.get("mFocalRegion").value = value
                dof.depthBokeh4XPass.fullscreenMaterial.uniforms.mFocalRegion.value = value
            }),
            min: 0.5,
            max: 5.0
        },
        fStop: {
            ...buildDofGui("bokeh fStop", (value) => {
                if (!dof) return
                dof.hexBokehFocalDistancePass.fullscreenMaterial.uniforms.mFstop.value = value
            }),
            min: 1.0,
            max: 8.0
        },
        TestMode: {
            ...buildDofGui("bokeh testMode", (value) => {
                if (!dof) return
                dof.uniforms.get("mTestMode").value = value
            }),
            min: 0.0,
            max: 1.0,
        },
        MeasureMode: {
            ...buildDofGui("bokeh measureMode", (value) => {
                if (!dof) return
                dof.uniforms.get("mMeasureMode").value = value
                dof.hexBokehFocalDistancePass.fullscreenMaterial.uniforms.mMeasureMode.value = value
            }),
            options: {
                "Auto center distance": 0.0,
                "Auto bone distance": 0.25,
                "Fix distance": 0.5,
                "Camera-to-Bone distance": 1.0
            },
        },
        debugTexture: {
            value: debugTextures["None"],
            options: debugTextures
        },
        debugChannel: {
            value: debugChannels.rgba,
            options: debugChannels
        }
    }, { collapsed: true }, [debugTextures, preset]);

    const bloomConfig = useControls('Effects.Bloom', {
        enabled: buildGuiItem("bloom enabled"),
        intensity: {
            ...buildGuiItem("bloom intensity"),
            min: 0,
            max: 10
        },
        luminanceThreshold: {
            ...buildGuiItem("bloom threshold"),
            min: 0,
            max: 1
        },
        luminanceSmoothing: {
            ...buildGuiItem("bloom smoothing"),
            min: 0,
            max: 1
        },

    }, { collapsed: true });

    useFrame(() => {
        if (!dof) return
        if (!dof.target) {
            dof.target = new Vector3()
        }
    })

    const pngTexs = usePngTex()

    const { normalMap, subNormalMap } = useControls(`Effects.NormalBlending`, {
        normalMap: {
            value: pngTexs['none'],
            options: pngTexs
        },
        subNormalMap: {
            value: pngTexs['none'],
            options: pngTexs
        }
    }, [pngTexs])

    const renderer = useThree(state => state.gl)
    const isWebGPU = renderer instanceof WebGPURenderer

    if (isWebGPU) {
        return <WebGPUEffectComposer></WebGPUEffectComposer>
    } else {
        return (
            <EffectComposer renderPriority={3} frameBufferType={FloatType}>
                {effectConfig["show outline"] && <OutlinePass></OutlinePass>}
                {normalMap && subNormalMap && <NormalBlending ref={setNormal} normalMap={normalMap} subNormalMap={subNormalMap}></NormalBlending>}
                {dofConfig.enabled && <DepthOfField ref={setDof}></DepthOfField>}
                {bloomConfig.enabled && <Bloom mipmapBlur {...bloomConfig}></Bloom>}
                {dofConfig.debugTexture && <TextureEffectComp texture={dofConfig.debugTexture} colorChannel={dofConfig.debugChannel} ></TextureEffectComp>}
            </EffectComposer>
        );
    }
}

export default WithReady(Effects);