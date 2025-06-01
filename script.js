document.addEventListener('DOMContentLoaded', () => {
    const ANIMATION_END_OFFSET = 0
    const loadingImagesSrc = [
      'assets/loading/loading-0.png',
      'assets/loading/loading-25.png',
      'assets/loading/loading-50.png',
      'assets/loading/loading-75.png',
      'assets/loading/loading-100.png'
    ]
    // Pre-create Image objects for loading screen itself to ensure they are cached/loaded
    loadingImagesSrc.forEach(src => {
      const img = new Image();
      img.src = src;
    });

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

    elements.loadingImage.src = 'assets/loading/loading-0.png'; // Initial loading image

    const backgroundImagesData = [ // Renamed for clarity from backgroundImages to avoid conflict
      {
        src: window.innerWidth <= 768 ? 'backgrounds/page1-mobile.png' : 'backgrounds/page1.png',
        isFirst: true,
        originalWidth: window.innerWidth <= 768 ? 1080 : 1920
      },
      {
        src: 'backgrounds/room-strip.PNG',
        isFirst: false,
        originalWidth: 15001
      }
    ];

    const walkingFrames = Array.from(
      { length: 20 },
      (_, i) => `walking-frames/Layer_${i.toString().padStart(2, '0')}.png`
    );
    const revWalkingFrames = Array.from(
      { length: 20 },
      (_, i) => `rev-walking-frame/fwalkcycle${i.toString().padStart(2, '0')}.png`
    );
    const allWalkerFrames = [...walkingFrames, ...revWalkingFrames];
    const hotspotImageElements = document.querySelectorAll('.hotspot img'); // Get elements

    // Calculate total images accurately
    let totalImagesToLoad = loadingImagesSrc.length; // Start with loading screen images
    totalImagesToLoad += backgroundImagesData.length;
    totalImagesToLoad += allWalkerFrames.length;
    hotspotImageElements.forEach(() => totalImagesToLoad++);


    let loadedImages = 0;

    function updateLoadingScreen() {
      const percentage = totalImagesToLoad > 0 ? (loadedImages / totalImagesToLoad) * 100 : 0;
      let loadingSrc;
      if (percentage < 25) {
        loadingSrc = 'assets/loading/loading-0.png';
      } else if (percentage < 50) {
        loadingSrc = 'assets/loading/loading-25.png';
      } else if (percentage < 75) {
        loadingSrc = 'assets/loading/loading-50.png';
      } else if (percentage < 100) {
        loadingSrc = 'assets/loading/loading-75.png';
      } else {
        loadingSrc = 'assets/loading/loading-100.png';
        // Ensure the 100% image is displayed briefly before fading
        elements.loadingImage.src = loadingSrc;
        setTimeout(() => {
          elements.loadingScreen.style.opacity = '0';
          setTimeout(() => {
            elements.loadingScreen.style.display = 'none';
            document.body.classList.remove('loading');
            initializeSystem();
          }, 500); // CSS transition time
        }, 200); // Brief pause on 100%
        return; // Exit early to prevent multiple calls to initializeSystem
      }
      elements.loadingImage.src = loadingSrc;
    }
    
    function imageLoadedOrError() {
        loadedImages++;
        updateLoadingScreen();
    }

    // Load loading screen images first and count them
    loadingImagesSrc.forEach(src => {
        const img = new Image();
        img.onload = imageLoadedOrError;
        img.onerror = imageLoadedOrError; // Count errors too
        img.src = src;
        if (img.complete) img.onload(); // Trigger if cached
    });
    
    hotspotImageElements.forEach(imgElement => {
        const img = new Image();
        img.onload = imageLoadedOrError;
        img.onerror = imageLoadedOrError;
        img.src = imgElement.src;
        if (img.complete) img.onload();
    });

    allWalkerFrames.forEach(src => {
        const img = new Image();
        img.onload = imageLoadedOrError;
        img.onerror = imageLoadedOrError;
        img.src = src;
        if (img.complete) img.onload();
    });

    backgroundImagesData.forEach((imgData) => {
        const img = new Image();
        img.onload = () => {
            if (imgData.isFirst) {
              img.classList.add('first-background');
            }
            elements.background.appendChild(img);
            imageLoadedOrError(); // Call after appending if needed, or before
        };
        img.onerror = imageLoadedOrError;
        img.src = imgData.src;
        if (img.complete) img.onload();
    });


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
        isMobile: window.innerWidth <= 768,
        firstImageWidth: 0,
        roomStripWidth: 0,
        backgroundTotalWidth: 0,
        currentAnimationSpeed: 0, // Added for smooth animation speed changes
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

      // Constants for controlling walking animation speed
      const MAX_ANIMATION_INCREMENT = 0.45;   // Max frames to advance per update (fastest walk) - slightly reduced for smoother feel
      const MIN_ANIMATION_INCREMENT = 0.03;   // Min frames to advance if still "moving" (slowest perceptible walk) - slightly reduced
      const MIN_POS_DELTA_FOR_ANIMATION = 0.2; // Min absolute positionDelta to consider for animation speed calc (finer control)
      const POS_DELTA_THRESHOLD_FOR_MAX_SPEED = 40; // Absolute positionDelta above which animation aims for MAX_ANIMATION_INCREMENT - slightly reduced
      const ANIMATION_SPEED_DAMPING_FACTOR = 0.15; // How smoothly animation speed changes (0.1 to 0.2 is usually good)

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
        const firstBackgroundImg = elements.background.querySelector('.first-background');
        if (firstBackgroundImg && firstBackgroundImg.offsetWidth > 0) {
          currentState.firstImageWidth = firstBackgroundImg.offsetWidth;
        } else {
          const firstBgData = backgroundImagesData.find(bg => bg.isFirst);
          currentState.firstImageWidth = (elements.background.offsetHeight / 1080) * (firstBgData ? firstBgData.originalWidth : (currentState.isMobile ? 1080 : 1920));
        }

        const roomStripImg = elements.background.querySelector('img:not(.first-background)');
        if (roomStripImg && roomStripImg.offsetHeight > 0) { // Ensure offsetHeight is also valid
          const roomStripOriginalWidth = backgroundImagesData[1].originalWidth;
          const roomStripOriginalHeight = 1080;
          currentState.roomStripWidth = (elements.background.offsetHeight / roomStripOriginalHeight) * roomStripOriginalWidth;
          roomStripImg.style.width = `${currentState.roomStripWidth}px`;
        } else if (backgroundImagesData.length > 1) { // Fallback if image not fully ready but data exists
           const roomStripOriginalWidth = backgroundImagesData[1].originalWidth;
           const roomStripOriginalHeight = 1080;
           currentState.roomStripWidth = (elements.background.offsetHeight / roomStripOriginalHeight) * roomStripOriginalWidth;
        }


        currentState.backgroundTotalWidth = currentState.firstImageWidth + currentState.roomStripWidth;
        elements.background.style.width = `${currentState.backgroundTotalWidth}px`;
        elements.calloutsContainer.style.width = `${currentState.backgroundTotalWidth}px`;
        
        const walkerWidth = elements.walker.offsetWidth;
        elements.walker.style.left = `${(window.innerWidth - walkerWidth) / 2}px`;

        // Walker 'bottom' is primarily controlled by CSS media queries now.
        // These JS overrides might conflict or be redundant.
        // As requested, these lines are now commented out:
        // if (currentState.isMobile) {
        //   elements.walker.style.bottom = '-3vh';
        // } else {
        //   elements.walker.style.bottom = '-20px';
        // }

        enforceBoundaries();
      }

      const positionCalloutsDynamically = () => {
        elements.hotspots.forEach(hotspot => {
          const hotspotClass = Array.from(hotspot.classList).find(cls => cls.startsWith('hotspot-'))
          if (!hotspotClass) return; 
          const hotspotName = hotspotClass.replace('hotspot-', '')
          const data = currentState.hotspotData[hotspotName]

          if (data) {
            const hotspotLeft = currentState.firstImageWidth + (data.x * currentState.roomStripWidth);
            hotspot.style.left = `${hotspotLeft}px`;
            hotspot.style.top = `${data.y * 100}%`;
          }
          hotspot.classList.add('active')
        })
      }

      currentState.isMobile = window.innerWidth <= 768;
      updateLayoutDimensions();
      positionCalloutsDynamically();
      setupBackgroundLink();

      document.addEventListener('click', function(e) {
        const backgroundLink = document.getElementById('background-link')
        if (backgroundLink && (e.target === backgroundLink || backgroundLink.contains(e.target))) {
          return true;
        }
      });

      function enforceBoundaries() {
        const actualMaxScroll = elements.background.scrollWidth > 0 ? elements.background.scrollWidth - window.innerWidth : 0;
        const adjustedMax = actualMaxScroll - currentState.animationEndOffset;
        currentState.maxPosition = Math.max(0, adjustedMax);

        currentState.position = Math.max(0, Math.min(currentState.position, currentState.maxPosition));
        currentState.targetPosition = Math.max(0, Math.min(currentState.targetPosition, currentState.maxPosition));
      }

      function updateWalk() {
        enforceBoundaries(); 

        const positionDelta = currentState.targetPosition - currentState.position;
        currentState.position += positionDelta * 0.1; 

        const animationStartPoint = currentState.isMobile
          ? currentState.firstImageWidth - window.innerWidth * 0.1
          : currentState.firstImageWidth - window.innerWidth * 0.4;
        const shouldShowWalker = currentState.position >= animationStartPoint && !currentState.modalOpen;
        elements.walker.style.opacity = shouldShowWalker ? '1' : '0';

        if (shouldShowWalker) {
          const intendedDirection = positionDelta; 
          const frameSet = intendedDirection >= 0 ? walkingFrames : revWalkingFrames;
          
          if (frameSet.length > 0) {
            let frameIndex = Math.floor(currentState.frame) % frameSet.length;
            elements.walker.src = frameSet[frameIndex];

            const absPositionDelta = Math.abs(positionDelta);
            let targetAnimationSpeed;

            if (absPositionDelta > MIN_POS_DELTA_FOR_ANIMATION) {
              if (absPositionDelta >= POS_DELTA_THRESHOLD_FOR_MAX_SPEED) {
                targetAnimationSpeed = MAX_ANIMATION_INCREMENT;
              } else {
                const speedRatio = (absPositionDelta - MIN_POS_DELTA_FOR_ANIMATION) / 
                                   (POS_DELTA_THRESHOLD_FOR_MAX_SPEED - MIN_POS_DELTA_FOR_ANIMATION);
                targetAnimationSpeed = MIN_ANIMATION_INCREMENT + 
                                       (MAX_ANIMATION_INCREMENT - MIN_ANIMATION_INCREMENT) * Math.max(0, Math.min(1, speedRatio)); // Clamp ratio
              }
            } else {
              targetAnimationSpeed = 0; // Target is to stop animation
            }

            currentState.currentAnimationSpeed += 
                (targetAnimationSpeed - currentState.currentAnimationSpeed) * ANIMATION_SPEED_DAMPING_FACTOR;

            // If the speed is extremely low (close to zero), snap it to zero.
            if (Math.abs(currentState.currentAnimationSpeed) < 0.05) { // Slightly higher threshold for practical stop
                 currentState.currentAnimationSpeed = 0;
            }

            if (currentState.currentAnimationSpeed > 0) { 
                currentState.frame = (currentState.frame + currentState.currentAnimationSpeed) % frameSet.length;
            }
          }
        } else {
            // If walker is not shown, reset animation speed to ensure it starts fresh when shown again
            currentState.currentAnimationSpeed = 0;
            // Optionally reset frame too, though it might jump if walker reappears mid-step
            // currentState.frame = 0; 
        }


        const translateXValue = -currentState.position;
        const translateX = `translateX(${translateXValue}px)`;
        elements.background.style.transform = translateX;
        elements.calloutsContainer.style.transform = translateX;
        if (elements.backgroundLink) {
          elements.backgroundLink.style.transform = `translateX(${translateXValue}px)`;
        }

        currentState.previousPosition = currentState.position;
        requestAnimationFrame(updateWalk);
      }

      window.addEventListener('resize', () => {
        currentState.isMobile = window.innerWidth <= 768;
        updateLayoutDimensions();
        positionCalloutsDynamically();
        enforceBoundaries();

        const translateX = `translateX(-${currentState.position}px)`;
        elements.background.style.transform = translateX;
        elements.calloutsContainer.style.transform = translateX;
        if (elements.backgroundLink) {
          elements.backgroundLink.style.transform = translateX;
        }
      });

      elements.hotspots.forEach(hotspot => {
        hotspot.addEventListener('click', function(e) {
          e.stopPropagation(); // Important for nested logic
          const wasZoomed = this.classList.contains('zoomed');

          // De-zoom others only if we are not clicking an already zoomed one to de-zoom it
          if (!wasZoomed) {
            elements.hotspots.forEach(hs => {
              if (hs !== this) {
                hs.classList.remove('zoomed');
              }
            });
          }
          
          this.classList.toggle('zoomed');
          currentState.isZoomed = this.classList.contains('zoomed');

          if (currentState.isZoomed) {
            const hotspotClass = Array.from(this.classList).find(cls => cls.startsWith('hotspot-'));
            if (hotspotClass) {
                currentState.currentHotspot = hotspotClass.replace('hotspot-', '');
                showPanel(1);
            }
          } else { // If it was de-zoomed or no hotspot is zoomed
            currentState.currentHotspot = null;
            showPanel(0); // Hide modal
          }
        }, { capture: true }); // capture: true can be tricky, ensure it's needed.
      });

      const scrollSensitivity = currentState.isMobile ? 1.8 : 1.0; // Slightly adjusted sensitivity

      window.addEventListener('wheel', e => {
        if (!currentState.modalOpen && !e.target.closest('.hotspot.zoomed') && !e.target.closest('#modal-content')) {
          e.preventDefault();
          currentState.targetPosition += e.deltaY * scrollSensitivity;
          enforceBoundaries();
        }
      }, { passive: false });

      let touchStartX = 0;
      let touchStartY = 0; 

      window.addEventListener('touchstart', e => {
        if (!currentState.modalOpen && !e.target.closest('.hotspot.zoomed') && !e.target.closest('#modal-content')) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          // No preventDefault needed here generally for touchstart if just recording points
        }
      }, { passive: true }); 

      window.addEventListener('touchmove', e => {
        if (!currentState.modalOpen && !e.target.closest('.hotspot.zoomed') && !e.target.closest('#modal-content')) {
          if (e.cancelable) e.preventDefault(); 

          const deltaX = e.touches[0].clientX - touchStartX;
          currentState.targetPosition -= deltaX * 1.8; // Adjusted sensitivity for touch

          enforceBoundaries();
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
        }
      }, { passive: false });

      function showPanel(panelNumber) {
        currentState.currentPanel = panelNumber;
        const folder = currentState.isMobile ? 'mobile' : 'desktop';
        if (panelNumber > 0 && currentState.currentHotspot) {
          elements.modalImage.src = `assets/texts/${folder}/${currentState.currentHotspot}/${panelNumber}.png`;
          elements.modal.classList.add('visible');
          currentState.modalOpen = true;
        } else {
          elements.modal.classList.remove('visible');
          currentState.modalOpen = false;
          // De-zoom hotspots only if modal is closed by "showPanel(0)" not by clicking hotspot again
          if (panelNumber === 0 && currentState.currentHotspot === null) { // Check if currentHotspot was also cleared
             elements.hotspots.forEach(hs => hs.classList.remove('zoomed'));
             currentState.isZoomed = false; // Reflect this state change
          }
        }
        elements.modalPrev.style.display = panelNumber > 1 ? 'block' : 'none';
        elements.modalNext.style.display = panelNumber < currentState.totalPanels ? 'block' : 'none';
      }

      elements.modalNext.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (currentState.currentPanel < currentState.totalPanels) {
          showPanel(currentState.currentPanel + 1);
        }
      });

      elements.modalPrev.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (currentState.currentPanel > 1) {
          showPanel(currentState.currentPanel - 1);
        }
      });

      elements.modalClose.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        elements.hotspots.forEach(hs => hs.classList.remove('zoomed')); 
        currentState.isZoomed = false;
        currentState.currentHotspot = null; // Clear current hotspot
        showPanel(0); 
      });

      requestAnimationFrame(updateWalk);
    }
    // Initial call to start loading process after DOM is ready
    // updateLoadingScreen(); // This will be called by the image loaders themselves
  });