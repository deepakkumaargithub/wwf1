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
        left: (300 / 1700) * 100 // Typo in original? Using 1700, room4 width is 2250. Assuming it should be 2250.
        // Corrected: left: (300 / 2250) * 100
      }]
    }
  ];
  // Correcting potential typo in sceneData for room4, wood hotspot 'left' calculation
  const room4WoodHotspot = sceneData.find(s => s.id === 'room4')?.hotspots?.find(h => h.id === 'wood');
  if (room4WoodHotspot && room4WoodHotspot.left === (300 / 1700) * 100) {
      console.warn("Correcting 'wood' hotspot 'left' value in room4. Original calculation used 1700, room4 width is 2250.");
      room4WoodHotspot.left = (300 / 2250) * 100;
  }


  const walkingFrames = Array.from({
    length: 20
  }, (_, i) => `walking-frames/Layer_${i.toString().padStart(2, '0')}.png`);
  const revWalkingFrames = Array.from({
    length: 20
  }, (_, i) => `rev-walking-frame/fwalkcycle${i.toString().padStart(2, '0')}.png`);
  const allWalkerFrames = [...walkingFrames, ...revWalkingFrames];

  let totalImagesToLoad = 0;
  totalImagesToLoad += sceneData.length; // For background images
  totalImagesToLoad += allWalkerFrames.length; // For walker frames
  sceneData.forEach(scene => {
    if (scene.hotspots) {
      // Each hotspot template img is already in HTML, instance img src will be same
      // The actual hotspot images are preloaded if they are in hotspotTemplatesContainer
      // We need to count images that are dynamically set if their templates are used.
      // The current setup preloads template images. Let's assume these are loaded with the HTML.
      // The imageLoaded() for hotspots is called if hotspotImg.complete is false.
    }
  });
  // Refined image counting:
  // Count background images from sceneData
  totalImagesToLoad = 0;
  sceneData.forEach(scene => {
    const isMobile = window.innerWidth <= 768;
    if (scene.isViewportCover) {
      totalImagesToLoad++; // Desktop or mobile version
    } else {
      totalImagesToLoad++; // Regular src
    }
  });
  totalImagesToLoad += allWalkerFrames.length;
  // Hotspot images are within templates, their loading is handled, but let's ensure they are counted if cloned
  // The provided logic adds to totalImagesToLoad inside sceneData.forEach loop if (scene.hotspots)
  // This seems to be what was intended but let's make it cleaner.
  // The original logic in the prompt for totalImagesToLoad for hotspots was complex.
  // Let's simplify assuming template images are the ones to count if used.
  const uniqueHotspotTemplateIds = new Set(sceneData.flatMap(s => s.hotspots ? s.hotspots.map(h => h.id) : []));
  totalImagesToLoad += uniqueHotspotTemplateIds.size;


  let loadedImages = 0;
  const backgroundSegmentElements = [];

  function updateLoadingProgress() {
    if (totalImagesToLoad === 0) { // Prevent division by zero if no images
      finishLoading();
      return;
    }
    const percentage = Math.min(100, (loadedImages / totalImagesToLoad) * 100);
    let frameIndex = Math.floor(percentage / 25);
    if (percentage >= 99) frameIndex = loadingSpinnerFrames.length - 1;
    elements.loadingImageElement.src = loadingSpinnerFrames[frameIndex];

    if (percentage >= 100 && loadedImages >= totalImagesToLoad) { // Ensure all are truly loaded
      finishLoading();
    }
  }

  let loadingFinished = false;
  function finishLoading() {
    if (loadingFinished) return;
    loadingFinished = true;

    setTimeout(() => {
      document.body.classList.remove('loading');
      elements.loadingScreen.style.opacity = '0';
      setTimeout(() => {
        elements.loadingScreen.style.display = 'none';
        initializeSystem();
      }, 500); // Matches CSS transition
    }, 200); // Small delay before starting fade out
  }

  function imageLoaded() {
    loadedImages++;
    updateLoadingProgress();
  }

  function imageError(src) {
    console.error(`Failed to load image: ${src}`);
    loadedImages++; // Still count it to not stall loading indefinitely
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

    // const bgImg = new Image();
    // bgImg.classList.add('bg-image');

    // const isMobile = window.innerWidth <= 768;
    // if (sceneItem.isViewportCover) {
    //   bgImg.src = isMobile && sceneItem.srcMobile ? sceneItem.srcMobile : sceneItem.srcDesktop;
    //   // *** MODIFICATION FOR PAGE1 MOBILE BOTTOM CROPPING ***
    //   if (isMobile && sceneItem.id === 'page1') {
    //     bgImg.style.objectPosition = 'center bottom';
    //   } else {
    //     bgImg.style.objectPosition = 'center center'; // Default for other cover images
    //   }
    // } else {
    //   bgImg.src = sceneItem.src;
    // }
    const bgImg = new Image();
    bgImg.classList.add('bg-image');

    const isMobile = window.innerWidth <= 768;

    if (sceneItem.isViewportCover) {
      bgImg.src = isMobile && sceneItem.srcMobile ? sceneItem.srcMobile : sceneItem.srcDesktop;
      
      if (isMobile && sceneItem.id === 'page1-mobile') {
        // *** Ensure 'cover' and align bottom for page1 mobile ***
        bgImg.style.objectFit = 'cover';           // CRITICAL: Ensures it covers the area (no empty spaces)
        bgImg.style.objectPosition = 'center bottom'; // Aligns bottom of image with bottom of container
      } else {
        // Default for other scenes or desktop view of page1
        bgImg.style.objectFit = 'cover';
        bgImg.style.objectPosition = 'center center';
      }
      // Ensure segmentDiv background color is cleared if it was set by a previous 'contain' attempt
      segmentDiv.style.backgroundColor = ''; 

    } else {
      // For non-cover scenes
      bgImg.src = sceneItem.src;
      bgImg.style.objectFit = 'cover'; 
      bgImg.style.objectPosition = 'center center';
      // Ensure segmentDiv background color is cleared
      segmentDiv.style.backgroundColor = '';
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
      imageLoaded(); // For the background image itself

      if (sceneItem.hotspots) {
        sceneItem.hotspots.forEach(hotspotDef => {
          const hotspotTemplate = elements.hotspotTemplatesContainer.querySelector(`.hotspot[data-hotspot-id="${hotspotDef.id}"]`);
          if (hotspotTemplate) {
            const hotspotInstance = hotspotTemplate.cloneNode(true);
            hotspotInstance.style.left = hotspotDef.leftDynamic ?
              `calc(${hotspotDef.leftDynamic.basePercent}% + ${hotspotDef.leftDynamic.fixedOffsetPx}px)` :
              `${hotspotDef.left}%`;
            hotspotInstance.style.top = `${hotspotDef.top}%`;
            segmentDiv.appendChild(hotspotInstance);

            if (hotspotDef.id === 'bread') {
              elements.breadHotspotElement = hotspotInstance;
            }

            // Hotspot image loading is implicitly handled by browser for templates.
            // If we want to explicitly track them (e.g. if src was dynamic):
            const hotspotImg = hotspotInstance.querySelector('img');
            if (hotspotImg) {
                if (hotspotImg.complete && hotspotImg.naturalWidth !== 0) {
                    // Already loaded (likely cached or part of initial HTML parse)
                    // To avoid double counting if counted via uniqueHotspotTemplateIds
                } else {
                    // If not counted via uniqueHotspotTemplateIds, you might add imageLoaded/imageError here
                    // For simplicity, assuming template images are loaded and accounted for by uniqueHotspotTemplateIds
                }
            }
          } else {
            console.warn(`Hotspot template for ${hotspotDef.id} not found. Skipping.`);
            // If a hotspot template is missing, we should decrement totalImagesToLoad if it was counted
            // This part is tricky with the current loading count.
            // The `uniqueHotspotTemplateIds` approach is more robust.
          }
        });
      }

      segmentDiv.appendChild(bgImg);
      elements.backgroundContainer.appendChild(segmentDiv);

      // Check if all segment definitions are processed and their primary images loaded
      // This part of the original logic was a bit complex with `allBgImagesLoaded`.
      // The main `loadedImages >= totalImagesToLoad` check in `updateLoadingProgress` should handle completion.
      if (backgroundSegmentElements.length === sceneData.length && !document.body.classList.contains('loading')) {
          const allPrimaryImagesAttempted = backgroundSegmentElements.every(s => s.imageElement.complete || s.imageElement.errorState);
          if(allPrimaryImagesAttempted) {
            handleResize(); // Perform an initial resize calculation once images are in DOM
          }
      }
    };
    bgImg.onerror = () => {
      segmentData.naturalWidth = 1; // Avoid division by zero
      segmentData.naturalHeight = 1;
      segmentData.errorState = true; // Mark as errored
      imageError(bgImg.src); // Handles loadedImages count and progress update
      
      segmentDiv.appendChild(bgImg); // Still append to maintain structure
      elements.backgroundContainer.appendChild(segmentDiv);

      if (backgroundSegmentElements.length === sceneData.length && !document.body.classList.contains('loading')) {
         const allPrimaryImagesAttempted = backgroundSegmentElements.every(s => s.imageElement.complete || s.imageElement.errorState);
         if(allPrimaryImagesAttempted) {
            handleResize();
         }
      }
    };
  });
  // Preload hotspot images from templates that are actually used
  uniqueHotspotTemplateIds.forEach(id => {
      const hotspotTemplate = elements.hotspotTemplatesContainer.querySelector(`.hotspot[data-hotspot-id="${id}"] img`);
      if (hotspotTemplate && hotspotTemplate.src) {
          const img = new Image();
          img.onload = imageLoaded;
          img.onerror = () => imageError(hotspotTemplate.src);
          img.src = hotspotTemplate.src;
      } else {
          // If a template or its image is missing, but was counted, we need to adjust.
          // For simplicity, we assume valid templates for counted IDs.
          // Or, we could decrement totalImagesToLoad here and call updateLoadingProgress.
          console.warn(`Hotspot template image for ID ${id} not found for preloading.`);
          imageLoaded(); // Count as "attempted" to prevent stall
      }
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
      if (segment.imageElement && segment.imageElement.complete && segment.imageElement.naturalWidth > 0) {
        segment.naturalWidth = segment.imageElement.naturalWidth;
        segment.naturalHeight = segment.imageElement.naturalHeight;
      } else if (!segment.naturalWidth && !segment.errorState) { // If naturalWidth is still 0 and not an error case
          // console.warn(`Segment ${segment.id} image not fully loaded or dimensions unavailable for width calculation. May cause flicker on first resize.`);
          // Use viewportHeight or a default aspect ratio if natural dimensions aren't ready
      }


      if (segment.isViewportCover) {
        segment.currentWidth = currentState.viewportWidth;
      } else {
        if (segment.naturalHeight > 0 && segment.naturalWidth > 0) {
          segment.currentWidth = (segment.naturalWidth / segment.naturalHeight) * currentState.viewportHeight;
        } else {
          // Fallback if dimensions are still not available (e.g. error or very fast resize)
          segment.currentWidth = currentState.viewportWidth; 
          // console.warn(`Segment ${segment.id} natural dimensions not available for aspect ratio, defaulting width.`);
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
    elements.walker.style.bottom = currentState.isMobile ? '0%' : '-5%';
    elements.walker.style.transform = 'translateY(0%)';
  }

  function getWalkerAnimationStartPoint() {
    if (backgroundSegmentElements.length === 0 || !backgroundSegmentElements[0].currentWidth) {
      return currentState.viewportWidth * 0.85; // Fallback
    }
    // Start walker animation after a portion of the first segment is scrolled
    // Or, if the first segment is viewport cover, start when scrolling effectively begins past it.
    if (backgroundSegmentElements[0].isViewportCover) {
        // Start animation a bit into the scroll, not immediately at 0 if first page is just a cover.
        // This value might need tuning based on when the "walkable" area begins.
        // If page1 is purely introductory, walker might appear when page2 (room1) starts.
        // For now, let's keep it similar to original: a fraction of first segment's width.
        return backgroundSegmentElements[0].currentWidth * 0.85;
    }
    return backgroundSegmentElements[0].currentWidth * 0.85;
  }

  function enforceBoundaries() {
    currentState.targetPosition = Math.max(0, Math.min(currentState.targetPosition, currentState.maxPosition));
    // Position will smoothly follow target, so it should also be bounded by the animation loop.
    // currentState.position = Math.max(0, Math.min(currentState.position, currentState.maxPosition));
  }

  function updateWalkAndScroll() {
    const prevPositionBeforeUpdate = currentState.position;

    if (Math.abs(currentState.targetPosition - currentState.position) > 0.05) {
      currentState.position += (currentState.targetPosition - currentState.position) * 0.12; // Smoothing
      currentState.position = Math.max(0, Math.min(currentState.position, currentState.maxPosition)); // Clamp intermediate position too
      currentState.isMoving = true;
    } else {
      currentState.position = currentState.targetPosition;
      currentState.isMoving = false;
    }

    const animationStartPoint = getWalkerAnimationStartPoint();
    const shouldShowWalker = currentState.position >= animationStartPoint && !currentState.modalOpen;

    if (shouldShowWalker !== currentState.walkerVisible) {
      elements.walker.style.opacity = shouldShowWalker ? '1' : '0';
      currentState.walkerVisible = shouldShowWalker;
    }

    if (shouldShowWalker) {
      const actualMovementDelta = currentState.position - prevPositionBeforeUpdate;
      if (currentState.isMoving && Math.abs(actualMovementDelta) > 0.5) { // Adjusted threshold for frame change
        const frameSet = actualMovementDelta >= 0 ? walkingFrames : revWalkingFrames;
        currentState.frame = (currentState.frame + 1) % frameSet.length;
        elements.walker.src = frameSet[currentState.frame];
      }
    }
    // Removed previousPosition update from here, as it's effectively prevPositionBeforeUpdate

    elements.backgroundContainer.style.transform = `translateX(-${currentState.position}px)`;
    requestAnimationFrame(updateWalkAndScroll);
  }

  function handleResize() {
    const oldViewportWidth = currentState.viewportWidth;
    const oldTotalScrollWidth = currentState.totalScrollWidth;
    const oldPosition = currentState.position;
    
    let scrollProgress = 0;
    if (oldTotalScrollWidth > oldViewportWidth && oldTotalScrollWidth > 0) { // Avoid division by zero
        scrollProgress = oldPosition / (oldTotalScrollWidth - oldViewportWidth);
        scrollProgress = Math.max(0, Math.min(1, scrollProgress)); // Clamp progress
    }

    applyWalkerStyles(); // Applies mobile/desktop styles
    calculateSegmentWidthsAndTotal(); // Recalculates widths based on new viewport
    calculateMaxPosition(); // Recalculates max scroll position

    let newTargetPosition = 0;
    if (currentState.totalScrollWidth > currentState.viewportWidth) {
        newTargetPosition = scrollProgress * (currentState.totalScrollWidth - currentState.viewportWidth);
    }
    
    currentState.targetPosition = newTargetPosition;
    currentState.position = newTargetPosition; // Snap position on resize for consistency
    enforceBoundaries(); // Ensure it's within new bounds

    // Immediately update walker visibility based on the new position after resize
    const animationStartPoint = getWalkerAnimationStartPoint();
    const shouldShowWalker = currentState.position >= animationStartPoint && !currentState.modalOpen;
    elements.walker.style.opacity = shouldShowWalker ? '1' : '0';
    currentState.walkerVisible = shouldShowWalker;

    elements.backgroundContainer.style.transform = `translateX(-${currentState.position}px)`;
  }

  function initializeSystem() {
    applyWalkerStyles();
    calculateSegmentWidthsAndTotal(); // Initial calculation
    calculateMaxPosition();

    currentState.position = 0;
    currentState.targetPosition = 0;
    // currentState.previousPosition = 0; // Not explicitly used in current walker frame logic
    enforceBoundaries();

    window.addEventListener('resize', handleResize);

    if (elements.breadHotspotElement) {
      elements.breadHotspotElement.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('zoomed');
        showPanel(this.classList.contains('zoomed') ? 1 : 0);
      });
    } else {
      console.warn("Bread hotspot element was not found during initialization. Interactive modal will not work as expected for bread.");
    }

    const scrollSensitivity = 1.5;
    window.addEventListener('wheel', e => {
      if (currentState.modalOpen && elements.modal.contains(e.target)) return;
      if (currentState.modalOpen) {
        e.preventDefault();
        return;
      }
      // No preventDefault here to allow page scroll if content overflows vertically, unless this is not desired.
      // If the page itself should not scroll, then preventDefault.
      // For a full-screen horizontal scroll experience, usually you prevent default.
      e.preventDefault(); 
      currentState.targetPosition += e.deltaY * scrollSensitivity;
      enforceBoundaries();
    }, { passive: false });

    // *** MODIFICATION FOR SWIPE GESTURES (UP/DOWN) ***
    let touchStartY = 0; // Changed from touchStartX
    let touchStartTargetPosition = 0; // Store position at touch start

    window.addEventListener('touchstart', e => {
      if (currentState.modalOpen) return;
      if (e.touches.length === 1) { // Process single touches only
          touchStartY = e.touches[0].clientY; // Use clientY for vertical swipe
          touchStartTargetPosition = currentState.targetPosition; // Record current target
      }
    }, { passive: true }); // Passive true for start is okay as we don't preventDefault yet

    window.addEventListener('touchmove', e => {
      if (currentState.modalOpen && elements.modal.contains(e.target)) return;
      if (currentState.modalOpen || e.touches.length !== 1) {
        if (currentState.modalOpen) e.preventDefault(); // Prevent scroll if modal is open
        return;
      }
      e.preventDefault(); // Prevent default page scroll during horizontal drag

      const touchMoveY = e.touches[0].clientY; // Use clientY
      const deltaY = touchMoveY - touchStartY; // Positive for swipe down, negative for swipe up

      // Sensitivity factor for touch, can be adjusted
      const touchSensitivityFactor = currentState.isMobile ? 2.2 : 2.0; // Adjusted factor slightly

      // To make swipe down move forward (increase targetPosition)
      // and swipe up move backward (decrease targetPosition):
      // A positive deltaY (swipe down) should lead to an increase in targetPosition.
      // A negative deltaY (swipe up) should lead to a decrease in targetPosition.
      // The original horizontal swipe was: targetPosition -= deltaX * factor
      // If swipe left (negative deltaX) was forward (increase targetPosition), then -(-ve deltaX) * factor = +ve
      // We want: swipe down (positive deltaY) to be forward (increase targetPosition)
      // So, targetPosition = touchStartTargetPosition + deltaY * factor (if factor handles direction)
      // Or more directly:
      currentState.targetPosition = touchStartTargetPosition - deltaY * touchSensitivityFactor;


      // Old logic (would need sign flip for factor):
      // currentState.targetPosition += deltaY * touchSensitivityFactor; 
      // This would make swipe down (positive deltaY) increase targetPosition (forward) - seems right.
      // Let's test with: targetPosition = original_target_at_touch_start - deltaY * factor.
      // Swipe Down: deltaY is positive. targetPosition decreases. (Moves backward if sensitivity is positive)
      // Swipe Up: deltaY is negative. targetPosition increases. (Moves forward if sensitivity is positive)
      // This is the OPPOSITE of what's requested.

      // Corrected logic:
      // Swipe Down (content moves up, character moves forward/right) -> targetPosition should increase.
      // Swipe Up (content moves down, character moves backward/left) -> targetPosition should decrease.
      // deltaY is positive for swipe DOWN.
      // So, we need to ADD something proportional to deltaY.
      // However, typically dragging content: drag down moves content down.
      // Let's align with typical "drag to scroll" feel for the background:
      // Drag finger DOWN means you want to see content that is "above" -> background moves DOWN (translateX to a smaller value if it's negative)
      // So, if you drag DOWN (deltaY positive), targetPosition (scroll amount) should DECREASE.
      // If you drag UP (deltaY negative), targetPosition (scroll amount) should INCREASE.
      // This means: targetPosition = touchStartTargetPosition - deltaY * factor
      // This will make:
      //   - Swipe Down (positive deltaY) -> targetPosition DECREASES (character moves BACKWARD)
      //   - Swipe Up (negative deltaY) -> targetPosition INCREASES (character moves FORWARD)
      // This is the REVERSE of the user request (swipe down = forward).

      // To meet the request: swipe DOWN = FORWARD (targetPosition INCREASES)
      // deltaY positive for swipe down.
      // currentState.targetPosition = touchStartTargetPosition + deltaY * touchSensitivityFactor;
      // This should work.

      // Let's use the new approach of adjusting based on initial target.
      currentState.targetPosition = touchStartTargetPosition + deltaY * touchSensitivityFactor;


      // Update touchStartY for continuous swiping, but this makes it relative to last point.
      // For dragging, it's often better to calculate delta from the initial touch point.
      // The current `touchStartTargetPosition + deltaY * factor` does this.
      // No need to update touchStartY = touchMoveY here if using absolute delta from start.

      enforceBoundaries();
    }, { passive: false }); // Passive false because we call preventDefault

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
        const animationStartPoint = getWalkerAnimationStartPoint();
        const shouldShowWalker = currentState.position >= animationStartPoint;
        if (shouldShowWalker) elements.walker.style.opacity = '1';
        if (elements.breadHotspotElement && elements.breadHotspotElement.classList.contains('zoomed')) {
          elements.breadHotspotElement.classList.remove('zoomed');
        }
      }
      elements.modalPrev.style.display = panelNumber > 1 ? 'block' : 'none';
      elements.modalNext.style.display = panelNumber < currentState.totalPanels && panelNumber > 0 ? 'block' : 'none';
    }

    elements.modalNext.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      if (currentState.currentPanel < currentState.totalPanels) showPanel(currentState.currentPanel + 1);
    });
    elements.modalPrev.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      if (currentState.currentPanel > 1) showPanel(currentState.currentPanel - 1);
    });
    elements.modalClose.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      showPanel(0);
    });

    requestAnimationFrame(updateWalkAndScroll);
    handleResize(); // Call handleResize once after setup to ensure correct initial layout
  }

  // Start loading progress check if not already finished (e.g., if all images were cached)
  updateLoadingProgress(); 
});