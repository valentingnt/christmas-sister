import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

THREE.ColorManagement.enabled = false
// const gui = new GUI()

/**
 * Base
 */
/**
 * HTML handling
 */
function hideLoadingModal() {
  const loadingModal = document.getElementById('loading-modal')

  loadingModal.style.display = 'none'
}

// Motion handling
const IS_IOS_SAFARI = typeof DeviceOrientationEvent.requestPermission === 'function'

function handleMobileOrientation(event) {
  const x = -event.gamma
  const y = event.beta

  cursor.x = (x / 60) * 2
  cursor.y = (y / 60) * 2
}

// Gift modal button
const modalButton = document.getElementById('gift-btn')
const modal = document.getElementById('modal')

modalButton.addEventListener('click', dismissModal, { passive: true })

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

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()

const wrappedGiftTexture = textureLoader.load('./textures/wrapped_gift_paper.jpeg')
wrappedGiftTexture.wrapS = THREE.RepeatWrapping
wrappedGiftTexture.wrapT = THREE.RepeatWrapping
wrappedGiftTexture.repeat.x = 5
wrappedGiftTexture.repeat.y = 5

/**
 * Lights
 */
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

/**
 * Models & objects
 */
const gltfLoader = new GLTFLoader()

let mixer = null
let canPlayMixerAnimation = false
let canOpenGift = false

// Gift box
gltfLoader.load(
  './models/gift-box-dad/gift-box-dad.gltf',
  (gltf) => {
    gltf.scene.scale.set(2, 2, 2)
    gltf.scene.position.set(0, -1.5, 0)
    gltf.scene.rotation.y = Math.PI
    gltf.scene.castShadow = true
    gltf.scene.receiveShadow = true

    scene.add(gltf.scene)

    hideLoadingModal()

    mixer = new THREE.AnimationMixer(gltf.scene)
    const animation1 = gltf.animations[0]
    const animation2 = gltf.animations[1]
    const action1 = mixer.clipAction(animation1)
    const action2 = mixer.clipAction(animation2)

    action1.setLoop(THREE.LoopOnce)
    action2.setLoop(THREE.LoopOnce)
    action1.clampWhenFinished = true
    action2.clampWhenFinished = true
    action1.play()
    action2.play()
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
const wallRight = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({
    color: '#c8c6bf',
    map: wrappedGiftTexture,
    metalness: 0,
    roughness: .8
  })
)
wallRight.position.set(10, 0, -10)
wallRight.rotation.y = Math.PI * 1.5
wallRight.receiveShadow = true

const wallLeft = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({
    color: '#c8c6bf',
    map: wrappedGiftTexture,
    metalness: 0,
    roughness: .8
  })
)
wallLeft.position.set(-10, 0, -10)
wallLeft.rotation.y = Math.PI * .5
wallLeft.receiveShadow = true

const roof = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({
    color: '#c8c6bf',
    map: wrappedGiftTexture,
    metalness: 0,
    roughness: .8
  })
)
roof.position.set(0, 5, -5)
roof.rotation.x = Math.PI * .5
roof.receiveShadow = true

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({
    color: '#c8c6bf',
    map: wrappedGiftTexture,
    metalness: 0,
    roughness: .8
  })
)
floor.position.set(0, -5, -5)
floor.rotation.x = Math.PI * -.5
floor.receiveShadow = true

const backgroundWall = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({
    color: '#c8c6bf',
    map: wrappedGiftTexture,
    metalness: 0,
    roughness: .8
  })
)
backgroundWall.position.set(0, 0, -3)
backgroundWall.receiveShadow = true

scene.add(wallRight, wallLeft, roof, floor, backgroundWall)

/**
 * Sizes
 */
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

/**
 * Camera
 */
// Base camera

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(1, 0, 10)

const cursor = {
  x: 0,
  y: 0
}

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
})

renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputColorSpace = THREE.LinearSRGBColorSpace

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))


/**
 * Animate
 */
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