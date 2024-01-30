import { interpolateVector } from '@/utils/animation/animation'
import { loadEntitie } from '@/utils/threeJS/entityManipulation'
import * as THREE from 'three'
import type { PlacedEntities } from '../placedEntities/placedEntities'
import type { ICombinedPipe, ICompass, IItemTrack } from '@/types/placedEntites'
import { itemMap } from '@/utils/mock/placedEntities'
import { backendUrl } from '@/utils/config/config'

export class AnimationManager {
  private placedEntitesRef: PlacedEntities
  private sceneRef: THREE.Scene
  private loaderRef: THREE.Loader
  private mockModelUrl: string =
    'http://localhost:8080/models/mock/items/processed/kupfer_barren.gltf'

  constructor(placedEntitiesRef: PlacedEntities, sceneRef: THREE.Scene, loaderRef: THREE.Loader) {
    this.placedEntitesRef = placedEntitiesRef
    this.sceneRef = sceneRef
    this.loaderRef = loaderRef
  }

  // Controlls

  startAnimation() {
    this.placedEntitesRef
      .getAllItemTracks()
      .forEach((track) => this.startAnimateObjectThroughTrack(track))
  }

  stoppAnimation() {}

  // Not so Primitive

  startAnimateObjectThroughTrack = (track: IItemTrack, currentIndex: number = 0) => {
    // Beende
    if (currentIndex === track.length) return

    let modelUrl = backendUrl + itemMap.get(track[currentIndex])

    this.startAnimateObjectThroughCombinedPipe(
      track[currentIndex].pipe,
      this.mockModelUrl, // HIER MOCK MODELS FÜR PERFORMANCE
      200,
      0,
      () => {
        this.startAnimateObjectThroughTrack(track, currentIndex + 1)
      }
    )
  }


  startAnimateObjectThroughCombinedPipe = (
    pipe: ICombinedPipe,
    path: string,
    duration: number,
    currentIndex: number = 0,
    onEnd: () => void
  ) => {
    // Beende
    if (currentIndex === pipe.sections.length) {
      onEnd()
      return
    }

    const section = pipe.sections[currentIndex]

    switch (section.type) {
      case 'straight':
        this.animateObjectLinear(
          section.startPoint.clone(),
          section.endPoint.clone(),
          path,
          duration * section.pipeCount,
          () => {
            this.startAnimateObjectThroughCombinedPipe(pipe, path, duration, currentIndex + 1, onEnd)
          }
        )
        break
      case 'curve':
        this.animateObjectCurved(
          section.startPoint.clone(),
          section.endPoint.clone(),
          path,
          duration * section.pipeCount,
          section.orientation,
          () => {
            this.startAnimateObjectThroughCombinedPipe(pipe, path, duration, currentIndex + 1, onEnd)
          }
        )
        break
    }
  }



  // Primitive

  animateObjectLinear = (
    from: THREE.Vector3,
    to: THREE.Vector3,
    path: string,
    duration: number,
    onEnd?: () => void
  ) => {
    let startTime: number

    loadEntitie(this.loaderRef, path).then((object) => {
      // Berechne die Größe der BoundingBox und verschiebe in die mitte
      let boundingBox = new THREE.Box3().setFromObject(object)
      let centerOfBoundingBox = new THREE.Vector3()
      boundingBox.getCenter(centerOfBoundingBox)
      from.sub(centerOfBoundingBox.clone())
      to.sub(centerOfBoundingBox.clone())

      // Setting start position
      object.position.set(from.x, from.y, from.z)

      // Add to scene
      this.sceneRef.add(object)

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp

        const elapsed = timestamp - startTime
        const progress = Math.min(elapsed / duration, 1)

        interpolateVector(from, to, object, progress)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else if (onEnd) {
          this.sceneRef.remove(object)
          onEnd()
        }
      }

      requestAnimationFrame(animate)
    })
  }

  animateObjectCurved = (
    from: THREE.Vector3,
    to: THREE.Vector3,
    path: string,
    duration: number,
    orientation: ICompass,
    onEnd?: () => void
  ) => {
    let startTime: number

    loadEntitie(this.loaderRef, path).then((object) => {
      let midPoint = new THREE.Vector3()
      // Berechne die Größe der BoundingBox und verschiebe in die Mitte
      let boundingBox = new THREE.Box3().setFromObject(object)
      let centerOfBoundingBox = new THREE.Vector3()
      boundingBox.getCenter(centerOfBoundingBox)
      from.sub(centerOfBoundingBox.clone())
      to.sub(centerOfBoundingBox.clone())

      // Berechne den mittleren Punkt zwischen from und to

      if (orientation === 'South' || orientation === 'West') {
        midPoint = new THREE.Vector3()
          .lerpVectors(from, to, 0.5)
          .add(new THREE.Vector3(0, -from.distanceTo(to) / 3, 0))
      } else {
        midPoint = new THREE.Vector3()
          .lerpVectors(from, to, 0.5)
          .add(new THREE.Vector3(0, from.distanceTo(to) / 3, 0))
      }

      // drawLine(from, to, this.sceneRef)
      // drawLine(midPoint, midPoint, this.sceneRef)

      // Erstelle eine CatmullRomCurve3 durch die Punkte from, to
      const curve = new THREE.CatmullRomCurve3([from, midPoint, to])

      // Setting start position
      object.position.set(from.x, from.y, from.z)

      // Add to scene
      this.sceneRef.add(object)

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp

        const elapsed = timestamp - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Holen Sie sich den Punkt auf der Kurve basierend auf dem Fortschritt
        const point = curve.getPointAt(progress)
        object.position.copy(point)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else if (onEnd) {
          this.sceneRef.remove(object)
          onEnd()
        }
      }

      requestAnimationFrame(animate)
    })
  }
}
