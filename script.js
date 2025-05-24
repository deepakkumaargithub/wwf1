document.addEventListener('DOMContentLoaded', () => {

  const ANIMATION_END_OFFSET_DESKTOP = 300;
  const ANIMATION_END_OFFSET_MOBILE = 100;


  const loadingSpinnerFrames = [
    'assets/loading/loading-0.png', 'assets/loading/loading-25.png',
    'assets/loading/loading-50.png', 'assets/loading/loading-75.png',
    'assets/loading/loading-100.png'
  ];
  loadingSpinnerFrames.forEach(src => {
    (new Image()).src = src;
  });


  const elements = {
    backgroundContainer: document.getElementById('background'),
    walker: document.getElementById('walker'),
    modal: document.getElementById('modal'),
    modalImage: document.getElementById('modal-image'),
    modalClose: document.getElementById('modal-close'),
    modalPrev: document.getElementById('modal-prev'),
    modalNext: document.getElementById('modal-next'),
    loadingScreen: document.getElementById('loading-screen'),
    loadingImageElement: document.getElementById('loading-image'),
    hotspotTemplatesContainer: document.getElementById('hotspot-templates')

  };


  elements.loadingImageElement.src = loadingSpinnerFrames[0];


  const sceneData = [{
      id: 'page1',
      srcDesktop: 'backgrounds/page1.png',
      srcMobile: 'backgrounds/page1-mobile.png',
      isViewportCover: true,
    },
    {
      id: 'room1',
      src: 'backgrounds/room1.PNG',
      originalDesignWidth: 2730,
      hotspots: [{
        id: 'dust',
        top: 60,
        left: 50,
      }, {
        id: 'web',
        top: 22,
        leftDynamic: {
          basePercent: 75,
          fixedOffsetPx: 100
        }
      }]
    },
    {
      id: 'room2',
      src: 'backgrounds/room2.PNG',
      originalDesignWidth: 3255,
      hotspots: [{
        id: 'fish',
        top: 25,
        left: (1100 / 3255) * 100
      }, {
        id: 'bread',
        top: 25,
        left: (700 / 3255) * 100
      }, {
        id: 'carrot',
        top: 24,
        left: (2200 / 3255) * 100
      }, {
        id: 'egg',
        top: 24,
        left: (2450 / 3255) * 100
      }]
    },
    {
      id: 'room3',
      src: 'backgrounds/room3.PNG',
      originalDesignWidth: 1700,
      hotspots: [{
        id: 'bee',
        top: 31,
        left: (750 / 1700) * 100
      }, ]
    },
    {
      id: 'room4',
      src: 'backgrounds/room4.PNG',
      originalDesignWidth: 2250,
      hotspots: [{
        id: 'lizard',
        top: 17,
        left: (1350 / 2250) * 100
      }, {
        id: 'hair',
        top: 31,
        left: (870 / 2250) * 100
      }, {
        id: 'wood',
        top: 22,
        left: (300 / 1700) * 100
      }]
    }
  ];


  const walkingFrames = Array.from({
    length: 20
  }, (_, i) => `walking-frames/Layer_${i.toString().padStart(2, '0')}.png`);
  const revWalkingFrames = Array.from({
    length: 20
  }, (_, i) => `rev-walking-frame/fwalkcycle${i.toString().padStart(2, '0')}.png`);
  const allWalkerFrames = [...walkingFrames, ...revWalkingFrames];


  let totalImagesToLoad = 0;

  totalImagesToLoad += sceneData.length;

  totalImagesToLoad += allWalkerFrames.length;

  sceneData.forEach(scene => {
    if (scene.hotspots) {
      totalImagesToLoad += scene.hotspots.length;
    }
  });

  let loadedImages = 0;
  const backgroundSegmentElements = [];


  function updateLoadingProgress() {
    if (totalImagesToLoad === 0) {
      finishLoading();
      return;
    }
    const percentage = Math.min(100, (loadedImages / totalImagesToLoad) * 100);
    let frameIndex = Math.floor(percentage / 25);
    if (percentage >= 99) frameIndex = loadingSpinnerFrames.length - 1;
    elements.loadingImageElement.src = loadingSpinnerFrames[frameIndex];

    if (percentage >= 100) {
      finishLoading();
    }
  }

  function finishLoading() {
    setTimeout(() => {
      document.body.classList.remove('loading');
      elements.loadingScreen.style.opacity = '0';
      setTimeout(() => {
        elements.loadingScreen.style.display = 'none';
        initializeSystem();
      }, 500);
    }, 200);
  }

  function imageLoaded() {
    loadedImages++;
    updateLoadingProgress();
  }

  function imageError(src) {
    console.error(`Failed to load image: ${src}`);
    loadedImages++;
    updateLoadingProgress();
  }


  allWalkerFrames.forEach(src => {
    const img = new Image();
    img.onload = imageLoaded;
    img.onerror = () => imageError(src);
    img.src = src;
  });


  sceneData.forEach((sceneItem) => {
    const segmentDiv = document.createElement('div');
    segmentDiv.classList.add('background-segment');
    segmentDiv.id = `segment-${sceneItem.id}`;

    const bgImg = new Image();
    bgImg.classList.add('bg-image');

    const isMobile = window.innerWidth <= 768;
    if (sceneItem.isViewportCover) {
      bgImg.src = isMobile && sceneItem.srcMobile ? sceneItem.srcMobile : sceneItem.srcDesktop;
    } else {
      bgImg.src = sceneItem.src;
    }

    const segmentData = {
      id: sceneItem.id,
      element: segmentDiv,
      imageElement: bgImg,
      naturalWidth: 0,
      naturalHeight: 0,
      currentWidth: 0,
      sceneDefinition: sceneItem,
      isViewportCover: !!sceneItem.isViewportCover
    };
    backgroundSegmentElements.push(segmentData);

    bgImg.onload = () => {
      segmentData.naturalWidth = bgImg.naturalWidth;
      segmentData.naturalHeight = bgImg.naturalHeight;
      imageLoaded();


      if (sceneItem.hotspots) {
        sceneItem.hotspots.forEach(hotspotDef => {
          const hotspotTemplate = elements.hotspotTemplatesContainer.querySelector(`.hotspot[data-hotspot-id="${hotspotDef.id}"]`);
          if (hotspotTemplate) {
            const hotspotInstance = hotspotTemplate.cloneNode(true);

            if (hotspotDef.leftDynamic) {

              hotspotInstance.style.left = `calc(${hotspotDef.leftDynamic.basePercent}% + ${hotspotDef.leftDynamic.fixedOffsetPx}px)`;
            } else {

              hotspotInstance.style.left = `${hotspotDef.left}%`;
            }
            hotspotInstance.style.top = `${hotspotDef.top}%`;
            segmentDiv.appendChild(hotspotInstance);

            if (hotspotDef.id === 'bread') {
              elements.breadHotspotElement = hotspotInstance;
            }

            const hotspotImg = hotspotInstance.querySelector('img');
            if (hotspotImg && hotspotImg.complete && hotspotImg.naturalWidth !== 0) {

              imageLoaded();
            } else if (hotspotImg) {

              hotspotImg.onload = imageLoaded;
              hotspotImg.onerror = () => imageError(hotspotImg.src);
            } else {

              imageLoaded();
            }
          } else {
            console.warn(`Hotspot template for ${hotspotDef.id} not found. Skipping.`);

            totalImagesToLoad = Math.max(0, totalImagesToLoad - 1);
            updateLoadingProgress();
          }
        });
      }

      segmentDiv.appendChild(bgImg);
      elements.backgroundContainer.appendChild(segmentDiv);



      const allBgImagesLoaded = backgroundSegmentElements.every(s => s.imageElement.complete);
      if (allBgImagesLoaded && loadedImages >= totalImagesToLoad) {

        if (!document.body.classList.contains('loading')) {

          handleResize();
        }
      }
    };
    bgImg.onerror = () => {
      imageError(bgImg.src);
      segmentData.naturalWidth = 1;
      segmentData.naturalHeight = 1;

      const allBgImagesAttempted = backgroundSegmentElements.every(s => s.imageElement.complete);
      if (allBgImagesAttempted && loadedImages >= totalImagesToLoad) {
        if (!document.body.classList.contains('loading')) {
          handleResize();
        }
      }
    };
  });


  const currentState = {
    frame: 0,
    position: 0,
    targetPosition: 0,
    previousPosition: 0,
    currentPanel: 0,
    totalPanels: 3,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    maxPosition: 0,
    modalOpen: false,
    isMobile: window.innerWidth <= 768,
    animationEndOffset: (window.innerWidth <= 768) ? ANIMATION_END_OFFSET_MOBILE : ANIMATION_END_OFFSET_DESKTOP,
    walkerVisible: false,
    totalScrollWidth: 0,
    isMoving: false
  };



  function calculateSegmentWidthsAndTotal() {
    currentState.totalScrollWidth = 0;
    currentState.viewportWidth = window.innerWidth;
    currentState.viewportHeight = window.innerHeight;

    backgroundSegmentElements.forEach(segment => {
      if (segment.isViewportCover) {

        segment.currentWidth = currentState.viewportWidth;
      } else {

        if (segment.naturalHeight > 0 && segment.naturalWidth > 0) {
          segment.currentWidth = (segment.naturalWidth / segment.naturalHeight) * currentState.viewportHeight;
        } else {

          segment.currentWidth = currentState.viewportWidth;
          console.warn(`Segment ${segment.id} natural dimensions not available, defaulting width.`);
        }
      }
      segment.element.style.width = `${segment.currentWidth}px`;
      currentState.totalScrollWidth += segment.currentWidth;
    });
    elements.backgroundContainer.style.width = `${currentState.totalScrollWidth}px`;
  }


  function calculateMaxPosition() {
    const actualMaxScroll = currentState.totalScrollWidth - currentState.viewportWidth;

    currentState.maxPosition = Math.max(0, actualMaxScroll - currentState.animationEndOffset);
  }


  function applyWalkerStyles() {
    currentState.isMobile = window.innerWidth <= 768;
    currentState.animationEndOffset = currentState.isMobile ? ANIMATION_END_OFFSET_MOBILE : ANIMATION_END_OFFSET_DESKTOP;

    // Set the bottom property based on device type
    elements.walker.style.bottom = currentState.isMobile ? '0%' : '-5%';
    // Remove the translateY from here, it will be handled by visibility logic
    elements.walker.style.transform = 'translateY(0%)';
  }


  function getWalkerAnimationStartPoint() {
    if (backgroundSegmentElements.length === 0 || !backgroundSegmentElements[0].currentWidth) {
      return currentState.viewportWidth * 0.85;
    }

    return backgroundSegmentElements[0].currentWidth * 0.85;
  }


  function enforceBoundaries() {
    currentState.targetPosition = Math.max(0, Math.min(currentState.targetPosition, currentState.maxPosition));
    currentState.position = Math.max(0, Math.min(currentState.position, currentState.maxPosition));
  }


  function updateWalkAndScroll() {

    const prevPositionBeforeUpdate = currentState.position;


    if (Math.abs(currentState.targetPosition - currentState.position) > 0.05) {
      currentState.position += (currentState.targetPosition - currentState.position) * 0.12;
      enforceBoundaries();
      currentState.isMoving = true;
    } else {
      currentState.position = currentState.targetPosition;
      currentState.isMoving = false;
    }


    const animationStartPoint = getWalkerAnimationStartPoint();
    const shouldShowWalker = currentState.position >= animationStartPoint && !currentState.modalOpen;

    if (shouldShowWalker !== currentState.walkerVisible) {
      elements.walker.style.opacity = shouldShowWalker ? '1' : '0';
      // No translateY adjustments here, relies on fixed bottom position
      currentState.walkerVisible = shouldShowWalker;
    }


    if (shouldShowWalker) {
      const actualMovementDelta = currentState.position - prevPositionBeforeUpdate;

      if (currentState.isMoving && Math.abs(actualMovementDelta) > 2) {
        const frameSet = actualMovementDelta >= 0 ? walkingFrames : revWalkingFrames;
        currentState.frame = (currentState.frame + 1) % frameSet.length;
        elements.walker.src = frameSet[currentState.frame];
        currentState.previousPosition = currentState.position;
      }
    }


    elements.backgroundContainer.style.transform = `translateX(-${currentState.position}px)`;



    requestAnimationFrame(updateWalkAndScroll);
  }



  function handleResize() {

    const oldTotalScrollWidth = currentState.totalScrollWidth;
    const oldPosition = currentState.position;
    let scrollProgress = 0;

    if (oldTotalScrollWidth > currentState.viewportWidth) {
      scrollProgress = oldPosition / (oldTotalScrollWidth - currentState.viewportWidth);
    }

    applyWalkerStyles();
    calculateSegmentWidthsAndTotal();
    calculateMaxPosition();

    let newTargetPosition = 0;
    if (currentState.totalScrollWidth > currentState.viewportWidth) {
      newTargetPosition = scrollProgress * (currentState.totalScrollWidth - currentState.viewportWidth);
    }

    currentState.targetPosition = newTargetPosition;
    currentState.position = newTargetPosition;
    enforceBoundaries();

    // Immediately update walker visibility based on the new position after resize
    const animationStartPoint = getWalkerAnimationStartPoint();
    const shouldShowWalker = currentState.position >= animationStartPoint && !currentState.modalOpen;
    elements.walker.style.opacity = shouldShowWalker ? '1' : '0';
    currentState.walkerVisible = shouldShowWalker;


    elements.backgroundContainer.style.transform = `translateX(-${currentState.position}px)`;
  }


  function initializeSystem() {
    applyWalkerStyles();
    calculateSegmentWidthsAndTotal();
    calculateMaxPosition();


    currentState.position = 0;
    currentState.targetPosition = 0;
    currentState.previousPosition = 0;
    enforceBoundaries();

    window.addEventListener('resize', handleResize);


    if (elements.breadHotspotElement) {
      elements.breadHotspotElement.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('zoomed');
        showPanel(this.classList.contains('zoomed') ? 1 : 0);
      });
    } else {
      console.warn("Bread hotspot element was not found during initialization. Interactive modal will not work.");
    }


    const scrollSensitivity = 1.5;
    window.addEventListener('wheel', e => {

      if (currentState.modalOpen && elements.modal.contains(e.target)) return;
      if (currentState.modalOpen) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      currentState.targetPosition += e.deltaY * scrollSensitivity;
      enforceBoundaries();
    }, {
      passive: false
    });


    let touchStartX = 0;
    window.addEventListener('touchstart', e => {
      if (currentState.modalOpen) return;
      touchStartX = e.touches[0].clientX;
    }, {
      passive: true
    });

    window.addEventListener('touchmove', e => {

      if (currentState.modalOpen && elements.modal.contains(e.target)) return;
      if (currentState.modalOpen) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      const touchMoveX = e.touches[0].clientX;
      const deltaX = touchMoveX - touchStartX;

      currentState.targetPosition -= deltaX * (currentState.isMobile ? 2.0 : 1.8);
      touchStartX = touchMoveX;
      enforceBoundaries();
    }, {
      passive: false
    });


    function showPanel(panelNumber) {
      currentState.currentPanel = panelNumber;
      const folder = currentState.isMobile ? 'mobile' : 'desktop';
      if (panelNumber > 0 && panelNumber <= currentState.totalPanels) {
        elements.modalImage.src = `assets/texts/${folder}/${panelNumber}.png`;
        elements.modal.classList.add('visible');
        currentState.modalOpen = true;

        if (currentState.walkerVisible) elements.walker.style.opacity = '0';
      } else {
        elements.modal.classList.remove('visible');
        currentState.modalOpen = false;

        // Restore walker visibility if it was previously visible
        const animationStartPoint = getWalkerAnimationStartPoint();
        const shouldShowWalker = currentState.position >= animationStartPoint; // Check if it should be visible based on position
        if (shouldShowWalker) elements.walker.style.opacity = '1';

        if (elements.breadHotspotElement && elements.breadHotspotElement.classList.contains('zoomed')) {
          elements.breadHotspotElement.classList.remove('zoomed');
        }
      }

      elements.modalPrev.style.display = panelNumber > 1 ? 'block' : 'none';
      elements.modalNext.style.display = panelNumber < currentState.totalPanels && panelNumber > 0 ? 'block' : 'none';
    }


    elements.modalNext.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if (currentState.currentPanel < currentState.totalPanels) showPanel(currentState.currentPanel + 1);
    });
    elements.modalPrev.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if (currentState.currentPanel > 1) showPanel(currentState.currentPanel - 1);
    });
    elements.modalClose.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      showPanel(0);
    });


    requestAnimationFrame(updateWalkAndScroll);
  }


  updateLoadingProgress();
});