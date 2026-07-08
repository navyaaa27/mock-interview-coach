import { useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Environment, MeshReflectorMaterial } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, HueSaturation, BrightnessContrast } from '@react-three/postprocessing'
import * as THREE from 'three'

// ── Asset URLs from Peach Worlds CDN ──
const SPHERE_URL = 'https://files.peachworlds.com/website/c866dc08-a655-4a95-b317-4d73f658d13c/sphereanimated-1-.glb'
const RING_URL   = 'https://files.peachworlds.com/website/0050623c-f509-44e7-8b2d-cba2e7e5e841/ring2.glb'
const ROCK_URL   = 'https://files.peachworlds.com/website/071cceee-ab9e-45f4-ab6d-afbc05a12192/32be5c19-be14-469d-b2ed-f40f2c6a6361-a-rock.glb'
const HAND_URL   = 'https://files.peachworlds.com/website/7d8cda4f-754c-4385-9f25-555946cbecb0/d25cec59-ebd5-472f-8d68-d06a9ad9ec39-left-hand-model-2021.glb'
const ENV_URL    = 'https://files.peachworlds.com/website/ee517f89-0e9e-4a30-902a-521ed85d2ffd/studio-small-07-1k.exr'

useGLTF.preload(SPHERE_URL)
useGLTF.preload(RING_URL)
useGLTF.preload(ROCK_URL)
useGLTF.preload(HAND_URL)

// Linear interpolation between two keyframe values given t
function kfLerp(kf, t) {
  const keys = kf.sort((a, b) => a.t - b.t)
  if (t <= keys[0].t) return keys[0].v
  if (t >= keys[keys.length - 1].t) return keys[keys.length - 1].v
  for (let i = 0; i < keys.length - 1; i++) {
    if (t >= keys[i].t && t <= keys[i + 1].t) {
      const alpha = (t - keys[i].t) / (keys[i + 1].t - keys[i].t)
      return THREE.MathUtils.lerp(keys[i].v, keys[i + 1].v, alpha)
    }
  }
  return keys[keys.length - 1].v
}

// ── CAMERA ──
// Exact keyframes extracted from scene state JSON
// position.x: -3.352 (t=0) → -3.206 (t=0.661) → -3.178 (t=1)
// position.y: 11.419 (t=0) → 1.473 (t=0.661)  → -0.434 (t=1)
// position.z: 4 (t=0) → 4 (t=0.661) → 5.317 (t=1)
// rotation: all 0 throughout
const CAM_KF = {
  x: [{t:0,v:-3.352215936},{t:0.661,v:-3.205725676},{t:1,v:-3.177641332}],
  y: [{t:0,v:11.418653906},{t:0.661,v:1.47257370},{t:1,v:-0.43423656}],
  z: [{t:0,v:4},{t:0.661,v:4},{t:1,v:5.316681647}],
}

function ScrollCamera({ scrollProgress }) {
  const { camera } = useThree()

  useEffect(() => {
    camera.fov = 60
    camera.near = 0.1
    camera.far = 1000
    camera.updateProjectionMatrix()
    // Important: camera rotation stays at 0,0,0 throughout
    camera.rotation.set(0, 0, 0)
  }, [camera])

  useFrame(() => {
    const t = scrollProgress.current
    camera.position.set(
      kfLerp(CAM_KF.x, t),
      kfLerp(CAM_KF.y, t),
      kfLerp(CAM_KF.z, t),
    )
    camera.rotation.set(0, 0, 0)
  })

  return null
}

// ── SPHERE ──
// position.x: -3.362 (t=0) → -3.216 (t=1)
// position.y: 11.710 (t=0) → -0.570 (t=1)   ← falls with camera
// scale: 1.0 → 0.5 (t=0.06) → 0.5 (t=0.60) → 1.05 (t=0.90) → 1.05 (t=1)
// material: emissive goes from black to white at t=0.277→0.323
const SPHERE_POS_KF = {
  x: [{t:0,v:-3.362236},{t:1,v:-3.215709}],
  y: [{t:0,v:11.710334},{t:1,v:-0.569890}],
}
const SPHERE_SCALE_KF = [
  {t:0,v:1},{t:0.06,v:0.5},{t:0.6018,v:0.5},{t:0.904,v:1.05},{t:1,v:1.05}
]
const SPHERE_EMISSIVE_KF = [
  {t:0,v:0},{t:0.277,v:0},{t:0.323,v:1}
]

function AnimatedSphere({ scrollProgress }) {
  const { scene, animations } = useGLTF(SPHERE_URL)
  const mixer = useRef(null)
  const meshRef = useRef()
  const matRef = useRef()

  useEffect(() => {
    if (animations?.length) {
      mixer.current = new THREE.AnimationMixer(scene)
      const action = mixer.current.clipAction(animations[0])
      action.play()
    }
    const mat = new THREE.MeshStandardMaterial({
      color: '#000000',
      metalness: 1.0,
      roughness: 0.3996,
      emissive: new THREE.Color(0, 0, 0),
      emissiveIntensity: 1,
    })
    matRef.current = mat
    scene.traverse(child => {
      if (child.isMesh) {
        child.material = mat
        child.receiveShadow = true
      }
    })
  }, [scene, animations])

  useFrame((_, delta) => {
    mixer.current?.update(delta)
    if (!meshRef.current) return
    const t = scrollProgress.current

    // position
    meshRef.current.position.set(
      kfLerp(SPHERE_POS_KF.x, t),
      kfLerp(SPHERE_POS_KF.y, t),
      0
    )
    // scale
    const s = kfLerp(SPHERE_SCALE_KF, t)
    meshRef.current.scale.set(s, s, s)

    // emissive: material goes from black to white emissive between t=0.277 and 0.323
    if (matRef.current) {
      const e = kfLerp(SPHERE_EMISSIVE_KF, t)
      matRef.current.emissive.setScalar(e)
    }
  })

  return <primitive ref={meshRef} object={scene} position={[-3.362, 11.71, 0]} scale={[1,1,1]} />
}

// ── RING 2 (blue emissive, tilted, rotates as camera passes through) ──
// Static position: (-3.224, 6.374, 0.091)
// rotation.z animates: -2.324 (t=0.191) → -0.897 (t=0.349)
// rotation.x stays at 0.204
const RING2_ROTZ_KF = [
  {t:0,v:-2.323813815},
  {t:0.191,v:-2.323813815},
  {t:0.349,v:-0.897405437},
  {t:1,v:-0.897405437}
]

function Ring2({ scrollProgress }) {
  const { scene } = useGLTF(RING_URL)
  const ref = useRef()
  const clonedScene = useRef()

  useEffect(() => {
    clonedScene.current = scene.clone(true)
    clonedScene.current.traverse(child => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#e7e7e7',
          emissive: new THREE.Color('#3300ff'),
          emissiveIntensity: 1,
          metalness: 0,
          roughness: 0.5,
          side: THREE.DoubleSide,
        })
      }
    })
  }, [scene])

  useFrame(() => {
    if (!ref.current) return
    const t = scrollProgress.current
    const rz = kfLerp(RING2_ROTZ_KF, t)
    ref.current.rotation.set(0.2038, 0, rz)
  })

  if (!clonedScene.current) return null
  return (
    <primitive
      ref={ref}
      object={clonedScene.current}
      position={[-3.224, 6.374, 0.091]}
      rotation={[0.2038, 0, -2.3238]}
      scale={[1, 1, 1]}
    />
  )
}

// ── RING 3 (dark, child of ring2 at origin) ──
function Ring3() {
  const { scene } = useGLTF(RING_URL)
  const cloned = useRef()
  const ref = useRef()

  useEffect(() => {
    cloned.current = scene.clone(true)
    cloned.current.traverse(child => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#000000',
          metalness: 0,
          roughness: 0.755,
          side: THREE.DoubleSide,
        })
      }
    })
  }, [scene])

  useFrame(() => {
    if (ref.current) ref.current.rotation.y += 0.001
  })

  if (!cloned.current) return null
  return <primitive ref={ref} object={cloned.current} scale={[0.97,0.97,0.97]} position={[0,0,0]} />
}

// ── HAND ──
// Animates position between t=0.744 → t=0.931
// x: -3.285 → -4.025
// y: -3.427 → -1.791
// z: 0.290 → 0.334
const HAND_KF = {
  x: [{t:0,v:-3.28466},{t:0.7441,v:-3.28466},{t:0.931,v:-4.02543}],
  y: [{t:0,v:-3.42664},{t:0.7441,v:-3.42664},{t:0.931,v:-1.79071}],
  z: [{t:0,v:0.29032},{t:0.7441,v:0.29032},{t:0.931,v:0.33392}],
}

function Hand({ scrollProgress }) {
  const { scene } = useGLTF(HAND_URL)
  const ref = useRef()

  useEffect(() => {
    scene.traverse(child => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#000000',
          metalness: 0.6275,
          roughness: 0.4431,
        })
      }
    })
  }, [scene])

  useFrame(() => {
    if (!ref.current) return
    const t = scrollProgress.current
    ref.current.position.set(
      kfLerp(HAND_KF.x, t),
      kfLerp(HAND_KF.y, t),
      kfLerp(HAND_KF.z, t),
    )
  })

  return (
    <primitive
      ref={ref}
      object={scene}
      scale={[0.5, 0.5, 0.5]}
      position={[-3.285, -3.427, 0.29]}
      rotation={[7.44, -0.183, -0.429]}
    />
  )
}

// ── ROCK (static, slowly spinning) ──
function Rock({ position, rotation, scale, speed = 0.002 }) {
  const { scene } = useGLTF(ROCK_URL)
  const ref = useRef()
  const cloned = useRef()

  useEffect(() => {
    cloned.current = scene.clone(true)
    cloned.current.traverse(child => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: '#545454',
          metalness: 0.1,
          roughness: 1,
          side: THREE.DoubleSide,
        })
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += speed
      ref.current.rotation.x += speed * 0.3
    }
  })

  if (!cloned.current) return null
  return <primitive ref={ref} object={cloned.current} position={position} rotation={rotation} scale={scale} />
}

// ── WATER PLANE ──
function Water() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.922, -1.942, -1.867]} receiveShadow>
      <planeGeometry args={[10, 13.5]} />
      <MeshReflectorMaterial
        blur={[300, 100]} resolution={512}
        mixBlur={1} mixStrength={40}
        roughness={1} depthScale={1.2}
        minDepthThreshold={0.4} maxDepthThreshold={1.4}
        color="#040404" metalness={0.8} mirror={0}
      />
    </mesh>
  )
}

// ── MAIN SCENE ──
export default function PeachScene({ scrollProgress }) {
  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#000000' }}
      camera={{ position: [-3.352, 11.419, 4], fov: 60, near: 0.1, far: 1000 }}
    >
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={3} color="#ffffff" />
      <pointLight position={[-3.216, -0.616, 0]} intensity={25} decay={3.34} distance={100} castShadow />

      <Environment files={ENV_URL} environmentIntensity={0.7} backgroundBlurriness={0} />

      <ScrollCamera scrollProgress={scrollProgress} />
      <AnimatedSphere scrollProgress={scrollProgress} />
      <Ring2 scrollProgress={scrollProgress} />
      <Ring3 />
      <Hand scrollProgress={scrollProgress} />
      <Water />

      {/* 4 rocks — exact positions from scene state */}
      <Rock position={[0, 0, 0]}               rotation={[0,0,0]}          scale={[0.01,0.02,0.01]}    speed={0.001} />
      <Rock position={[0.337,-3.932,0.703]}     rotation={[3.113,0.79,-4.672]} scale={[0.01,0.01,0.01]} speed={0.003} />
      <Rock position={[-7.123,0,0]}             rotation={[0,0,0]}          scale={[0.01,0.02,0.01]}    speed={0.002} />
      <Rock position={[-2.417,9.385,2.23]}      rotation={[0,0,0]}          scale={[0.001,0.001,0.001]} speed={0.0005} />

      <EffectComposer multisampling={8}>
        <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.025} intensity={0.2} radius={0.41} />
        <Vignette offset={0.5} darkness={0.71} />
        <HueSaturation saturation={0.4} />
        <BrightnessContrast brightness={0} contrast={0.05} />
      </EffectComposer>
    </Canvas>
  )
}
