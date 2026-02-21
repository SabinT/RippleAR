import * as ecs from '@8thwall/ecs'

// Helper: get the Three.js material for an entity (the video plane mesh)
const getThreeMaterial = (world: any, entityId: any) => {
  const obj = world.three.entityToObject.get(entityId)
  if (!obj) return null
  // The video plane is either the object itself or a child mesh
  let material: any = null
  obj.traverse((child: any) => {
    if (!material && child.isMesh && child.material) {
      material = child.material
    }
  })
  // The object itself may be a mesh
  if (!material && obj.isMesh && obj.material) {
    material = obj.material
  }
  return material
}

// Helper: get the <video> element used by a Three.js material's texture
const getVideoElement = (material: any): HTMLVideoElement | null => {
  const map = material?.map || material?.emissiveMap
  if (map?.image instanceof HTMLVideoElement) {
    return map.image
  }
  return null
}

const hideScanPrompt = () => {
  const el = document.getElementById('scan-prompt')
  if (el) el.classList.add('hidden')
}

const showScanPromptLoading = () => {
  const el = document.getElementById('scan-prompt')
  if (!el) return
  el.classList.remove('hidden')
  el.classList.add('loading')
  const p = el.querySelector('p')
  if (p) p.textContent = 'Loading\u2026'
}

const showScanPrompt = () => {
  const el = document.getElementById('scan-prompt')
  if (!el) return
  el.classList.remove('hidden', 'loading')
  const p = el.querySelector('p')
  if (p) p.textContent = 'Point your camera at the image'
}

// Make the plane transparent (invisible but still present in scene)
const hideVideoPlane = (material: any) => {
  if (!material) return
  material.transparent = true
  material.opacity = 0
  material.needsUpdate = true
}

// Restore the plane to full visibility
const showVideoPlane = (material: any) => {
  if (!material) return
  material.transparent = false
  material.opacity = 1
  material.needsUpdate = true
}

ecs.registerComponent({
  name: 'Pause Video on Image Target Lost',
  schema: {
    // @required
    videoPlayer: ecs.eid,
    imageTargetName: ecs.string,
  },
  schemaDefaults: {
    imageTargetName: '',
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    let videoReady = false
    let targetFound = false
    let videoElement: HTMLVideoElement | null = null

    // Poll until the Three.js material and video element are available,
    // then make the plane transparent until the video produces its first frame.
    const setupVideoReadyListener = () => {
      const {videoPlayer} = schemaAttribute.get(eid)
      const material = getThreeMaterial(world, videoPlayer)

      if (!material) {
        // Material not available yet; retry next frame
        requestAnimationFrame(setupVideoReadyListener)
        return
      }

      // Start hidden — prevents the white flash
      hideVideoPlane(material)

      // Poll for the video element (attached asynchronously by the runtime)
      const pollForVideo = () => {
        const el = getVideoElement(material)
        if (el) {
          videoElement = el
          console.log('[video-fix] Video element found, waiting for first frame…')

          // Use requestVideoFrameCallback if available (most modern browsers),
          // otherwise fall back to the 'playing' event.
          const onFirstFrame = () => {
            console.log('[video-fix] First video frame ready')
            videoReady = true
            if (targetFound) {
              showVideoPlane(material)
              hideScanPrompt()
            }
          }
          if ('requestVideoFrameCallback' in el) {
            (el as any).requestVideoFrameCallback(onFirstFrame)
          } else {
            (el as any).addEventListener('playing', onFirstFrame, {once: true})
          }
        } else {
          requestAnimationFrame(pollForVideo)
        }
      }
      pollForVideo()
    }

    ecs.defineState('default')
      .initial()
      .onEnter(() => {
        // Pause the video initially
        const {videoPlayer} = schemaAttribute.get(eid)
        ecs.VideoControls.mutate(world, videoPlayer, (c) => {
          c.paused = true
        })
        // Start the async setup to hide the plane until the video is ready
        requestAnimationFrame(setupVideoReadyListener)
      })
      .listen(world.events.globalId, 'reality.imagefound', (e) => {
        const {name} = e.data as any
        const {imageTargetName, videoPlayer} = schemaAttribute.get(eid)

        if (name === imageTargetName) {
          targetFound = true
          ecs.VideoControls.mutate(world, videoPlayer, (c) => {
            c.paused = false
          })

          // Show loading state until video is actually playing
          if (videoReady) {
            hideScanPrompt()
          } else {
            showScanPromptLoading()
          }

          // Only show the plane if the video has already decoded a frame
          if (videoReady) {
            const material = getThreeMaterial(world, videoPlayer)
            showVideoPlane(material)
          }
          // Otherwise, the setupVideoReadyListener callback will show it
        }
      })
      .listen(world.events.globalId, 'reality.imagelost', (e) => {
        const {name} = e.data as any
        const {imageTargetName, videoPlayer} = schemaAttribute.get(eid)

        if (name === imageTargetName) {
          targetFound = false
          showScanPrompt()
          // Hide the plane and pause
          const material = getThreeMaterial(world, videoPlayer)
          hideVideoPlane(material)
          ecs.VideoControls.mutate(world, videoPlayer, (c) => {
            c.paused = true
          })
        }
      })
  },
})
