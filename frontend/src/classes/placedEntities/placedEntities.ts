import { getCenterPoint } from '@/utils/rotation/rotate'
import { drawBox, drawLine, roundVector } from '@/utils/threeJS/helpFunctions'
import * as THREE from 'three'

/**
 * Represents the collection of all current entities in the factory
 */
export class PlacedEntities {
  private allEntities: IEntity[] = []
  private sceneRef: THREE.Scene

  constructor(sceneRef: THREE.Scene) {
    this.sceneRef = sceneRef
  }

  /**
   * Single Entity Operations
   */
  public add = (entity: IEntity) => this.allEntities.push(entity)

  public getByUUID = (uuid: string): IEntity => {
    const entity = this.allEntities.find((e) => e.uuid === uuid)
    if (!entity) throw new Error('Entity not found')
    return entity
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
   * Single Pipe Actions
   */
  public getAllStraightSinglePipes = (): IPipeInfo[] => {
    return this.allEntities
      .filter((entity) => entity.modelId === 'pipe_straight')
      .map((mesh) => {
        return {
          startPoint: this.getPointsStraightFromPipe(mesh).startPoint.clone(),
          endPoint: this.getPointsStraightFromPipe(mesh).endPoint.clone(),
          pipeCount: 1,
          type: 'straight'
        }
      })
  }

  public getAllCurvedPipes = (): IPipeInfo[] => {
    return this.allEntities
      .filter((entity) => entity.modelId === 'pipe_curved')
      .map((mesh) => {
        return {
          startPoint: this.getPointFromCurvedPipe(mesh).startPoint.clone(),
          endPoint: this.getPointFromCurvedPipe(mesh).endPoint.clone(),
          pipeCount: 1,
          type: 'curve'
        }
      })
  }

  public getPointsStraightFromPipe = (
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

    if (pipe.orientation === 'South' || pipe.orientation === 'West') {
      return {
        startPoint: getCenterPoint(pipeExit).clone(),
        endPoint: getCenterPoint(pipeEntrance).clone()
      }
    } else
      return {
        startPoint: getCenterPoint(pipeEntrance).clone(),
        endPoint: getCenterPoint(pipeExit).clone()
      }
  }

  public getPointFromCurvedPipe = (
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

  public getEndPointsFromCombinedPipes = (
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
   * Pipe System
   *
   * TODO: Auch rotierte Pipes also | start - end end - start|
   */

  public getAllPipes = (): ICombinedPipe[] => {
    const allPipes = [...this.getAllCurvedPipes(), ...this.getAllStraightPipes()]
    let out: ICombinedPipe[] = []

    allPipes.forEach((currentPipe) => {
      const rotatedRight = out.find((combinedPipe) => {
        const { startPoint } = this.getEndPointsFromCombinedPipes(combinedPipe)
        return roundVector(startPoint).equals(roundVector(currentPipe.startPoint))
      })

      const rotatedLeft = out.find((combinedPipe) => {
        const { endPoint } = this.getEndPointsFromCombinedPipes(combinedPipe)
        return roundVector(endPoint).equals(roundVector(currentPipe.endPoint))
      })

      let left = out.find((combinedPipe) => {
        const { endPoint } = this.getEndPointsFromCombinedPipes(combinedPipe)
        return roundVector(endPoint).equals(roundVector(currentPipe.startPoint))
      })

      let right = out.find((combinedPipe) => {
        const { startPoint } = this.getEndPointsFromCombinedPipes(combinedPipe)
        return roundVector(startPoint).equals(roundVector(currentPipe.endPoint))
      })

      console.log(right, left, rotatedRight, rotatedLeft)
/**
      if(rotatedLeft) {
        left = reverseCombinedPipe(rotatedLeft)
      }

      if(rotatedRight) {
        right = reverseCombinedPipe(rotatedRight)
      }
**/
      // Keine nachbarn gefunden
      if (!left && !right) {
        out.push({
          sections: [currentPipe],
          totalPipeCount: currentPipe.pipeCount
        })
      }

      // Only found on left side
      if (left && !right) {
        left.sections.push(currentPipe)
        left.totalPipeCount += currentPipe.pipeCount
      }

      // Only found on right site
      if (!left && right) {
        right.sections.unshift(currentPipe)
        right.totalPipeCount += currentPipe.pipeCount
      }

      // found on both sides delete
      if (right && left) {
        left.sections.push(currentPipe)
        left.sections.push(...right.sections)
        left.totalPipeCount += right.totalPipeCount + currentPipe.pipeCount
        out = out.filter((pipe) => pipe !== right)
      }
    })

    return out
  }

  public getAllStraightPipes = (): IPipeInfo[] => {
    let out: IPipeInfo[] = []
    this.getAllStraightSinglePipes().forEach(
      ({ startPoint: currentStartPoint, endPoint: currentEndPoint }) => {
        const left = out.find(({ endPoint }) =>
          roundVector(endPoint).equals(roundVector(currentStartPoint))
        )

        const right = out.find(({ startPoint }) =>
          roundVector(startPoint).equals(roundVector(currentEndPoint))
        )

        // Keine nachbarn gefunden
        if (!left && !right) {
          out.push({
            startPoint: currentStartPoint,
            endPoint: currentEndPoint,
            pipeCount: 1,
            type: 'straight'
          })
        }

        // Only found on left side
        if (left && !right) {
          left.endPoint = currentEndPoint
          left.pipeCount++
        }

        // Only found on right site
        if (!left && right) {
          right.startPoint = currentStartPoint
          right.pipeCount++
        }

        // found on both sides delete
        if (right && left) {
          left.endPoint = right.endPoint
          left.pipeCount += right.pipeCount + 1
          out = out.filter((pipe) => pipe !== right)
        }
      }
    )
    return out
  }
}

export type IEntity = {
  id: number // Wie im backend
  modelId: string // Modelname
  uuid: string // UUID vom threejs object
  orientation: string
  threejsObject: THREE.Object3D
}

export type IPipeInfo = {
  startPoint: THREE.Vector3
  endPoint: THREE.Vector3
  pipeCount: number
  type: 'straight' | 'curve'
}

export type ICombinedPipe = {
  sections: IPipeInfo[]
  totalPipeCount: number
}

/**
 * Helper
 */
const turnLeft = (orientation: string): string => {
  switch (orientation) {
    case 'North':
      return 'West'
    case 'West':
      return 'South'
    case 'South':
      return 'East'
    case 'East':
      return 'North'
    default:
      return orientation
  }
}

const turnRight = (orientation: string): string => {
  switch (orientation) {
    case 'North':
      return 'East'
    case 'East':
      return 'South'
    case 'South':
      return 'West'
    case 'West':
      return 'North'
    default:
      return orientation
  }
}

const reverseCombinedPipe = (toReverse: ICombinedPipe): ICombinedPipe => {
  return {
    totalPipeCount: toReverse.totalPipeCount,
    sections: toReverse.sections.map(({startPoint, endPoint, pipeCount, type}) => {
      const start = startPoint.clone()
      const end = endPoint.clone()

      return {
        startPoint: end,
        endPoint: start,
        pipeCount: pipeCount,
        type: type
      }
    }).reverse()
  }
}


const dataset: ICombinedPipe = {
  sections: [
    {
      startPoint: new THREE.Vector3(0, 0, 0),
      endPoint: new THREE.Vector3(5, 0, 0),
      pipeCount: 3,
      type: 'straight'
    },
    {
      startPoint: new THREE.Vector3(5, 0, 0),
      endPoint: new THREE.Vector3(5, 5, 0),
      pipeCount: 2,
      type: 'curve'
    },
    {
      startPoint: new THREE.Vector3(5, 5, 0),
      endPoint: new THREE.Vector3(10, 5, 0),
      pipeCount: 4,
      type: 'straight'
    }
  ],
  totalPipeCount: 3 + 2 + 4 // Summe der Rohre in allen Abschnitten
};