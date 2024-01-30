export type ICompass = 'North' | 'West' | 'South' | 'East'

export type IEntity = {
  id: number // Wie im backend
  modelId: string // Modelname
  uuid: string // UUID vom threejs object
  orientation: ICompass
  threejsObject: THREE.Object3D
  inputMaterial?: Map<string, string>
  outputMaterial?: Map<string, string>
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
  inputMaterial: Map<string, string>
  outputMaterial: Map<string, string>
  entrances: THREE.Vector3[]
  exits: THREE.Vector3[]
}

export type IItemProcessed =
  | 'Eisen_barren'
  | 'Eisen_klumpen'
  | 'Eisen_staub'
  | 'Farbeimer_processed'
  | 'Glas'
  | 'Holzplanke'
  | 'Holzplanke_planiert'
  | 'Holzstaebe'
  | 'Kupfer_staub'
  | 'Zinn_staub'
  | 'Paket_hammer'
  | 'Paket_tisch'

export type IItemResource =
  | 'Eisen'
  | 'Farbeimer'
  | 'Holzstaemme'
  | 'Kautschuk'
  | 'Kohle'
  | 'Kupfer'
  | 'Sand'
  | 'Zinn'

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
  modelId: any
}
