import type { IEntity, ICombinedPipe, IPipeInfo } from '@/types/placedEntites'
import { getEntityInFactory } from '@/utils/backend-communication/getRequests'
import { backendUrl } from '@/utils/config/config'
import { turnLeft, turnRight, reverseCombinedPipe, pointsOverlapping, weldPointsOfCombinedPipes } from '@/utils/placedEntities/placedEntities'
import { getCenterPoint, rotateModelFromXtoY } from '@/utils/rotation/rotate'
import { placeEntity, replaceEntity } from '@/utils/threeJS/entityManipulation'
import * as THREE from 'three'
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/**
 * Represents the collection of all current entities in the factory
 */
export class PlacedEntities {
  private allEntities: IEntity[] = []
  private sceneRef: THREE.Scene
  private loader: GLTFLoader

  constructor(sceneRef: THREE.Scene, loader: GLTFLoader) {
    this.sceneRef = sceneRef
    this.loader = loader
  }

  /**
   * Single Entity Operations
   */
  public add = (entity: IEntity) => {
    this.allEntities.push(entity)
    if (entity.orientation === "North") return
    rotateModelFromXtoY("North", entity.orientation, entity.threejsObject, this, false)
  }

  public updateLastId = (id: number) => {
    const lastIndex = this.allEntities.length - 1
    if (lastIndex >= 0) {
      this.allEntities[lastIndex].id = id
    }
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
    console.log(`Searching for entity with id: ${id}, type of id: ${typeof id}`);
    const entity = this.allEntities.find((e) => e.id == id)
    if (!entity) throw new Error('Entity not found (by id)')
    return entity
  }

  public updateByID = async (id: number, situation?: string, gltf?: string) => {
    let entity, entityNew, position;
    switch(situation) {
      case "DELETE":
        entity = this.getByID(id)
        this.sceneRef.remove(entity.threejsObject)
        this.deleteByUUID(entity.uuid)
        break
      case "MOVE":
        entity = this.getByID(id)
        entityNew = await getEntityInFactory(entity.id)
        position = {
          x: entityNew.x,
          y: entityNew.y,
          z: entityNew.z
        }
        replaceEntity(position, entity.threejsObject)
        break
      case "ROTATE":
        entity = this.getByID(id)
        entityNew = await getEntityInFactory(entity.id)
        rotateModelFromXtoY(entity.orientation, entityNew.orientation, entity.threejsObject, this, false)
        break;
      case "ADDNEW":
         entityNew = await getEntityInFactory(id)
         position = {
          x: entityNew.x,
          y: entityNew.y,
          z: entityNew.z
        }
        placeEntity(
          this.loader,
          this.sceneRef,
          position,
          backendUrl + gltf
      ).then((threejsObject) => {

          this.add({
            id: id,
            orientation: 'North',
            modelId: gltf?.split(".")[0].split("/")[2] || "",
            uuid: threejsObject.uuid,
            threejsObject: threejsObject
          })
      })
        break;
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
   * Get Point
   */

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

    console.log(allPipes);

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


  /**
   * Get Pipes primitive
   */
  public getAllStraightSinglePipes = (): IPipeInfo[] => {

    console.log(this.allEntities)
    return this.allEntities
      .filter((entity) => entity.modelId === 'roehre')
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
      .filter((entity) => entity.modelId === 'kurve')
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
      const { startPoint, endPoint } = this.getPointsFromCombinedPipe(combinedPipe)
      const targetPoint = isStartPoint ? startPoint : endPoint
      return pointsOverlapping(targetPoint, point)
    })
  }

  public findSinglePipe = (
    point: THREE.Vector3,
    isStartPoint: boolean,
    all: IPipeInfo[]
  ): IPipeInfo | undefined => {
    return all.find(({ startPoint, endPoint }) => {
      const targetPoint = isStartPoint ? startPoint : endPoint
      return pointsOverlapping(targetPoint, point)
    })
  }
}
