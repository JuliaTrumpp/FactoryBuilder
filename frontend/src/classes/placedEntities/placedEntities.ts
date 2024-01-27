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
          startPoint: this.getPointsFromStraightSinglePipe(mesh).startPoint.clone(),
          endPoint: this.getPointsFromStraightSinglePipe(mesh).endPoint.clone(),
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
          startPoint: this.getPointsFromStraightSinglePipe(mesh).startPoint.clone(),
          endPoint: this.getPointsFromStraightSinglePipe(mesh).endPoint.clone(),
          pipeCount: 1,
          type: 'curve'
        }
      })
  }

  public getPointsFromStraightSinglePipe = (
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

  /**
   * Pipe System
   *
   * TODO: Auch rotierte Pipes also | start - end end - start|
   */

  public getAllPipes = (): ICombinedPipe[] => {

    const allStraightPipes = this.getAllStraightPipes();
    const allCurvedPipes = this.getAllCurvedPipes();

    const combinedPipes: ICombinedPipe[] = [];

    // Funktion zum Runden der Start- und Endpunkte
    const roundSectionPoints = (section: IPipeInfo): IPipeInfo => {
      return {
        ...section,
        startPoint: roundVector(section.startPoint),
        endPoint: roundVector(section.endPoint),
      };
    };

    // Funktion zum Hinzufügen eines Pipe-Abschnitts zu einem kombinierten Pipe
    const addSectionToCombinedPipe = (
      combinedPipe: ICombinedPipe,
      section: IPipeInfo
    ) => {
      combinedPipe.sections.push(section);
      combinedPipe.totalPipeCount += section.pipeCount;
    };

    // Funktion zum Erstellen eines neuen kombinierten Pipe für einen Pipe-Abschnitt
    const createCombinedPipe = (section: IPipeInfo): ICombinedPipe => {
      return {
        sections: [section],
        totalPipeCount: section.pipeCount,
      };
    };

    allCurvedPipes.forEach((curvedPipe) => {
      const curvedSection: IPipeInfo = roundSectionPoints({
        type: 'curve',
        startPoint: curvedPipe.startPoint,
        endPoint: curvedPipe.endPoint,
        pipeCount: curvedPipe.pipeCount,
      });

      const existingCombinedPipe = combinedPipes.find(
        (combinedPipe) =>
          roundVector(combinedPipe.sections[combinedPipe.sections.length - 1].endPoint).equals(curvedSection.startPoint) &&
          combinedPipe.sections[combinedPipe.sections.length - 1].type === 'curve'
      );

      if (existingCombinedPipe) {
        addSectionToCombinedPipe(existingCombinedPipe, curvedSection);
      } else {
        combinedPipes.push(createCombinedPipe(curvedSection));
      }
    });

    allStraightPipes.forEach((straightPipe) => {
      const straightSection: IPipeInfo = roundSectionPoints({
        type: 'straight',
        startPoint: straightPipe.startPoint,
        endPoint: straightPipe.endPoint,
        pipeCount: straightPipe.pipeCount,
      });

      const existingCombinedPipe = combinedPipes.find(
        (combinedPipe) =>
          roundVector(combinedPipe.sections[combinedPipe.sections.length - 1].endPoint).equals(straightSection.startPoint) &&
          combinedPipe.sections[combinedPipe.sections.length - 1].type === 'straight'
      );

      if (existingCombinedPipe) {
        addSectionToCombinedPipe(existingCombinedPipe, straightSection);
      } else {
        combinedPipes.push(createCombinedPipe(straightSection));
      }
    });
    return combinedPipes;
  };

  public getAllStraightPipes = (): IPipeInfo[] => {
    let out: IPipeInfo[] = []

    this.getAllStraightSinglePipes().forEach(({startPoint: currentStartPoint, endPoint: currentEndPoint }) => {
      let isPartOfBiggerPipe = false

      out.forEach((wholePipe) => {
        if (roundVector(currentStartPoint).equals(roundVector(wholePipe.endPoint))) {
          // Nachbar links gefunden
          wholePipe.endPoint = currentEndPoint
          wholePipe.pipeCount++
          isPartOfBiggerPipe = true

          let potentialOtherRight = out.find(({ startPoint }) =>
            roundVector(currentEndPoint).equals(roundVector(startPoint))
          )

          // Potentieller nachbar für rechts suchen
          if (potentialOtherRight) {
            // Deleting other
            out = out.filter((pipe) => pipe != potentialOtherRight)

            // Extending
            wholePipe.endPoint = potentialOtherRight.endPoint
            wholePipe.pipeCount += potentialOtherRight.pipeCount
          }
        } else if (roundVector(currentEndPoint).equals(roundVector(wholePipe.startPoint))) {
          // Nachbar rechts gefunden
          wholePipe.startPoint = currentStartPoint
          wholePipe.pipeCount++
          isPartOfBiggerPipe = true

          let potentialOtherLeft = out.find(({ endPoint }) =>
            roundVector(currentStartPoint).equals(roundVector(endPoint))
          )

          if (potentialOtherLeft) {
            // Deleting other
            out = out.filter((pipe) => pipe != potentialOtherLeft)

            // Extending
            wholePipe.startPoint = potentialOtherLeft.startPoint
            wholePipe.pipeCount += potentialOtherLeft.pipeCount
          }
        }
      })

      if (!isPartOfBiggerPipe) {
        out.push({ startPoint: currentStartPoint, endPoint: currentEndPoint, pipeCount: 1, type:"straight" })
      }
    })

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
  type: 'straight' | 'curve';
}

export type ICombinedPipe = {
  sections: IPipeInfo[],
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


const dataset: ICombinedPipe[] = [
  {
    sections: [
      {
        type: 'curve',
        startPoint: new THREE.Vector3(0, 0, 0),
        endPoint: new THREE.Vector3(1, 1, 1),
        pipeCount: 1,
      },
      {
        type: 'straight',
        startPoint: new THREE.Vector3(1, 1, 1),
        endPoint: new THREE.Vector3(3, 1, 1),
        pipeCount: 1,
      },
      {
        type: 'curve',
        startPoint: new THREE.Vector3(3, 1, 1),
        endPoint: new THREE.Vector3(4, 0, 0),
        pipeCount: 1,
      },
    ],
    totalPipeCount: 3,
  },
  {
    sections: [
      {
        type: 'straight',
        startPoint: new THREE.Vector3(0, 2, 1),
        endPoint: new THREE.Vector3(3, 2, 1),
        pipeCount: 2,
      },
      {
        type: 'curve',
        startPoint: new THREE.Vector3(3, 2, 1),
        endPoint: new THREE.Vector3(6, 2, 1),
        pipeCount: 1,
      },
    ],
    totalPipeCount: 3,
  },
];
