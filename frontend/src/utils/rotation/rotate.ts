import type { PlacedEntities } from '@/classes/placedEntities/placedEntities'
import type { ICompass } from '@/types/placedEntites'
import * as THREE from 'three'

export const rotateModel = (dir: string, object: THREE.Object3D) => {
  // Rotiere das Objekt um den Fixpunkt
  // adjusted rotation for usability (key right to rotate clockwise)
  if (dir === 'left') {
    object.rotation.z += Math.PI / 2
  } else {
    object.rotation.z -= Math.PI / 2
  }
}

export const getCenterPoint = (object: THREE.Object3D) => {
  var center = new THREE.Vector3()
  var bbox = new THREE.Box3().setFromObject(object)
  bbox.getCenter(center)
  return center
}

/**
 * Helpfull for snapping, because its rotates multiple times
 * */
export const rotateModelFromXtoY = (from: ICompass, to: ICompass, object: THREE.Object3D, placedEntities: PlacedEntities, reset: boolean) => {
  
  let directions = ['North', 'East', 'South', 'West']
  let toIndex = directions.indexOf(to)
  let fromIndex = directions.indexOf(from)
  let rotations = (toIndex - fromIndex + 4) % 4

  for (let i = 0; i < rotations; i++) {
    rotateModel('right', object)
    if (reset) placedEntities.rotateEntityByUUID(object.uuid, 'right')
  }
}
