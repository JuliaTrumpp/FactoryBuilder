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
  private animationInterval: any = null // Timer-Referenz
  private mockMode: boolean = true;

  constructor(placedEntitiesRef: PlacedEntities, sceneRef: THREE.Scene, loaderRef: THREE.Loader) {
    this.placedEntitesRef = placedEntitiesRef
    this.sceneRef = sceneRef
    this.loaderRef = loaderRef
  }

  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


  // Controlls

  startAnimation() {
    // Starte die Animation zuerst
    this.animationInterval = setInterval(() => {
      this.placedEntitesRef.getAllItemTracks().forEach((track) => {
        this.startAnimateObjectThroughTrack(track)
      })
    }, 5000) // Alle 10 Sekunden

    // Führe die Animation sofort aus
    this.placedEntitesRef.getAllItemTracks().forEach((track) => {
      this.startAnimateObjectThroughTrack(track)
    })
  }

  stoppAnimation() {
    // Stoppe die Animation, indem der Timer gelöscht wird
    if (this.animationInterval !== null) {
      clearInterval(this.animationInterval)
      this.animationInterval = null
    }
  }

  toggleErze() {
    this.mockMode = !this.mockMode
  }

  // Not so Primitive

  startAnimateObjectThroughTrack = (track: IItemTrack, currentIndex: number = 0) => {
    // Beende
    if (currentIndex === track.length) return

    let modelUrl = !this.mockMode ? backendUrl + track[currentIndex].modelId : this.mockModelUrl

    this.startAnimateObjectThroughCombinedPipe(
      track[currentIndex].pipe,
      modelUrl, // HIER MOCK MODELS FÜR PERFORMANCE
      2000,
      0,
      async () => {
        
        await this.delay(1000)

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
            this.startAnimateObjectThroughCombinedPipe(
              pipe,
              path,
              duration,
              currentIndex + 1,
              onEnd
            )
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
            this.startAnimateObjectThroughCombinedPipe(
              pipe,
              path,
              duration,
              currentIndex + 1,
              onEnd
            )
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
