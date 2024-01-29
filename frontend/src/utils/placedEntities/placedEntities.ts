import type { ICombinedPipe, IPipeInfo, ICompass } from '@/types/placedEntites'

export const turnLeft = (orientation: ICompass): ICompass => {
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

export const turnRight = (orientation: ICompass): ICompass => {
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

export const reverseCombinedPipe = (toReverse: ICombinedPipe): void => {
  toReverse.sections = toReverse.sections
    .map(({ startPoint, endPoint, pipeCount, type, orientation }) => {
      const start = startPoint.clone()
      const end = endPoint.clone()

      return {
        startPoint: end,
        endPoint: start,
        pipeCount: pipeCount,
        type: type,
        orientation: orientation
      }
    })
    .reverse()
}

export const reverseSinglePipe = (toReverse: IPipeInfo): void => {
  const end = toReverse.endPoint.clone()
  const start = toReverse.startPoint.clone()
  toReverse.endPoint = start
  toReverse.startPoint = end
}

export const pointsOverlapping = (p1: THREE.Vector3, p2: THREE.Vector3): boolean => {
  const tolerance = 0.15

  const deltaX = Math.abs(p1.x - p2.x)
  const deltaY = Math.abs(p1.y - p2.y)
  const deltaZ = Math.abs(p1.z - p2.z)

  return deltaX <= tolerance && deltaY <= tolerance && deltaZ <= tolerance
}

export const weldPointsOfCombinedPipes = (toWeld: ICombinedPipe): void => {
  for(let i = 0; i <= toWeld.sections.length - 2; i++){
    const left = toWeld.sections[i]
    const right = toWeld.sections[i + 1]
    left.endPoint = right.startPoint.clone()
  }
}
