import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Constants
const COLOR_MANAGEMENT_ENABLED = false
const IS_IOS_SAFARI = typeof DeviceOrientationEvent.requestPermission === 'function'
const ORIENTATION_SCALE_FACTOR = 60
const ORIENTATION_MULTIPLIER = 2
const WALL_COLOR = '#c8c6bf'
const WALL_METALNESS = 0
const WALL_ROUGHNESS = .8

// HTML Elements
const loadingModal = document.getElementById('loading-modal')
const modalButton = document.getElementById('gift-btn')
const modal = document.getElementById('modal')
const canvas = document.querySelector('canvas.webgl')

modalButton.addEventListener('click', dismissModal, { passive: true })

// State
let cursor = { x: 0, y: 0 }
let canOpenGift = false
let mixer = null
let canPlayMixerAnimation = false

// THREE.js setup
THREE.ColorManagement.enabled = COLOR_MANAGEMENT_ENABLED

// Scene
const scene = new THREE.Scene()

// Textures
const textureLoader = new THREE.TextureLoader()
const wrappedGiftTexture = textureLoader.load('./textures/wrapped_gift_paper.jpeg')
wrappedGiftTexture.wrapS = THREE.RepeatWrapping
wrappedGiftTexture.wrapT = THREE.RepeatWrapping
wrappedGiftTexture.repeat.x = 5
wrappedGiftTexture.repeat.y = 5

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, .2)
scene.add(ambientLight)

const pointLight = new THREE.PointLight(0xffffff, .8)
pointLight.position.set(-5, 4.5, 6.5)
pointLight.castShadow = true
pointLight.shadow.camera.near = 0.1
pointLight.shadow.camera.far = 25
pointLight.shadow.camera.fov = 50
pointLight.shadow.bias = 0.001
pointLight.shadow.mapSize.set(2048, 2048)
scene.add(pointLight)

// Models & objects
const gltfLoader = new GLTFLoader()

// Gift box
gltfLoader.load(
  './models/gift-box-sis/gift-box-sis.gltf',
  (gltf) => {
    gltf.scene.scale.set(2, 2, 2)
    gltf.scene.position.set(0, -1.5, 0)
    gltf.scene.rotation.y = Math.PI * 1.5
    gltf.scene.castShadow = true
    gltf.scene.receiveShadow = true

    scene.add(gltf.scene)

    hideLoadingModal()

    mixer = new THREE.AnimationMixer(gltf.scene)
    const [animation1, animation2, animation3, animation4] = gltf.animations

    const action1 = mixer.clipAction(animation1)
    const action2 = mixer.clipAction(animation2)
    const action3 = mixer.clipAction(animation3)
    const action4 = mixer.clipAction(animation4)
    action1.setLoop(THREE.LoopOnce)
    action2.setLoop(THREE.LoopOnce)
    action3.setLoop(THREE.LoopOnce)
    action4.setLoop(THREE.LoopOnce)

    action1.clampWhenFinished = true
    action2.clampWhenFinished = true
    action3.clampWhenFinished = true
    action4.clampWhenFinished = true

    action1.play()
    action2.play()
    action3.play()
    action4.play()
  })

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

function onGiftClick(event) {
  if (!canOpenGift) return
  mouse.x = (event.clientX / sizes.width) * 2 - 1
  mouse.y = - (event.clientY / sizes.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)

  const intersects = raycaster.intersectObjects(scene.children, true)

  if (intersects.length > 0) {
    const intersect = intersects[0]

    if (intersect.object.name === 'gift') canPlayMixerAnimation = true

    window.removeEventListener('click', onGiftClick)
  }
}

window.addEventListener('click', onGiftClick, { passive: true })

// Walls
const wallMaterial = new THREE.MeshStandardMaterial({
  color: WALL_COLOR,
  map: wrappedGiftTexture,
  metalness: WALL_METALNESS,
  roughness: WALL_ROUGHNESS
})

const wallRight = createMesh(new THREE.PlaneGeometry(50, 50), wallMaterial, [10, 0, -10], [0, Math.PI * 1.5, 0], true)
const wallLeft = createMesh(new THREE.PlaneGeometry(30, 30), wallMaterial, [-10, 0, -10], [0, Math.PI * .5, 0], true)
const roof = createMesh(new THREE.PlaneGeometry(30, 30), wallMaterial, [0, 5, -5], [Math.PI * .5, 0, 0], true)
const floor = createMesh(new THREE.PlaneGeometry(30, 30), wallMaterial, [0, -5, -5], [Math.PI * -.5, 0, 0], true)
const backgroundWall = createMesh(new THREE.PlaneGeometry(30, 30), wallMaterial, [0, 0, -3], [0, 0, 0], true)

scene.add(wallRight, wallLeft, roof, floor, backgroundWall)

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}, { passive: true })

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(1, 0, 10)

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
})

renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputColorSpace = THREE.LinearSRGBColorSpace

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// Animate
const clock = new THREE.Clock()
let previousTime = 0

const tick = () => {
  const elapsedTime = clock.getElapsedTime()
  const deltaTime = elapsedTime - previousTime
  previousTime = elapsedTime

  // Play mixer animation
  if (mixer && canPlayMixerAnimation) {
    mixer.update(deltaTime)
  }

  camera.position.x = (cursor.x * .8) + 1
  camera.position.y = (cursor.y * .8) + 1
  camera.lookAt(0, 0, 0)

  // Move the camera z position
  camera.position.z = (Math.sin(elapsedTime * .1)) + 6

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()

// Helper functions
function createMesh(geometry, material, position, rotation, receiveShadow) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(...position)
  mesh.rotation.set(...rotation)
  mesh.receiveShadow = receiveShadow
  return mesh
}

function hideLoadingModal() {
  loadingModal.style.display = 'none'
}

function handleMobileOrientation(event) {
  const x = -event.gamma
  const y = event.beta

  cursor.x = (x / ORIENTATION_SCALE_FACTOR) * ORIENTATION_MULTIPLIER
  cursor.y = (y / ORIENTATION_SCALE_FACTOR) * ORIENTATION_MULTIPLIER
}

function dismissModal() {
  modal.style.display = 'none'

  window.requestAnimationFrame(() => canOpenGift = true)

  if (IS_IOS_SAFARI) {
    DeviceOrientationEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') window.addEventListener('deviceorientation', handleMobileOrientation, { passive: true })
      })
      .catch(console.error);
  } else window.addEventListener('deviceorientation', handleMobileOrientation, { passive: true })
}