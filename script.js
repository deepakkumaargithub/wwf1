document.addEventListener('DOMContentLoaded', () => {

  const ANIMATION_END_OFFSET_DESKTOP = 300;
  const ANIMATION_END_OFFSET_MOBILE = 100;


  const loadingSpinnerFrames = [
      'assets/loading/loading-0.png', 'assets/loading/loading-25.png',
      'assets/loading/loading-50.png', 'assets/loading/loading-75.png',
      'assets/loading/loading-100.png'
  ];
  loadingSpinnerFrames.forEach(src => {
      (new Image()).src = src; // Preload loading images
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


  elements.loadingImageElement.src = loadingSpinnerFrames[0]; // Set initial loading image


  const sceneData = [{
          id: 'page1',
          srcDesktop: 'backgrounds/page1.png',
          srcMobile: 'backgrounds/page1-mobile.png',
          isViewportCover: true, // This page should cover the viewport
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

  // Count background images
  totalImagesToLoad += sceneData.length;

  // Count walker frames
  totalImagesToLoad += allWalkerFrames.length;

  // Count hotspot images
  sceneData.forEach(scene => {
      if (scene.hotspots) {
          totalImagesToLoad += scene.hotspots.length;
      }
  });

  let loadedImages = 0;
  const backgroundSegmentElements = []; // Stores references to segment elements and their data


  function updateLoadingProgress() {
      if (totalImagesToLoad === 0) { // Handle case where there are no images to load
          finishLoading();
          return;
      }
      const percentage = Math.min(100, (loadedImages / totalImagesToLoad) * 100);
      let frameIndex = Math.floor(percentage / 25); // 0, 1, 2, 3, 4
      if (percentage >= 99) frameIndex = loadingSpinnerFrames.length - 1; // Ensure 100% shows last frame
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
              initializeSystem(); // Initialize the main system after loading screen fades
          }, 500); // Wait for fade-out to complete
      }, 200); // Small delay to ensure last frame is seen
  }

  function imageLoaded() {
      loadedImages++;
      updateLoadingProgress();
  }

  function imageError(src) {
      console.error(`Failed to load image: ${src}`);
      // Still count as loaded to prevent stuck loading screen
      loadedImages++;
      updateLoadingProgress();
  }


  // Preload walker frames
  allWalkerFrames.forEach(src => {
      const img = new Image();
      img.onload = imageLoaded;
      img.onerror = () => imageError(src);
      img.src = src;
  });


  // Create background segments and load images
  sceneData.forEach((sceneItem) => {
      const segmentDiv = document.createElement('div');
      segmentDiv.classList.add('background-segment');
      segmentDiv.id = `segment-${sceneItem.id}`;

      const bgImg = new Image();
      bgImg.classList.add('bg-image');

      const isMobile = window.innerWidth <= 768;
      if (sceneItem.isViewportCover) {
          // Use specific mobile/desktop source for viewport cover images
          bgImg.src = isMobile && sceneItem.srcMobile ? sceneItem.srcMobile : sceneItem.srcDesktop;
          segmentDiv.classList.add('viewport-cover'); // Add class for specific CSS styling
      } else {
          bgImg.src = sceneItem.src;
      }

      const segmentData = {
          id: sceneItem.id,
          element: segmentDiv,
          imageElement: bgImg,
          naturalWidth: 0,
          naturalHeight: 0,
          currentWidth: 0, // This will be calculated later
          sceneDefinition: sceneItem,
          isViewportCover: !!sceneItem.isViewportCover // Convert to boolean
      };
      backgroundSegmentElements.push(segmentData);

      bgImg.onload = () => {
          segmentData.naturalWidth = bgImg.naturalWidth;
          segmentData.naturalHeight = bgImg.naturalHeight;
          imageLoaded();

          // Append hotspots after image is loaded and dimensions are available
          if (sceneItem.hotspots) {
              sceneItem.hotspots.forEach(hotspotDef => {
                  // Find the hotspot template
                  const hotspotTemplate = elements.hotspotTemplatesContainer.querySelector(`.hotspot[data-hotspot-id="${hotspotDef.id}"]`);
                  if (hotspotTemplate) {
                      const hotspotInstance = hotspotTemplate.cloneNode(true); // Deep clone

                      // Apply positioning based on hotspot definition
                      if (hotspotDef.leftDynamic) {
                          hotspotInstance.style.left = `calc(${hotspotDef.leftDynamic.basePercent}% + ${hotspotDef.leftDynamic.fixedOffsetPx}px)`;
                      } else {
                          hotspotInstance.style.left = `${hotspotDef.left}%`;
                      }
                      hotspotInstance.style.top = `${hotspotDef.top}%`;
                      segmentDiv.appendChild(hotspotInstance);

                      // Special handling for the interactive bread hotspot
                      if (hotspotDef.id === 'bread') {
                          elements.breadHotspotElement = hotspotInstance;
                      }

                      // Preload hotspot images
                      const hotspotImg = hotspotInstance.querySelector('img');
                      if (hotspotImg && hotspotImg.complete && hotspotImg.naturalWidth !== 0) {
                          // If image is already complete (cached), count it
                          imageLoaded();
                      } else if (hotspotImg) {
                          // Otherwise, wait for it to load
                          hotspotImg.onload = imageLoaded;
                          hotspotImg.onerror = () => imageError(hotspotImg.src);
                      } else {
                          // If no img tag in hotspot, still count as loaded for progress
                          imageLoaded();
                      }
                  } else {
                      console.warn(`Hotspot template for ${hotspotDef.id} not found. Skipping.`);
                      // Decrement totalImagesToLoad for this hotspot since it won't load
                      totalImagesToLoad = Math.max(0, totalImagesToLoad - 1);
                      updateLoadingProgress();
                  }
              });
          }

          segmentDiv.appendChild(bgImg);
          elements.backgroundContainer.appendChild(segmentDiv);

          // After all background images have attempted to load, recalculate sizes
          const allBgImagesLoaded = backgroundSegmentElements.every(s => s.imageElement.complete);
          if (allBgImagesLoaded && loadedImages >= totalImagesToLoad) {
              // Ensure handleResize is called only after loading is complete and if not already initialized
              if (!document.body.classList.contains('loading')) {
                  handleResize();
              }
          }
      };
      bgImg.onerror = () => {
          imageError(bgImg.src);
          // Set dummy dimensions to prevent division by zero in calculations if image fails
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
      frame: 0, // Current walker animation frame
      position: 0, // Current background scroll position
      targetPosition: 0, // Target scroll position for smooth animation
      previousPosition: 0, // Used to determine walker direction
      currentPanel: 0, // For modal navigation
      totalPanels: 3, // Total number of modal panels
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      maxPosition: 0, // Maximum scrollable distance
      modalOpen: false,
      isMobile: window.innerWidth <= 768,
      animationEndOffset: (window.innerWidth <= 768) ? ANIMATION_END_OFFSET_MOBILE : ANIMATION_END_OFFSET_DESKTOP,
      walkerVisible: false, // Flag to track walker visibility
      totalScrollWidth: 0, // Total width of all background segments combined
      isMoving: false, // Indicates if walker is actively moving
      touchStartY: 0 // For vertical touch scrolling
  };


  function calculateSegmentWidthsAndTotal() {
      currentState.totalScrollWidth = 0;
      currentState.viewportWidth = window.innerWidth;
      currentState.viewportHeight = window.innerHeight;

      backgroundSegmentElements.forEach(segment => {
          if (segment.isViewportCover) {
              // For 'viewport-cover' segments (like page1), their width should always be the viewport width
              segment.currentWidth = currentState.viewportWidth;
          } else if (segment.naturalHeight > 0 && segment.naturalWidth > 0) {
              // For 'contain' segments, calculate width based on viewport height to maintain aspect ratio
              // This will lead to horizontal overflow if the image is wider than viewport aspect ratio
              segment.currentWidth = (segment.naturalWidth / segment.naturalHeight) * currentState.viewportHeight;
          } else {
              // Fallback if natural dimensions are not available (e.g., image failed to load)
              segment.currentWidth = currentState.viewportWidth; // Default to viewport width
              console.warn(`Segment ${segment.id} natural dimensions not available or zero, defaulting width to viewport width.`);
          }
          segment.element.style.width = `${segment.currentWidth}px`;
          // Ensure segment always takes full viewport height for consistent layout
          segment.element.style.height = `${currentState.viewportHeight}px`;

          currentState.totalScrollWidth += segment.currentWidth;
      });
      // Set the total width of the background container
      elements.backgroundContainer.style.width = `${currentState.totalScrollWidth}px`;
  }


  function calculateMaxPosition() {
      // The maximum scrollable distance for the background
      const actualMaxScroll = currentState.totalScrollWidth - currentState.viewportWidth;

      // Ensure maxPosition is not negative and accounts for the animation end offset
      currentState.maxPosition = Math.max(0, actualMaxScroll - currentState.animationEndOffset);
  }


  function applyWalkerStyles() {
      currentState.isMobile = window.innerWidth <= 768;
      currentState.animationEndOffset = currentState.isMobile ? ANIMATION_END_OFFSET_MOBILE : ANIMATION_END_OFFSET_DESKTOP;

      // Set the bottom property based on device type
      elements.walker.style.bottom = currentState.isMobile ? '0%' : '-5%';
      // Ensure no initial vertical transform from previous states
      elements.walker.style.transform = 'translateY(0%)';
  }


  function getWalkerAnimationStartPoint() {
      // The walker should start appearing *after* the initial 'page1' segment,
      // and a small distance into the second segment (room1).
      if (backgroundSegmentElements.length < 2) {
          // Fallback if there's only one segment or none
          return currentState.viewportWidth * 0.85;
      }

      const firstSegment = backgroundSegmentElements[0];
      const secondSegment = backgroundSegmentElements[1]; // Assuming room1 is the second segment

      let startPoint = 0;
      if (firstSegment.isViewportCover) {
          // If the first segment is a viewport cover, the walker appears as soon as it's scrolled past.
          // We add a small buffer into the second segment to make it smooth.
          startPoint = firstSegment.currentWidth + (secondSegment.currentWidth * 0.15); // 15% into room1
      } else {
          // If the first segment is not a viewport cover, assume standard start point (e.g., 85% into first segment)
          startPoint = firstSegment.currentWidth * 0.85;
      }

      return startPoint;
  }


  function enforceBoundaries() {
      // Prevent scrolling beyond the start (0) or end (maxPosition) of the content
      currentState.targetPosition = Math.max(0, Math.min(currentState.targetPosition, currentState.maxPosition));
      currentState.position = Math.max(0, Math.min(currentState.position, currentState.maxPosition));
  }


  function updateWalkAndScroll() {

      const prevPositionBeforeUpdate = currentState.position;


      // Smoothly interpolate the current position towards the target position
      if (Math.abs(currentState.targetPosition - currentState.position) > 0.05) { // Check for significant difference
          currentState.position += (currentState.targetPosition - currentState.position) * 0.12; // Easing effect
          enforceBoundaries(); // Re-enforce boundaries after interpolation
          currentState.isMoving = true;
      } else {
          currentState.position = currentState.targetPosition; // Snap to target if very close
          currentState.isMoving = false;
      }


      // Determine if the walker should be visible based on current scroll position
      const animationStartPoint = getWalkerAnimationStartPoint();
      const shouldShowWalker = currentState.position >= animationStartPoint && !currentState.modalOpen;

      if (shouldShowWalker !== currentState.walkerVisible) {
          elements.walker.style.opacity = shouldShowWalker ? '1' : '0';
          currentState.walkerVisible = shouldShowWalker;
      }


      if (shouldShowWalker) {
          // Calculate actual movement since last frame to determine walking direction
          const actualMovementDelta = currentState.position - prevPositionBeforeUpdate;

          if (currentState.isMoving && Math.abs(actualMovementDelta) > 2) { // Only animate if significant movement
              const frameSet = actualMovementDelta >= 0 ? walkingFrames : revWalkingFrames; // Forward or backward frames
              currentState.frame = (currentState.frame + 1) % frameSet.length; // Cycle through frames
              elements.walker.src = frameSet[currentState.frame];
              currentState.previousPosition = currentState.position; // Update previous position
          }
      }


      // Apply the background scroll transformation
      elements.backgroundContainer.style.transform = `translateX(-${currentState.position}px)`;


      // Request the next animation frame for smooth updates
      requestAnimationFrame(updateWalkAndScroll);
  }



  function handleResize() {

      const oldTotalScrollWidth = currentState.totalScrollWidth;
      const oldPosition = currentState.position;
      let scrollProgress = 0;

      // Calculate current scroll progress as a percentage relative to the scrollable area
      if (oldTotalScrollWidth > currentState.viewportWidth) {
          scrollProgress = oldPosition / (oldTotalScrollWidth - currentState.viewportWidth);
      }

      applyWalkerStyles(); // Re-apply walker styles based on new viewport
      calculateSegmentWidthsAndTotal(); // Re-calculate all segment widths and total scroll width
      calculateMaxPosition(); // Re-calculate maximum scroll position

      let newTargetPosition = 0;
      if (currentState.totalScrollWidth > currentState.viewportWidth) {
          // Set new target position proportionally to the old scroll progress
          newTargetPosition = scrollProgress * (currentState.totalScrollWidth - currentState.viewportWidth);
      }

      currentState.targetPosition = newTargetPosition;
      currentState.position = newTargetPosition;
      enforceBoundaries(); // Ensure new position is within boundaries

      // Immediately update walker visibility based on the new position after resize
      const animationStartPoint = getWalkerAnimationStartPoint();
      const shouldShowWalker = currentState.position >= animationStartPoint && !currentState.modalOpen;
      elements.walker.style.opacity = shouldShowWalker ? '1' : '0';
      currentState.walkerVisible = shouldShowWalker;


      // Apply the updated background transformation immediately
      elements.backgroundContainer.style.transform = `translateX(-${currentState.position}px)`;
  }


  function initializeSystem() {
      applyWalkerStyles();
      calculateSegmentWidthsAndTotal();
      calculateMaxPosition();

      // Initialize positions to 0 on load
      currentState.position = 0;
      currentState.targetPosition = 0;
      currentState.previousPosition = 0;
      enforceBoundaries(); // Ensure initial position is valid

      window.addEventListener('resize', handleResize);


      // Add event listener for the bread hotspot
      if (elements.breadHotspotElement) {
          elements.breadHotspotElement.addEventListener('click', function(e) {
              e.stopPropagation(); // Prevent scroll events from bubbling
              this.classList.toggle('zoomed'); // Toggle zoomed class on hotspot
              showPanel(this.classList.contains('zoomed') ? 1 : 0); // Show panel 1 if zoomed, else close modal
          });
      } else {
          console.warn("Bread hotspot element was not found during initialization. Interactive modal will not work.");
      }


      const scrollSensitivity = 1.5; // Adjust this value to make scrolling faster or slower
      window.addEventListener('wheel', e => {
          // Only respond to wheel events if modal is not open or if the event is not within the modal
          if (currentState.modalOpen && elements.modal.contains(e.target)) return;
          if (currentState.modalOpen) {
              e.preventDefault(); // Prevent page scroll if modal is open
              return;
          }
          e.preventDefault(); // Prevent default vertical scrolling of the page

          // Use e.deltaY for horizontal movement
          // Scrolling down (positive deltaY) moves background left (walker forward)
          // Scrolling up (negative deltaY) moves background right (walker backward)
          currentState.targetPosition += e.deltaY * scrollSensitivity;
          enforceBoundaries();
      }, {
          passive: false
      }); // Use passive: false to allow preventDefault


      let touchStartY = 0; // For vertical swipe
      // let touchStartX = 0; // For horizontal swipe if needed, though not for walker here

      window.addEventListener('touchstart', e => {
          if (currentState.modalOpen) return;
          // Capture Y-coordinate for vertical swipe
          touchStartY = e.touches[0].clientY;
          // Capture X-coordinate (can be used for modal interactions if needed)
          // touchStartX = e.touches[0].clientX;
      }, {
          passive: true
      }); // Use passive: true for better scroll performance initially

      window.addEventListener('touchmove', e => {
          // Only respond to touchmove if modal is not open or if the event is not within the modal
          if (currentState.modalOpen && elements.modal.contains(e.target)) return;
          if (currentState.modalOpen) {
              e.preventDefault(); // Prevent page scroll if modal is open
              return;
          }
          e.preventDefault(); // Prevent default vertical scrolling of the page

          const touchMoveY = e.touches[0].clientY; // Get current Y-coordinate
          const deltaY = touchMoveY - touchStartY; // Calculate vertical delta

          // Adjust targetPosition based on vertical swipe
          // Positive deltaY (swipe down) means scrolling "down" the page, which should move walker forward
          // So we subtract deltaY to increase targetPosition (move background left)
          // Negative deltaY (swipe up) means scrolling "up" the page, which should move walker backward
          // So we add deltaY to decrease targetPosition (move background right)
          // The sensitivity can be adjusted.
          currentState.targetPosition -= deltaY * (currentState.isMobile ? 2.0 : 1.8); // Adjust multiplier for sensitivity
          touchStartY = touchMoveY; // Update touchStartY for the next movement
          enforceBoundaries();
      }, {
          passive: false
      }); // Use passive: false to allow preventDefault


      function showPanel(panelNumber) {
          currentState.currentPanel = panelNumber;
          const folder = currentState.isMobile ? 'mobile' : 'desktop';
          if (panelNumber > 0 && panelNumber <= currentState.totalPanels) {
              elements.modalImage.src = `assets/texts/${folder}/${panelNumber}.png`;
              elements.modal.classList.add('visible');
              currentState.modalOpen = true;

              // Hide walker when modal is open
              if (currentState.walkerVisible) elements.walker.style.opacity = '0';
          } else {
              elements.modal.classList.remove('visible');
              currentState.modalOpen = false;

              // Restore walker visibility if it should be visible based on position
              const animationStartPoint = getWalkerAnimationStartPoint();
              const shouldShowWalker = currentState.position >= animationStartPoint;
              if (shouldShowWalker) elements.walker.style.opacity = '1';

              // Ensure bread hotspot is unzoomed if modal is closed
              if (elements.breadHotspotElement && elements.breadHotspotElement.classList.contains('zoomed')) {
                  elements.breadHotspotElement.classList.remove('zoomed');
              }
          }

          // Control visibility of navigation buttons
          elements.modalPrev.style.display = panelNumber > 1 ? 'block' : 'none';
          elements.modalNext.style.display = panelNumber < currentState.totalPanels && panelNumber > 0 ? 'block' : 'none';
      }


      // Modal navigation event listeners
      elements.modalNext.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation(); // Stop propagation to prevent body scroll
          if (currentState.currentPanel < currentState.totalPanels) showPanel(currentState.currentPanel + 1);
      });
      elements.modalPrev.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation(); // Stop propagation to prevent body scroll
          if (currentState.currentPanel > 1) showPanel(currentState.currentPanel - 1);
      });
      elements.modalClose.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation(); // Stop propagation to prevent body scroll
          showPanel(0); // Close modal by setting panelNumber to 0
      });


      // Start the animation loop
      requestAnimationFrame(updateWalkAndScroll);
  }

  // Initial call to start loading process
  updateLoadingProgress();
});