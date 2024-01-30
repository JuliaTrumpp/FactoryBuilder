import type { IItem } from '@/types/placedEntites'

export const materialMap = new Map<string, { inputMaterial: IItem[]; outputMaterial: IItem[] }>([
  [
    'Brennerofen',
    {
      inputMaterial: ['sand'],
      outputMaterial: ['glas']
    }
  ],
  [
    'Elektronikmaschine',
    {
      inputMaterial: ['kupfer'],
      outputMaterial: ['kupfer_staub']
    }
  ],
  [
    'Erzreiniger',
    {
      inputMaterial: ['eisen'],
      outputMaterial: ['eisen_klumpen']
    }
  ],
  [
    'Farbsprueher',
    {
      inputMaterial: ['farbeimer'],
      outputMaterial: ['farbeimer_processed']
    }
  ],
  [
    'Montagemaschine_Mittel',
    {
      inputMaterial: ['holzplanke_planiert', 'eisen_barren'],
      outputMaterial: ['paket_tisch', 'paket_hammer']
    }
  ],
  [
    'Planiermaschine',
    {
      inputMaterial: ['holzplanke'],
      outputMaterial: ['holzplanke_planiert']
    }
  ],
  [
    'Saegemuehle',
    {
      inputMaterial: ['holzstaemme'],
      outputMaterial: ['holzplanke']
    }
  ],
  [
    'Schleifmaschine',
    {
      inputMaterial: ['eisen_klumpen'],
      outputMaterial: ['eisen_barren']
    }
  ],
  [
    'Schmelzofen',
    {
      inputMaterial: ['eisen_klumpen'],
      outputMaterial: ['eisen']
    }
  ]
])

export const itemMap = new Map([
  // Resources
  ['eisen', '/models/items/resources/eisen.gltf'],
  ['farbeimer', '/models/items/resources/farbeimer.gltf'],
  ['holzstaemme', '/models/items/resources/holzstaemme.gltf'],
  ['kautschuk', '/models/items/resources/kautschuk.gltf'],
  ['kohle', '/models/items/resources/kohle.gltf'],
  ['kupfer', '/models/items/resources/kupfer.gltf'],
  ['sand', '/models/items/resources/sand.gltf'],
  ['zinn', '/models/items/resources/zinn.gltf'],

  // Processed Items
  ['eisen_barren', '/models/items/processed/eisen_barren.gltf'],
  ['eisen_klumpen', '/models/items/processed/eisen_klumpen.gltf'],
  ['eisen_staub', '/models/items/processed/eisen_staub.gltf'],
  ['farbeimer_processed', '/models/items/processed/farbeimer_processed.gltf'],
  ['glas', '/models/items/processed/glas.gltf'],
  ['holzplanke', '/models/items/processed/holzplanke.gltf'],
  ['holzplanke_planiert', '/models/items/processed/holzplanke_planiert.gltf'],
  ['holzstaebe', '/models/items/processed/holzstaebe.gltf'],
  ['kupfer_staub', '/models/items/processed/kupfer_staub.gltf'],
  ['zinn_staub', '/models/items/processed/zinn_staub.gltf'],

  // Items
  ['paket_hammer', '/models/items/products/paket_hammer.gltf'],
  ['paket_tisch', '/models/items/products/paket_tisch.gltf']
])

export const maschineIds = [
  'Brennerofen',
  'Elektronikmaschine',
  'Erzreiniger',
  'Farbsprueher',
  'Montagemaschine_Mittel',
  'Planiermaschine',
  'Saegemuehle',
  'Schleifmaschine',
  'Schmelzofen'
]
