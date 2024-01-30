import type { IItem } from '@/types/placedEntites'

export const materialMap = new Map<string, { inputMaterial: IItem[]; outputMaterial: IItem[] }>([
  [
    'Brennerofen',
    {
      inputMaterial: ['Eisen_staub'],
      outputMaterial: ['Eisen_barren']
    }
  ],
  [
    'Elektronikmaschine',
    {
      inputMaterial: ['Kupfer'],
      outputMaterial: ['Kupfer_staub']
    }
  ],
  [
    'Erzreiniger',
    {
      inputMaterial: ['Eisen'],
      outputMaterial: ['Eisen_klumpen']
    }
  ],
  [
    'Farbsprueher',
    {
      inputMaterial: ['Farbeimer'],
      outputMaterial: ['Farbeimer_processed']
    }
  ],
  [
    'Montagemaschine',
    {
      inputMaterial: ['Holzplanke_planiert', 'Eisen_barren'],
      outputMaterial: ['Paket_tisch', 'Paket_hammer']
    }
  ],
  [
    'Planiermaschine',
    {
      inputMaterial: ['Holzplanke'],
      outputMaterial: ['Holzplanke_planiert']
    }
  ],
  [
    'Saegemuehle',
    {
      inputMaterial: ['Holzstaemme'],
      outputMaterial: ['Holzplanke']
    }
  ],
  [
    'Schleifmaschine',
    {
      inputMaterial: ['Eisen_klumpen'],
      outputMaterial: ['Eisen_barren']
    }
  ],
  [
    'Schmelzofen',
    {
      inputMaterial: ['Eisen_klumpen'],
      outputMaterial: ['Eisen']
    }
  ]
])

export const itemMap = new Map([
  // Resources
  ['Eisen', '/models/items/resources/eisen.gltf'],
  ['Farbeimer', '/models/items/resources/farbeimer.gltf'],
  ['Holzstaemme', '/models/items/resources/holzstaemme.gltf'],
  ['Kautschuk', '/models/items/resources/kautschuk.gltf'],
  ['Kohle', '/models/items/resources/kohle.gltf'],
  ['Kupfer', '/models/items/resources/kupfer.gltf'],
  ['Sand', '/models/items/resources/sand.gltf'],
  ['Zinn', '/models/items/resources/zinn.gltf'],

  // Processed Items
  ['Eisen_barren', '/models/items/processed/eisen_barren.gltf'],
  ['Eisen_klumpen', '/models/items/processed/eisen_klumpen.gltf'],
  ['Eisen_staub', '/models/items/processed/eisen_staub.gltf'],
  ['Farbeimer_processed', '/models/items/processed/farbeimer_processed.gltf'],
  ['Glas', '/models/items/processed/glas.gltf'],
  ['Holzplanke', '/models/items/processed/holzplanke.gltf'],
  ['Holzplanke_planiert', '/models/items/processed/holzplanke_planiert.gltf'],
  ['Holzstaebe', '/models/items/processed/holzstaebe.gltf'],
  ['Kupfer_staub', '/models/items/processed/kupfer_staub.gltf'],
  ['Zinn_staub', '/models/items/processed/zinn_staub.gltf'],

  // Items
  ['Paket_hammer', '/models/items/products/paket_hammer.gltf'],
  ['Paket_tisch', '/models/items/products/paket_tisch.gltf']
])

export const maschineIds = [
  'Brennerofen',
  'Elektronikmaschine',
  'Erzreiniger',
  'Farbsprueher',
  'Montagemaschine',
  'Planiermaschine',
  'Saegemuehle',
  'Schleifmaschine',
  'Schmelzofen'
]
