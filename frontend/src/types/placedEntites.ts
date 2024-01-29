export type ICompass = 'North' | 'West' | 'South' | 'East'

export type IEntity = {
  id: number // Wie im backend
  modelId: string // Modelname
  uuid: string // UUID vom threejs object
  orientation: ICompass
  threejsObject: THREE.Object3D
}

export type IPipeInfo = {
  startPoint: THREE.Vector3
  endPoint: THREE.Vector3
  pipeCount: number
  type: 'straight' | 'curve'
  orientation: ICompass
}

export type ICombinedPipe = {
  sections: IPipeInfo[]
  totalPipeCount: number
}