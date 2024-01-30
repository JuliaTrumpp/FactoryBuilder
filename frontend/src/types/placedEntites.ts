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

export type IMaschineInfo = {
  modelId: string
  inputMaterial: IItem[]
  outputMaterial: IItem[]
  entrances: THREE.Vector3[]
  exits: THREE.Vector3[]
}

export type IItemProcessed =
  | 'eisen_barren'
  | 'eisen_klumpen'
  | 'eisen_staub'
  | 'farbeimer_processed'
  | 'glas'
  | 'holzplanke'
  | 'holzplanke_planiert'
  | 'holzstaebe'
  | 'kupfer_staub'
  | 'zinn_staub'
  | 'paket_hammer'
  | 'paket_tisch'

export type IItemResource =
  | 'eisen'
  | 'farbeimer'
  | 'holzstaemme'
  | 'kautschuk'
  | 'kohle'
  | 'kupfer'
  | 'sand'
  | 'zinn'

export type IItem = IItemProcessed | IItemResource

export type IMaschine =
  | 'Brennerofen'
  | 'Elektronikmaschine'
  | 'Erzreiniger'
  | 'Farbsprueher'
  | 'Montagemaschine'
  | 'Planiermaschine'
  | 'Saegemuehle'
  | 'Schleifmaschine'
  | 'Schmelzofen'

export type IItemTrack = ISingleItemTrack[]

export type ISingleItemTrack = {
  pipe: ICombinedPipe
  modelId: IItem
}
