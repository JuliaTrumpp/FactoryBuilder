import type {
  IEntity,
  ICombinedPipe,
  IPipeInfo,
  IMaschineInfo,
  IItemTrack,
  IItem
} from '@/types/placedEntites'
import { maschineIds, materialMap } from '@/utils/mock/placedEntities'
import {
  turnLeft,
  turnRight,
  reverseCombinedPipe,
  pointsOverlapping,
  weldPointsOfCombinedPipes,
  reverseSinglePipe
} from '@/utils/placedEntities/placedEntities'
import { getCenterPoint, rotateModelFromXtoY } from '@/utils/rotation/rotate'
import * as THREE from 'three'
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { getEntityInFactory } from '@/utils/backend-communication/getRequests'
import { placeEntity, replaceEntity } from '@/utils/threeJS/entityManipulation'
import { backendUrl } from '@/utils/config/config'

/**
 * Represents the collection of all current entities in the factory
 */
export class PlacedEntities {
    private allEntities: IEntity[] = []
    private sceneRef: THREE.Scene
    private loader: GLTFLoader
    private isWood: boolean

    constructor(sceneRef: THREE.Scene, loader: GLTFLoader) {
        this.sceneRef = sceneRef
        this.loader = loader
        this.isWood = false
    }

  /**
   * Single Entity Operations
   */
  public add = (entity: IEntity) => {
    this.allEntities.push(entity)
    if (entity.orientation === 'North') return
    rotateModelFromXtoY('North', entity.orientation, entity.threejsObject, this, false)
  }

    public updateLastIdAndInputMaterialAndOutputMaterial = (id: number, inputMaterial: Map<string, string>, outputMaterial: Map<string, string>) => {
        const lastIndex = this.allEntities.length - 1
        if (lastIndex >= 0) {
            this.allEntities[lastIndex].id = id
            this.allEntities[lastIndex].inputMaterial = inputMaterial
            this.allEntities[lastIndex].outputMaterial = outputMaterial
        }
        console.log(this.allEntities)
    }

  public pop = () => {
    return this.allEntities.pop()
  }

  public getByUUID = (uuid: string): IEntity => {
    const entity = this.allEntities.find((e) => e.uuid === uuid)
    if (!entity) throw new Error('Entity not found (by uuid)')
    return entity
  }

  public getByID = (id: number): IEntity => {
    console.log(`Searching for entity with id: ${id}, type of id: ${typeof id}`)
    const entity = this.allEntities.find((e) => e.id == id)
    if (!entity) throw new Error('Entity not found (by id)')
    return entity
  }

  public updateByID = async (id: number, situation?: string, gltf?: string) => {
    let entity, entityNew, position
    switch (situation) {
      case 'DELETE':
        entity = this.getByID(id)
        this.sceneRef.remove(entity.threejsObject)
        this.deleteByUUID(entity.uuid)
        break
      case 'MOVE':
        entity = this.getByID(id)
        entityNew = await getEntityInFactory(entity.id)
        position = {
          x: entityNew.x,
          y: entityNew.y,
          z: entityNew.z
        }
        replaceEntity(position, entity.threejsObject)
        break
      case 'ROTATE':
        entity = this.getByID(id)
        entityNew = await getEntityInFactory(entity.id)
        rotateModelFromXtoY(
          entity.orientation,
          entityNew.orientation,
          entity.threejsObject,
          this,
          false
        )
        break
      case 'ADDNEW':
        entityNew = await getEntityInFactory(id)
        position = {
          x: entityNew.x,
          y: entityNew.y,
          z: entityNew.z
        }
        placeEntity(this.loader, this.sceneRef, position, backendUrl + gltf).then(
          (threejsObject) => {
            this.add({
              id: id,
              orientation: 'North',
              modelId: gltf?.split('.')[0].split('/')[2] || '',
              uuid: threejsObject.uuid,
              threejsObject: threejsObject
            })
          }
        )
        break
    }
  }

  public rotateEntityByUUID = (uuid: string, dir: 'left' | 'right') => {
    let entity: IEntity = this.getByUUID(uuid)

    if (dir === 'left') {
      entity.orientation = turnLeft(entity.orientation)
    } else {
      entity.orientation = turnRight(entity.orientation)
    }
  }

  public deleteByUUID = (uuid: string): void => {
    this.allEntities = this.allEntities.filter((entity) => entity.uuid !== uuid)
  }

  public getAllEntities = (): IEntity[] => this.allEntities

    /**
     * Machines
     */
    public getMachines = (): IMaschineInfo[] => {
        return this.allEntities
            .filter(({modelId}) => maschineIds.includes(modelId))
            .map((maschine: IEntity) => {
                return {
                    modelId: maschine.modelId,
                    inputMaterial: maschine.inputMaterial!!,
                    outputMaterial: maschine.outputMaterial!!,
                    entrances: this.getPointsFromMaschine(maschine).entrances,
                    exits: this.getPointsFromMaschine(maschine).exits
                }
            })
    }

    public getWarenausgabenStartPoints = (): THREE.Vector3[] => {
        const warenausgabeEntities = this.allEntities.filter(
            ({modelId}) => modelId === 'Warenausgabe'
        )

        const exitPipeMeshes = warenausgabeEntities.map((entity) => {
            return entity.threejsObject.children.find((mesh) => mesh.name.includes('pipe_entrance'))
        })
        const validExitPipeMeshes = exitPipeMeshes.filter(
            (mesh) => mesh !== undefined
        ) as THREE.Object3D[]

        if (validExitPipeMeshes.length === 0) return []

        return validExitPipeMeshes.map((mesh) => getCenterPoint(mesh as THREE.Object3D))
    }

    public getRohstoffannahmeStartPoints = (): THREE.Vector3[] => {
        const warenannahme = this.allEntities.filter(({modelId}) => modelId === 'Rohstoffannahme')

        const exitPipeMeshes = warenannahme.map((entity) => {
            return entity.threejsObject.children.find((mesh) => mesh.name.includes('pipe_exit'))
        })
        const validExitPipeMeshes = exitPipeMeshes.filter(
            (mesh) => mesh !== undefined
        ) as THREE.Object3D[]

        if (validExitPipeMeshes.length === 0) return []

        return validExitPipeMeshes.map((mesh) => getCenterPoint(mesh as THREE.Object3D))
    }

    /**
     * Get Point
     */
    public getPointsFromMaschine = (
        maschine: IEntity
    ): { entrances: THREE.Vector3[]; exits: THREE.Vector3[] } => {
        let entrances: THREE.Vector3[] = maschine.threejsObject.children
            .filter((mesh) => mesh.name.includes('pipe_entrance') || mesh.name.includes('pipe_entrence'))
            .map((mesh) => getCenterPoint(mesh))

        let exits: THREE.Vector3[] = maschine.threejsObject.children
            .filter((mesh) => mesh.name.includes('pipe_exit'))
            .map((mesh) => getCenterPoint(mesh))

        if (!entrances) entrances = []
        if (!exits) entrances = []

        return {
            entrances: entrances,
            exits: exits
        }
    }

    public getPointsFromSinglePipe = (
        pipe: IEntity
    ): { startPoint: THREE.Vector3; endPoint: THREE.Vector3 } => {
        const pipeEntrance = pipe.threejsObject.children.find(
            (mesh) => mesh.name === 'pipe_entrance' || mesh.name === 'pipe_entrence'
        )
        const pipeExit = pipe.threejsObject.children.find((mesh) => mesh.name === 'pipe_exit')

        if (!pipeEntrance || !pipeExit) {
            console.log('didnt find pipe exit or entrance')
            return {
                startPoint: new THREE.Vector3(0, 0, 0),
                endPoint: new THREE.Vector3(0, 0, 0)
            }
        }

        return {
            startPoint: getCenterPoint(pipeEntrance).clone(),
            endPoint: getCenterPoint(pipeExit).clone()
        }
    }

    public getPointsFromCombinedPipe = (
        combinedPipes: ICombinedPipe
    ): {
        startPoint: THREE.Vector3
        endPoint: THREE.Vector3
    } => {
        return {
            startPoint: combinedPipes.sections[0].startPoint,
            endPoint: combinedPipes.sections[combinedPipes.sections.length - 1].endPoint
        }
    }

    /**
     * Get Pipes algorithmisch
     */
    public getAllCombinedPipes = (): ICombinedPipe[] => {
        const allPipes = [...this.getAllCurvedSinglePipes(), ...this.getAllStraightSinglePipes()]
        let out: ICombinedPipe[] = []

        // create all
        allPipes.forEach((currentPipe) => {
            let rotatedLeft = this.findCombinedPipe(currentPipe.startPoint, true, out)
            let rotatedRight = this.findCombinedPipe(currentPipe.endPoint, false, out)
            let left = this.findCombinedPipe(currentPipe.startPoint, false, out)
            let right = this.findCombinedPipe(currentPipe.endPoint, true, out)

            if (rotatedLeft) {
                reverseCombinedPipe(rotatedLeft)
                left = rotatedLeft
            }

            if (rotatedRight) {
                reverseCombinedPipe(rotatedRight)
                right = rotatedRight
            }

            // Keine Nachbarn gefunden
            if (!left && !right) {
                out.push({
                    sections: [currentPipe],
                    totalPipeCount: currentPipe.pipeCount
                })
            }

            // Nur auf der linken Seite gefunden
            if (left && !right) {
                left.sections.push(currentPipe)
                left.totalPipeCount += currentPipe.pipeCount
            }

            // Nur auf der rechten Seite gefunden
            if (!left && right) {
                right.sections.unshift(currentPipe)
                right.totalPipeCount += currentPipe.pipeCount
            }

            // Auf beiden Seiten gefunden, kombinieren
            if (right && left) {
                left.sections.push(currentPipe)
                left.sections.push(...right.sections)
                left.totalPipeCount += right.totalPipeCount + currentPipe.pipeCount
                out = out.filter((pipe) => pipe !== right)
            }
        })

        // weld points
        out.forEach((combinedPipe) => weldPointsOfCombinedPipes(combinedPipe))

    return out
  }

  public getAllStraightPipes = (): IPipeInfo[] => {

    let out: IPipeInfo[] = []

    this.getAllStraightSinglePipes().forEach((currentPipe) => {
      const {startPoint, endPoint} = currentPipe;
      let rotatedLeft = this.findSinglePipe(startPoint, true, out)
      let rotatedRight = this.findSinglePipe(endPoint, false, out)
      let left = this.findSinglePipe(startPoint, false, out)
      let right = this.findSinglePipe(endPoint, true, out)

      if (rotatedLeft) {
        reverseSinglePipe(rotatedLeft)
        left = rotatedLeft
      }

      if (rotatedRight) {
        reverseSinglePipe(rotatedRight)
        right = rotatedRight
      }

      // Keine Nachbarn gefunden
      if (!left && !right) {
        out.push(currentPipe)
      }

      // Nur auf der linken Seite gefunden
      if (left && !right) {
        left.endPoint = currentPipe.endPoint
        left.pipeCount += currentPipe.pipeCount
      }

      // Nur auf der rechten Seite gefunden
      if (!left && right) {
        right.startPoint = currentPipe.startPoint
        right.pipeCount += currentPipe.pipeCount
      }

      // Auf beiden Seiten gefunden, kombinieren
      if (right && left) {
        left.endPoint = right.startPoint
        left.pipeCount += right.pipeCount + currentPipe.pipeCount
        out = out.filter((pipe) => pipe !== right)
      }
    })

    // out.forEach(({startPoint, endPoint}) => {
    //   drawLine(startPoint, endPoint, this.sceneRef)
    // })

    return out
  }

  /**
   * Get Pipes primitive
   */
  public getAllStraightSinglePipes = (): IPipeInfo[] => {
    return this.allEntities
      .filter((entity) => entity.modelId === 'Roehre')
      .map((mesh) => {
        return {
          startPoint: this.getPointsFromSinglePipe(mesh).startPoint.clone(),
          endPoint: this.getPointsFromSinglePipe(mesh).endPoint.clone(),
          pipeCount: 1,
          type: 'straight',
          orientation: mesh.orientation
        }
      })
  }

    public getAllCurvedSinglePipes = (): IPipeInfo[] => {
        return this.allEntities
            .filter((entity) => entity.modelId === 'Kurve')
            .map((mesh) => {
                return {
                    startPoint: this.getPointsFromSinglePipe(mesh).startPoint.clone(),
                    endPoint: this.getPointsFromSinglePipe(mesh).endPoint.clone(),
                    pipeCount: 1,
                    type: 'curve',
                    orientation: mesh.orientation
                }
            })
    }

    /**
     * Find Pipe by point
     */

    public findCombinedPipe = (
        point: THREE.Vector3,
        isStartPoint: boolean,
        all: ICombinedPipe[]
    ): ICombinedPipe | undefined => {
        return all.find((combinedPipe) => {
            const {startPoint, endPoint} = this.getPointsFromCombinedPipe(combinedPipe)
            const targetPoint = isStartPoint ? startPoint : endPoint
            return pointsOverlapping(targetPoint, point)
        })
    }

    public findSinglePipe = (
        point: THREE.Vector3,
        isStartPoint: boolean,
        all: IPipeInfo[]
    ): IPipeInfo | undefined => {
        return all.find(({startPoint, endPoint}) => {
            const targetPoint = isStartPoint ? startPoint : endPoint
            return pointsOverlapping(targetPoint, point)
        })
    }

  public findMachineByEntryPoint = (
    point: THREE.Vector3
  ): { machine: IMaschineInfo; entry: THREE.Vector3 } | undefined => {
    let entryPoint = new THREE.Vector3()
      console.log(this.getMachines())
    const machine = this.getMachines().find(({ entrances }) => {
      return entrances.find((possibleEntry) => {
        if (pointsOverlapping(possibleEntry, point)) {
          entryPoint = possibleEntry
          return true
        }
      })
    })

    if (!machine) return undefined

    return { machine: machine, entry: entryPoint }
  }

  public findPipeOnMachineExit = (maschine: IMaschineInfo): ICombinedPipe | undefined => {
    const point = maschine.exits.find((exitPoint) => {
      return (
        this.findCombinedPipe(exitPoint, true, this.getAllCombinedPipes()) ||
        this.findCombinedPipe(exitPoint, false, this.getAllCombinedPipes())
      )
    })
    if (!point) {
      console.log('no pipe found on point')
      return undefined
    }

    const pipe = this.findCombinedPipe(point, true, this.getAllCombinedPipes())
    const rotated = this.findCombinedPipe(point, false, this.getAllCombinedPipes())

    if (pipe) {
      return pipe
    }

    if (rotated) {
      reverseCombinedPipe(rotated)
      return rotated
    }
  }

  /**
   * Item Track
   */

  public getAllItemTracks = (): IItemTrack[] => {
    let fullTrack: IItemTrack[] = []
    let newPipe: ICombinedPipe | undefined

    this.getRohstoffannahmeStartPoints().forEach((ausgabePoint) => {
      const newTrack: IItemTrack = []
      let ausgangspunkt = ausgabePoint
      let prevErz: any
      let prevMachine: { machine: IMaschineInfo; entry: THREE.Vector3 } | undefined = undefined

      while (true) {

        // Pipe am ausgangspunkt ?
        let pipe = this.findCombinedPipe(ausgangspunkt, true, this.getAllCombinedPipes())
        let rotatedPipe = this.findCombinedPipe(ausgangspunkt, false, this.getAllCombinedPipes())

        // Wenn nicht, dann raus. Nix wird hinzugefügt
        if (!pipe && !rotatedPipe) {
          console.log('keine pipe gefunden')
          break
        }

        // Wenn doch wird die pipe rotiert wenn nötig
        if (rotatedPipe) {
          reverseCombinedPipe(rotatedPipe)

          prevMachine = this.findMachineByEntryPoint(
            this.getPointsFromCombinedPipe(rotatedPipe).endPoint
          )
        }

        if (pipe) {
          prevMachine = this.findMachineByEntryPoint(this.getPointsFromCombinedPipe(pipe).endPoint)
        }

                // Maschine gefunden ? Pushen
                if (prevMachine) {
                    prevErz = Object.values(prevMachine.machine.inputMaterial)
                    if(prevErz.some((string: string | string[]) => string.includes("holz"))){
                        this.isWood = true
                        prevErz = prevErz[0]
                    } else if (prevErz.length > 1){
                        prevErz = prevErz[1]
                        this.isWood = false
                    }
                    if (pipe) {
                        newTrack.push({
                            modelId: prevErz,
                            pipe: pipe
                        })
                    }

                    if (rotatedPipe) {
                        newTrack.push({
                            modelId: prevErz,
                            pipe: rotatedPipe
                        })
                    }
                    console.log(newTrack)
                } else {
                    // Vieleich die warenausgabe
                    this.getWarenausgabenStartPoints().forEach((warenausgabePoint) => {

                        // Frag nicht...
                        const newErz: string = this.isWood ? "/models/items/products/paket_tisch.gltf" : "/models/items/products/paket_hammer.gltf"
                        if (
                            pipe &&
                            pointsOverlapping(this.getPointsFromCombinedPipe(pipe).endPoint, warenausgabePoint)
                        ) {
                            newTrack.push({
                                modelId: newErz,
                                pipe: pipe
                            })
                        } else if (
                            rotatedPipe &&
                            pointsOverlapping(
                                this.getPointsFromCombinedPipe(rotatedPipe).endPoint,
                                warenausgabePoint
                            )
                        ) {
                            newTrack.push({
                                modelId: newErz,
                                pipe: rotatedPipe
                            })
                        }
                    })

                    console.log('keine machine gefunden')
                    break
                }

                // neuer ausgabepunkt
                newPipe = this.findPipeOnMachineExit(prevMachine.machine)

                if (newPipe) {
                    console.log('neuer ausgangspunkt')
                    ausgangspunkt = this.getPointsFromCombinedPipe(newPipe).startPoint
                } else {
                    console.log('break')
                    break
                }
            }
            // Ende
            fullTrack.push(newTrack)
        })
        console.log(fullTrack)
        return fullTrack
    }
}
