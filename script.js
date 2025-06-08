document.addEventListener('DOMContentLoaded', () => {
  const ANIMATION_END_OFFSET = 0
  const loadingImagesSrc = [
    'assets/loading/loading-0.png',
    'assets/loading/loading-25.png',
    'assets/loading/loading-50.png',
    'assets/loading/loading-75.png',
    'assets/loading/loading-100.png'
  ]
  loadingImagesSrc.forEach(src => {
    const img = new Image()
    img.src = src
  })
  const elements = {
    background: document.getElementById('background'),
    walker: document.getElementById('walker'),
    modal: document.getElementById('modal'),
    modalImage: document.getElementById('modal-image'),
    modalClose: document.getElementById('modal-close'),
    modalPrev: document.getElementById('modal-prev'),
    modalNext: document.getElementById('modal-next'),
    loadingScreen: document.getElementById('loading-screen'),
    loadingImage: document.getElementById('loading-image'),
    calloutsContainer: document.getElementById('callouts-container'),
    hotspots: document.querySelectorAll('.hotspot'),
    backgroundLink: document.getElementById('background-link')
  }
  elements.loadingImage.src = 'assets/loading/loading-0.png'
  
  // --- FIX START ---
  // Updated breakpoint from 768 to 470 for loading assets
  const backgroundImages = [
    {
      src: window.innerWidth <= 477 ? 'backgrounds/page1-mobile.png' : 'backgrounds/page1.png',
      isFirst: true,
      originalWidth: window.innerWidth <= 477 ? 1080 : 1920
    },
    {
      src: 'backgrounds/room-strip.PNG',
      isFirst: false,
      originalWidth: 15001
    }
  ]
  // --- FIX END ---

  const walkingFrames = Array.from(
    { length: 20 },
    (_, i) => `walking-frames/Layer_${i.toString().padStart(2, '0')}.png`
  )
  const revWalkingFrames = Array.from(
    { length: 20 },
    (_, i) => `rev-walking-frame/fwalkcycle${i.toString().padStart(2, '0')}.png`
  )
  const allWalkerFrames = [...walkingFrames, ...revWalkingFrames]
  const hotspotImages = document.querySelectorAll('.hotspot img')
  const totalImagesToLoad = backgroundImages.length + allWalkerFrames.length + hotspotImages.length + 1
  let loadedImages = 0
  function updateLoading() {
    const percentage = (loadedImages / totalImagesToLoad) * 100
    let loadingSrc
    if (percentage < 25) {
      loadingSrc = 'assets/loading/loading-0.png'
    } else if (percentage < 50) {
      loadingSrc = 'assets/loading/loading-25.png'
    } else if (percentage < 75) {
      loadingSrc = 'assets/loading/loading-50.png'
    } else if (percentage < 100) {
      loadingSrc = 'assets/loading/loading-75.png'
    } else {
      loadingSrc = 'assets/loading/loading-100.png'
      setTimeout(() => {
        elements.loadingScreen.style.opacity = '0'
        setTimeout(() => {
          elements.loadingScreen.style.display = 'none'
          document.body.classList.remove('loading')
          initializeSystem()
        }, 500)
      }, 500)
    }
    elements.loadingImage.src = loadingSrc
  }
  const loadingImage = new Image()
  loadingImage.src = elements.loadingImage.src
  if (loadingImage.complete) {
    loadedImages++
    updateLoading()
  } else {
    loadingImage.onload = () => {
      loadedImages++
      updateLoading()
    }
    loadingImage.onerror = () => {
      loadedImages++
      updateLoading()
    }
  }
  hotspotImages.forEach(img => {
    if (img.complete) {
      loadedImages++
      updateLoading()
    } else {
      img.onload = () => {
        loadedImages++
        updateLoading()
      }
      img.onerror = () => {
        loadedImages++
        updateLoading()
      }
    }
  })
  allWalkerFrames.forEach(src => {
    const img = new Image()
    img.src = src
    if (img.complete) {
      loadedImages++
      updateLoading()
    } else {
      img.onload = () => {
        loadedImages++
        updateLoading()
      }
      img.onerror = () => {
        loadedImages++
        updateLoading()
      }
    }
  })
  backgroundImages.forEach((imgData, index) => {
    const img = new Image()
    img.onload = () => {
      if (imgData.isFirst) {
        img.classList.add('first-background')
      }
      elements.background.appendChild(img)
      loadedImages++
      updateLoading()
    }
    img.onerror = () => {
      loadedImages++
      updateLoading()
    }
    img.src = imgData.src
    if (img.complete) {
      img.onload()
    }
  })
  function initializeSystem() {
    const currentState = {
      frame: 0,
      position: 0,
      targetPosition: 0,
      previousPosition: 0,
      currentPanel: 1,
      totalPanels: 3,
      isZoomed: false,
      animationEndOffset: ANIMATION_END_OFFSET,
      modalOpen: false,
      currentHotspot: null,
      // --- FIX START ---
      // Updated breakpoint from 768 to 470
      isMobile: window.innerWidth <= 477,
      // --- FIX END ---
      firstImageWidth: 0,
      roomStripWidth: 0,
      backgroundTotalWidth: 0,
      hotspotData: {
        dust: { x: 0.12, y: 0.45 },
        fish: { x: 0.38, y: 0.11 },
        wood: { x: 0.81, y: 0.11 },
        bread: { x: 0.34, y: 0.11 },
        lizard: { x: 0.90, y: 0.02 },
        bee: { x: 0.67, y: 0.16 },
        carrot: { x: 0.485, y: 0.09 },
        egg: { x: 0.52, y: 0.13 },
        hair: { x: 0.86, y: 0.20 },
        web: { x: 0.21, y: 0.12 }
      }
    }
    function setupBackgroundLink() {
      const backgroundLink = document.getElementById('background-link')
      const backgroundLinkAnchor = backgroundLink ? backgroundLink.querySelector('a') : null
      if (backgroundLink && backgroundLinkAnchor) {
        backgroundLinkAnchor.addEventListener('click', function(e) {
          e.stopPropagation()
          return true
        })
      }
    }
    function updateLayoutDimensions() {
      const firstBackgroundImg = elements.background.querySelector('.first-background')
      if (firstBackgroundImg) {
        currentState.firstImageWidth = firstBackgroundImg.offsetWidth
      } else {
        currentState.firstImageWidth = currentState.isMobile ? 1080 : 1920
      }
      const roomStripImg = elements.background.querySelector('img:not(.first-background)')
      if (roomStripImg) {
        const roomStripOriginalWidth = backgroundImages[1].originalWidth
        const roomStripOriginalHeight = 1080
        currentState.roomStripWidth = (elements.background.offsetHeight / roomStripOriginalHeight) * roomStripOriginalWidth
        roomStripImg.style.width = `${currentState.roomStripWidth}px`
      } else {
        currentState.roomStripWidth = backgroundImages[1].originalWidth
      }
      currentState.backgroundTotalWidth = currentState.firstImageWidth + currentState.roomStripWidth
      elements.background.style.width = `${currentState.backgroundTotalWidth}px`
      elements.calloutsContainer.style.width = `${currentState.backgroundTotalWidth}px`
      
      enforceBoundaries()
    }
    const positionCalloutsDynamically = () => {
      elements.hotspots.forEach(hotspot => {
        const hotspotClass = Array.from(hotspot.classList).find(cls => cls.startsWith('hotspot-'))
        const hotspotName = hotspotClass.replace('hotspot-', '')
        const data = currentState.hotspotData[hotspotName]
        if (data) {
          const hotspotLeft = currentState.firstImageWidth + data.x * currentState.roomStripWidth
          hotspot.style.left = `${hotspotLeft}px`
          hotspot.style.top = `${data.y * 100}%`
        }
        hotspot.classList.add('active')
      })
    }
    updateLayoutDimensions()
    positionCalloutsDynamically()
    setupBackgroundLink()
    document.addEventListener('click', function(e) {
      const backgroundLink = document.getElementById('background-link')
      if (backgroundLink && (e.target === backgroundLink || backgroundLink.contains(e.target))) {
        return true
      }
    })
    function enforceBoundaries() {
      const actualMaxScroll = elements.background.scrollWidth - window.innerWidth;
      const adjustedMax = actualMaxScroll - currentState.animationEndOffset;
      currentState.maxPosition = Math.max(0, adjustedMax);
      if (currentState.isMobile) {
        currentState.maxPosition *= 0.92;
      } else {
        currentState.maxPosition *= 0.95;
      }
      currentState.position = Math.max(0, Math.min(currentState.position, currentState.maxPosition));
      currentState.targetPosition = Math.max(0, Math.min(currentState.targetPosition, currentState.maxPosition));
    }
    function updateWalk() {
      enforceBoundaries();
      if (Math.abs(currentState.targetPosition - currentState.position) > 0.5) {
        currentState.position += (currentState.targetPosition - currentState.position) * 0.1;
      }
      const animationStartPoint = currentState.isMobile
        ? currentState.firstImageWidth - window.innerWidth * 0.1
        : currentState.firstImageWidth - window.innerWidth * 0.4;
      const shouldShowWalker = currentState.position >= animationStartPoint && !currentState.modalOpen;
      elements.walker.style.opacity = shouldShowWalker ? '1' : '0';
      if (shouldShowWalker) {
        const intendedDirection = currentState.targetPosition - currentState.position;
        const frameSet = intendedDirection >= 0 ? walkingFrames : revWalkingFrames;
        const progress = (currentState.position - animationStartPoint) / (currentState.maxPosition - animationStartPoint);
        currentState.frame = Math.floor(progress * 30 * frameSet.length) % frameSet.length;
        elements.walker.src = frameSet[currentState.frame];
      }
      const translateX = `translateX(-${currentState.position}px)`;
      elements.background.style.transform = translateX;
      elements.calloutsContainer.style.transform = translateX;
      if (elements.backgroundLink) {
        elements.backgroundLink.style.transform = translateX;
      }
      currentState.previousPosition = currentState.position;
      requestAnimationFrame(updateWalk);
    }
    
    window.addEventListener('resize', () => {
      const wasMobile = currentState.isMobile;
      // --- FIX START ---
      // Updated breakpoint from 768 to 470
      currentState.isMobile = window.innerWidth <= 477;
      // --- FIX END ---
      const hasBreakpointCrossed = wasMobile !== currentState.isMobile;

      updateLayoutDimensions();
      positionCalloutsDynamically();
      enforceBoundaries();

      const translateX = `translateX(-${currentState.position}px)`;
      elements.background.style.transform = translateX;
      elements.calloutsContainer.style.transform = translateX;
      if (elements.backgroundLink) {
          elements.backgroundLink.style.transform = translateX;
      }
      
      if (hasBreakpointCrossed && currentState.modalOpen) {
          showPanel(currentState.currentPanel);
      }
    });

    elements.hotspots.forEach(hotspot => {
      hotspot.addEventListener('click', function(e) {
        e.stopPropagation()
        elements.hotspots.forEach(hs => {
          if (hs !== hotspot && hs.classList.contains('zoomed')) {
            hs.classList.remove('zoomed')
          }
        })
        this.classList.toggle('zoomed')
        currentState.isZoomed = this.classList.contains('zoomed')
        if (currentState.isZoomed) {
          const hotspotClass = Array.from(this.classList).find(cls => cls.startsWith('hotspot-'))
          const hotspotName = hotspotClass.replace('hotspot-', '')
          currentState.currentHotspot = hotspotName
          showPanel(1)
        } else {
          currentState.currentHotspot = null
          showPanel(0)
        }
      }, { capture: true })
    })
    const scrollSensitivity = currentState.isMobile ? 1.5 : 0.8
    window.addEventListener('wheel', e => {
      if (!e.target.closest('.hotspot') && !e.target.closest('#modal-content')) {
        e.preventDefault()
        currentState.targetPosition += e.deltaY * scrollSensitivity
        enforceBoundaries()
      }
    }, { passive: false })
    let touchStartX = 0
    let touchStartY = 0
    window.addEventListener('touchstart', e => {
      if (!currentState.modalOpen && !e.target.closest('.hotspot')) {
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
      }
    }, { passive: false })
    window.addEventListener('touchmove', e => {
      if (!currentState.modalOpen && !e.target.closest('.hotspot')) {
        e.preventDefault()
        const deltaY = e.touches[0].clientY - touchStartY
        currentState.targetPosition += deltaY * (currentState.isMobile ? -2.5 : -1.5)
        enforceBoundaries()
        touchStartY = e.touches[0].clientY
        touchStartX = e.touches[0].clientX
      }
    }, { passive: false })
    function showPanel(panelNumber) {
      currentState.currentPanel = panelNumber
      const folder = currentState.isMobile ? 'mobile' : 'desktop'
      if (panelNumber > 0) {
        elements.modalImage.src = `assets/texts/${folder}/${currentState.currentHotspot}/${panelNumber}.png`
        elements.modal.classList.add('visible')
        currentState.modalOpen = true
      } else {
        elements.modal.classList.remove('visible')
        currentState.modalOpen = false
      }
      elements.modalPrev.style.display = panelNumber > 1 ? 'block' : 'none'
      elements.modalNext.style.display = panelNumber < currentState.totalPanels ? 'block' : 'none'
    }
    elements.modalNext.addEventListener('click', e => {
      e.preventDefault()
      if (currentState.currentPanel < currentState.totalPanels)
        showPanel(currentState.currentPanel + 1)
    })
    elements.modalPrev.addEventListener('click', e => {
      e.preventDefault()
      if (currentState.currentPanel > 1)
        showPanel(currentState.currentPanel - 1)
    })
    elements.modalClose.addEventListener('click', e => {
      e.preventDefault()
      elements.hotspots.forEach(hs => hs.classList.remove('zoomed'))
      currentState.isZoomed = false
      currentState.currentHotspot = null
      elements.modal.classList.remove('visible')
      currentState.modalOpen = false
    })
    requestAnimationFrame(updateWalk)
  }
})