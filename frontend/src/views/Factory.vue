<script setup lang="ts">
import type {Ref} from 'vue'
import {onBeforeUnmount, onMounted, onUnmounted, provide, ref, watch} from 'vue'
import type {IVector3} from '@/types/global'
import type {IBackendEntity, IBackendEntityPreview, IPlacedRequestAnswer} from '@/types/backendTypes'
import * as THREE from 'three'
import { CameraControlsManager } from '@/classes/cameraControls/CameraControlsManager'
import { PlacedEntities } from '@/classes/placedEntities/placedEntities'
import { getIntersectionsMouse } from '@/utils/threeJS/3d'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import CircularMenu from '@/components/factory-ui/CircularMenu.vue'
import { AnimationManager } from '@/classes/animation/animationManager'
import {
  factoryImageUpdate,
  moveRequest,
  placeRequest,
  rotationRequest,
  sendScriptingToBackend
} from '@/utils/backend-communication/postRequests'
import { entityDeleteRequest } from '@/utils/backend-communication/deleteRequest'
import { getAllEntities, getAllEntitiesInFactory } from '@/utils/backend-communication/getRequests'
import { backendUrl } from '@/utils/config/config'
import { CameraMode } from '@/enum/CameraMode'
import { ManipulationMode } from '@/enum/ManipulationMode'

import {
  createRoom,
  moveHighlight,
  selectionObject,
  updateHighlightModel
} from '@/utils/threeJS/helpFunctions'

import {
  highlightObjectWithColor,
  placeEntity,
  replaceEntity,
  makeObjectTransparent
} from '@/utils/threeJS/entityManipulation'
import { rotateModel, rotateModelFromXtoY } from '@/utils/rotation/rotate'
import { useFactory } from '@/utils/composition-functions/useFactory'
import MenuBar from '@/components/factory-ui/MenuBar.vue'
import FactoryMenu from '@/components/factory-ui/SideBar.vue'
import {useSessionUser} from '@/utils/composition-functions/useSessionUser'
import {useError} from '@/utils/composition-functions/useError'
import ScriptContainer from '@/components/factory-ui/ScriptContainer.vue'
import StompClientBuilder from '@/classes/messaging/StompClientBuilder'
import type { ICompass } from '@/types/placedEntites'

/**
 * Config
 **/

const ACTIVE_LAYER: number = 0

/**
 * Variables -> ref
 **/
const showSideMenu = ref(false)
const target = ref()
const manipulationMode: Ref<ManipulationMode> = ref<ManipulationMode>(ManipulationMode.IDLE)
const allEntities: Ref<IBackendEntityPreview[] | undefined> = ref()
const activeEntity: Ref<IBackendEntityPreview | undefined> = ref()
const showCircMenu: Ref<Boolean> = ref(false)
const showDynamicDiv: Ref<Boolean> = ref(false)
const highlightIsIntersectingWithObjects = ref(false)
const factorySize: Ref<IVector3> = useFactory().factorySize
const factoryID: Ref<number> = useFactory().factoryID
const factoryName: Ref<string> = useFactory().factoryName
const currentCameraMode: Ref<CameraMode | null> = ref(CameraMode.ORBIT)
const stompClientBuilder: Ref<StompClientBuilder | null> = ref(null)

/**
 * Variables
 **/
let currObjSelectedOriginPos: IVector3 = {x: 0, y: 0, z: 0}
let dynamicDiv: HTMLElement | null
let sizes: {
  width: number
  height: number
  ratio: number
}
let originalOrientation: ICompass = 'North'
const placedEntities = ref<PlacedEntities>()
let animationManager: AnimationManager
/**
 * THREE.JS Specific
 */
// quick fix to any
let currentObjectSelected: THREE.Object3D
let lastObjectSelected: THREE.Object3D
let scene: THREE.Scene
let renderer: THREE.WebGLRenderer
let camera: THREE.PerspectiveCamera
let loader: GLTFLoader
let highlight: THREE.Object3D
let ccm: CameraControlsManager
let previousTime: number = 0
let currentMode: CameraMode | null
let pivot: THREE.Object3D

let showScripting = ref(false)
let showMenuBar = ref(true)

/**
 * Setup
 **/

const setupScene = (): void => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color('#12111A')
}

const setupRenderer = (): void => {
  renderer = new THREE.WebGLRenderer()
  renderer.setSize(sizes.width, sizes.height)
}

const setupCamera = (): void => {
  camera = new THREE.PerspectiveCamera(50, sizes.ratio)
  camera.position.set(40, -15, 15)
  camera.up.set(0, 0, 1)
  camera.lookAt(0, 0, 0)
}

const setupLights = (): void => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
  directionalLight.position.set(1, 1, 1).normalize()
  scene.add(directionalLight)
}

const setupLoader = (): void => {
  loader = new GLTFLoader()
}

const setupManager = (): void => {
  placedEntities.value = new PlacedEntities(scene, loader)
  animationManager = new AnimationManager(placedEntities.value, scene, loader)
  ccm = new CameraControlsManager(camera, renderer.domElement, CameraMode.ORBIT)
  currentMode = ccm.currentMode
}


const setupStompClientBuilder = (): void => { // = startQuizLiveUpdate()
  if(stompClientBuilder.value == null) {
    stompClientBuilder.value = new StompClientBuilder(factoryID.value, placedEntities);
    stompClientBuilder.value.activate();
  }
}


/**
 * Initialize and load the highlight model.
 *
 * @param {string} modelUrl - The URL of the model to be loaded.
 * @return {void}
 */
const initialLoadHighlightModel = (modelUrl: string): void => {
  loader.load(
      modelUrl,
      (gltf: any) => {
        highlight = gltf.scene
        highlight.position.set(0, 0, 0)
        scene.add(highlight)
        highlight.name = 'highlight'
      },
      undefined,
      (error: unknown) => {
        console.error(error)
      }
  )
}

/**
 * Captures a screenshot of the current WebGL scene.
 *
 * @function captureScreenshot
 * @returns {string} The Base64 encoded PNG image data URL of the screenshot.
 */
const captureScreenshot = (): string => {
  renderer.clear()
  renderer.render(scene, camera)
  setupCamera()
  const canvas = renderer.domElement
  return canvas.toDataURL('image/png')
}

const onToggleMenuVisibility = (): void => {
  showCircMenu.value = !showCircMenu.value
}

const onToggleSideMenuVisibility = (open: boolean): void => {
  if (open) showSideMenu.value = !showSideMenu.value
  else
    setTimeout(() => {
      showSideMenu.value = !showSideMenu.value
    }, 500)
}

/**
 * Handles the onChange event for entity clicks.
 * @param {string} situation - The situation describing the click event.
 * @returns {void}
 */
const onChangeEntityClicked = (situation: string): void => {
  switch (situation) {
    case 'delete':
      entityDeleteRequest({
        factoryId: factoryID.value,
        id: placedEntities.value!!.getByUUID(currentObjectSelected.uuid).id
      })
          .then((success) => {
            if (success) {
              placedEntities.value!!.deleteByUUID(currentObjectSelected.uuid)
              // Remove from scene
              scene.remove(currentObjectSelected)
              //if (currentObjectSelected.parent.type !== 'Scene')
              //scene.remove(currentObjectSelected.parent)
            }
          })
          .catch((error: Error) => {
            console.error('An error occurred during entity deletion:', error)
          })

      break

    case 'rotate':
      // Set mode
      manipulationMode.value = ManipulationMode.ROTATE;
      break;

    case 'move':
      // Set move mode
      manipulationMode.value = ManipulationMode.MOVE

      // Set object position
      currObjSelectedOriginPos = currentObjectSelected.position.clone()

      break

    case 'script':
      console.log('scripting Entity')
      showScripting.value = !showScripting.value
      showMenuBar.value = false
      console.log("ModelIDDDDDD: ", placedEntities.value!!.getByUUID(currentObjectSelected.uuid).id)
      break

    case 'clone':
      if (allEntities.value) {
        // Find highlight by name
        activeEntity.value = allEntities.value.find(
          (obj) => obj.name === placedEntities.value!!.getByUUID(currentObjectSelected.uuid).modelId
        )

        // If it was the same, update manually
        if (activeEntity.value)
          updateHighlightModel(highlight, backendUrl + activeEntity.value.modelFile, scene, loader)
            .then((newHighlight: THREE.Object3D) => {
              highlight = newHighlight
            })
            .catch((error: Error) => {
              console.error('An error occurred during entity cloning:', error)
            })

        // Normal set mode
        manipulationMode.value = ManipulationMode.SET
      }
      console.log('cloning Entity')
      break
  }
}

const onAnimationStart = (event: any) => {
  animationManager.startAnimation()
}

const onAnimationStopp = (event: any) => {
  animationManager.stoppAnimation()
}

const onToggleMockMode = (event: any) => {
  animationManager.toggleErze()
}

/**
 * Handlers
 **/
const handleResize = () => {
  // Variables
  sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    ratio: window.innerWidth / window.innerHeight
  }
  // Camera ratio
  camera.aspect = sizes.ratio
  camera.updateProjectionMatrix()
  // Resize Renderer
  renderer.setSize(sizes.width, sizes.height)
}

const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key.toUpperCase()) {
    case 'V':
      if (manipulationMode.value === ManipulationMode.ROTATE) {
        rotationRequest({
          id: placedEntities.value!!.getByUUID(currentObjectSelected.uuid).id,
          orientation: placedEntities.value!!.getByUUID(currentObjectSelected.uuid).orientation,
          factoryId: factoryID.value
        })
            .then((res) => res.json())
            .then((success) => {
              if (!success) {
                rotateModelFromXtoY(
                    originalOrientation,
                    placedEntities.value!!.getByUUID(currentObjectSelected.uuid).orientation,
                    currentObjectSelected,
                    placedEntities.value!!,
                    true
                )
              }
            })
      }
      showDynamicDiv.value = false
      showCircMenu.value = false
      if (currentObjectSelected) highlightObjectWithColor(currentObjectSelected, false)

      if (manipulationMode.value === ManipulationMode.SET) {
        manipulationMode.value = ManipulationMode.IDLE
        scene.remove(highlight)
      } else {
        manipulationMode.value = ManipulationMode.SET
        scene.add(highlight)
      }

      break

    case 'ESCAPE':
      switch (manipulationMode.value) {
        case ManipulationMode.MOVE:
          // Zurücksetzen
          replaceEntity(currObjSelectedOriginPos, currentObjectSelected, currentObjectSelected)
          manipulationMode.value = ManipulationMode.IDLE
          break
        default:
          if (!showSideMenu.value) onToggleSideMenuVisibility(true)
          break
      }
      break
    case 'ARROWLEFT':
      switch (manipulationMode.value) {
        case ManipulationMode.ROTATE:
          rotateModel('left', currentObjectSelected)
          placedEntities.value!!.rotateEntityByUUID(currentObjectSelected.uuid, 'left')
      }
      break

    case 'ARROWRIGHT':
      switch (manipulationMode.value) {
        case ManipulationMode.ROTATE:
          rotateModel('right', currentObjectSelected)
          placedEntities.value!!.rotateEntityByUUID(currentObjectSelected.uuid, 'right')
      }
      break

    case 'Q':
      ccm.toggleMode(currentCameraMode)
      break

    default:
      break
  }
}

const handleMouseMove = (event: MouseEvent) => {
  // Get all intersections with mouse and world
  const intersections = getIntersectionsMouse(event, camera, scene)

  // Update the highlighter
  if (highlight && manipulationMode.value === ManipulationMode.SET) {
    // Object model wird asynchron geladen
    highlightIsIntersectingWithObjects.value = moveHighlight(highlight, ACTIVE_LAYER, intersections)
  } else if (currentObjectSelected && manipulationMode.value === ManipulationMode.MOVE) {
    highlightIsIntersectingWithObjects.value = moveHighlight(
        currentObjectSelected,
        ACTIVE_LAYER,
        intersections
    )
  } else if (currentObjectSelected && manipulationMode.value === ManipulationMode.CLONE) {
    highlightIsIntersectingWithObjects.value = moveHighlight(
        currentObjectSelected,
        ACTIVE_LAYER,
        intersections
    )
  }
}

const handleClick = (event: any) => {
  // in animation mode
  if (ccm.currentMode === 0) return

  // close circle if is open
  if (showCircMenu.value) {
    showDynamicDiv.value = false
    showCircMenu.value = false
    if (manipulationMode.value === ManipulationMode.IDLE)
      highlightObjectWithColor(currentObjectSelected, false)
    return
  }

  // Ignore sidebar
  if (event.target.id == 'ignore') return

  // Cirlce events
  switch (manipulationMode.value) {
    case ManipulationMode.SET:
      if (activeEntity.value && !highlightIsIntersectingWithObjects.value) {

        placeEntity(
              loader,
              scene,
              highlight.position,
              backendUrl + activeEntity.value.modelFile
          ).then((threejsObject) => {
            if (activeEntity.value) {
              placedEntities.value!!.add({
                id: 0,
                orientation: 'North',
                modelId: activeEntity.value.name,
                uuid: threejsObject.uuid,
                threejsObject: threejsObject
              })
            }
          })

        placeRequest({
          x: highlight.position.x,
          y: highlight.position.y,
          z: highlight.position.z,
          modelId: activeEntity.value.name,
          factoryID: factoryID.value,
          user: useSessionUser().sessionUser.value
        })
            .then((response) => {
              console.log(response)
              return response.json()})
            .then((placeRequestAnswer: IPlacedRequestAnswer) => {
              if (placeRequestAnswer.id === -1) return
              placedEntities.value!!.updateLastIdAndInputMaterialAndOutputMaterial(placeRequestAnswer.id, placeRequestAnswer.inputMaterial, placeRequestAnswer.outputMaterial)

            })
            .catch((error) => {
              const lastElement = placedEntities.value!!.pop()
              if (lastElement) {
                useError().updateErrorMessage("Can't Place Entity, because it intersects with other object or is out of bounds")
                if (!useError().showErrorMessage.value) useError().toggleShowErrorMessage()
                scene.remove(lastElement.threejsObject)
              }
              console.error('Es gab einen Fehler:', error)
            })
      }
      break
    case ManipulationMode.MOVE:
      replaceEntity(currentObjectSelected.position, currentObjectSelected, lastObjectSelected)
      manipulationMode.value = ManipulationMode.IDLE
      moveRequest({
        x: currentObjectSelected.position.x,
        y: currentObjectSelected.position.y,
        z: currentObjectSelected.position.z,
        id: placedEntities.value!!.getByUUID(currentObjectSelected.uuid).id,
        factoryId: factoryID.value
      })
          .then((response) => response.json())
          .then((success: boolean) => {
            if (success) {
              console.log('moved')
            } else {
              console.log('not moved')
              replaceEntity(currObjSelectedOriginPos, currentObjectSelected, currentObjectSelected)
              manipulationMode.value = ManipulationMode.IDLE
            }
          })
      break
  }
}

const handleContextMenu = (event: MouseEvent) => {
  // Context öffnet sich
  event.preventDefault()
  if (manipulationMode.value !== ManipulationMode.IDLE) return
  const intersections = getIntersectionsMouse(event, camera, scene)
  const result = selectionObject(currentObjectSelected, lastObjectSelected, intersections)
  if (result && typeof result === 'object') {
    const { worked, currObj, lastObj } = result
    if (worked) {
      currentObjectSelected = currObj
      originalOrientation = placedEntities.value!!.getByUUID(currentObjectSelected.uuid).orientation

      lastObjectSelected = lastObj
      if (dynamicDiv) {
        dynamicDiv.style.left = event.clientX + 'px'
        dynamicDiv.style.top = event.clientY + 'px'
        dynamicDiv.style.display = 'block'
      }
      showDynamicDiv.value = true
      showCircMenu.value = true
    }
  }
  if (currentObjectSelected) currObjSelectedOriginPos = currentObjectSelected.position
}

const handleMouseDown = () => {
  if (
      (manipulationMode.value == ManipulationMode.SET ||
          manipulationMode.value === ManipulationMode.MOVE) &&
      CameraMode.ORBIT
  )
    ccm.controls.enabled = false
}

const handleMouseRelease = () => {
  if (
      (manipulationMode.value == ManipulationMode.SET ||
          manipulationMode.value === ManipulationMode.MOVE) &&
      CameraMode.ORBIT
  )
    ccm.controls.enabled = true
}

/**
 * Watcher
 **/

watch(activeEntity, () => {
  manipulationMode.value = ManipulationMode.SET

  if (activeEntity.value) {
    updateHighlightModel(highlight, backendUrl + activeEntity.value.modelFile, scene, loader).then(
        (newHighlight: THREE.Object3D) => {
          highlight = newHighlight
        }
    )
  } else initialLoadHighlightModel('mock/.gltf/cube.gltf')
})

watch(currentCameraMode, () => {
  if (currentCameraMode.value === CameraMode.FREE) {
    makeObjectTransparent(true, highlight)
  } else {
    makeObjectTransparent(false, highlight)
  }
})

/**
 * Gamecycle
 **/

onMounted(() => {
  // add eventListeners
  init()
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mousedown', handleMouseDown)
  window.addEventListener('mouseup', handleMouseRelease)
  window.addEventListener('click', handleClick)
  window.addEventListener('contextmenu', handleContextMenu)
  target.value.appendChild(renderer.domElement)
  dynamicDiv = document.getElementById('dynamicDiv')

  // Renderer gets appended to target
  getAllEntities()
      .then((json) => {
        // Alle entittys sind nun zugänglich für uns
        allEntities.value = json

        // Active entity ändern
        activeEntity.value = allEntities.value[0]
      })
      .catch((error: Error) => {
        console.error('An error occurred during fetching all Entities: ', error)
      })

  // Load all
  getAllEntitiesInFactory(factoryID.value).then((backendEntitys: IBackendEntity[]) => {


    backendEntitys.forEach((backendEntity) => {
      placeEntity(
          loader,
          scene,
          {x: backendEntity.x, y: backendEntity.y, z: backendEntity.z},
          backendUrl + backendEntity.path
      ).then((threejsObject) => {
        placedEntities.value!!.add({
          id: backendEntity.id,
          orientation: backendEntity.orientation,
          modelId: backendEntity.modelId,
          threejsObject: threejsObject,
          uuid: threejsObject.uuid,
          inputMaterial: backendEntity.inputMaterial,
          outputMaterial: backendEntity.outputMaterial
        })
      })
    })
  })

  // initial function calls
  animate(0)
  useFactory().toggleIsFactoryImageUpToDate()
})

onBeforeUnmount(() => {
  factoryImageUpdate(factoryID.value, captureScreenshot()).then((success: boolean) => {
    if (success) useFactory().toggleIsFactoryImageUpToDate()
        //demo   setTimeout(() => {
        //   useFactory().toggleIsFactoryImageUpToDate()
    // }, 5000)
    else console.log("didn't save image")
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('click', handleClick)
  window.removeEventListener('contextmenu', handleContextMenu)
})

const init = () => {
  // provides & injections
  provide('showCircleMenu', showCircMenu)
  sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    ratio: window.innerWidth / window.innerHeight
  }
  setupScene()
  setupRenderer()
  setupCamera()
  setupLights()
  setupLoader()
  createRoom(factorySize.value.x, factorySize.value.y, factorySize.value.z, scene)
  setupManager()
  setupStompClientBuilder()
}

const animate = (timestamp: any) => {
  const currentTime = timestamp || 0
  const deltaTime = (currentTime - previousTime) / 1000

  previousTime = currentTime

  requestAnimationFrame(animate)

  ccm.update(deltaTime)
  renderer.render(scene, camera)
}

/**
 * Start Game
 **/

init()

const saveAndCloseScript = (scriptContent: string) => {
  showScripting.value = !showScripting.value
  showMenuBar.value = true

  let modelIdForSavingTheScript = placedEntities.value!!.getByUUID(currentObjectSelected.uuid).id

  // schicke den string mit den kompletten script an das backend (mit der zugehörigen modelId)
  console.log("Das wird an ScriptContent ans BE geschickt: ", scriptContent);
  sendScriptingToBackend(modelIdForSavingTheScript, scriptContent);
}

const closeScript = () => {
  showScripting.value = !showScripting.value
  showMenuBar.value = true
}

</script>

<template>
  <div class="target" ref="target">
    <div id="dynamicDiv" style="position: absolute">
      <CircularMenu
          :is-button-visible="showCircMenu"
          :toggleMenuVisibility="onToggleMenuVisibility"
          @changeEntity="onChangeEntityClicked"
      ></CircularMenu>
    </div>

    <button
        @click="onAnimationStart"
        id="ignore"
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded absolute top-10 left-10 cursor-pointer"
    >
      Start Animation
    </button>

    <button
        @click="onAnimationStopp"
        id="ignore"
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded absolute top-20 left-10 cursor-pointer"
    >
      Stop Animation
    </button>

    <button
        @click="onToggleMockMode"
        id="ignore"
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded absolute top-30 left-10 cursor-pointer"
    >
      Toggle Mock Mode
    </button>

    <MenuBar
        id="ignore"
        v-if="allEntities && currentCameraMode === 1"
        :entities="allEntities"
        :active-entity="activeEntity"
        @update-active-entity="
        (name: any) => (activeEntity = allEntities?.find((obj) => obj.name === name))
      "
    />
  </div>
  <ScriptContainer v-if="showScripting" :model="placedEntities!!.getByUUID(currentObjectSelected.uuid)"
                   @saveAndClose="saveAndCloseScript" @closeScript="closeScript()"/>
  <!-- hier wird methode noch default weret für scriptContent mitgegeben -->
  <FactoryMenu
      :username="useSessionUser().sessionUser"
      :factory-name="factoryName"
      :factory-i-d="factoryID"
      v-if="showSideMenu"
      @closeSideBar="onToggleSideMenuVisibility"
  ></FactoryMenu>
</template>
