/**
 * Viral Yadav Portfolio — Interactive Canvas & 3D Depth Engine
 */

(function () {
  'use strict';

  const TOTAL_FRAMES = 145;
  const FRAME_DIR = 'frames_compressed_high_quality';
  const LERP_FACTOR = 0.085; // Butter-smooth cinematic interpolation
  const CIRCLE_CIRCUMFERENCE = 283; // 2 * Math.PI * 45

  // DOM Elements
  const canvas = document.getElementById('frame-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const loader = document.getElementById('loader');
  const loaderPercent = document.getElementById('loader-percent');
  const progressCircle = document.getElementById('progress-circle');
  const scrollHint = document.getElementById('scroll-hint');
  const toolsScatterLayer = document.querySelector('.hero-tools-scatter-layer');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id], footer[id]');

  // Animation State
  const images = [];
  let loadedCount = 0;
  let currentFrame = 0;
  let targetFrame = 0;
  let renderedFrameIndex = -1;
  let isLoaded = false;
  let rafId = null;

  // Frame file path generator
  function getFramePath(index) {
    const paddedIndex = String(index).padStart(6, '0');
    return `${FRAME_DIR}/frame_${paddedIndex}.jpg`;
  }

  // Set Canvas Resolution with High-DPI Support
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    
    // Re-draw current frame
    renderedFrameIndex = -1;
    drawFrame(Math.round(currentFrame));
  }

  // Draw image with typography cleanly positioned with zero hair/ear overlap
  function drawFrame(frameIndex) {
    const clampedIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, frameIndex));
    const img = images[clampedIndex];

    if (!img || !img.complete || img.naturalWidth === 0) {
      return;
    }

    const cWidth = canvas.width;
    const cHeight = canvas.height;
    const iWidth = img.naturalWidth;
    const iHeight = img.naturalHeight;

    // Calculate aspect ratio covering
    const scale = Math.max(cWidth / iWidth, cHeight / iHeight);
    const drawWidth = iWidth * scale;
    const drawHeight = iHeight * scale;
    const drawX = (cWidth - drawWidth) / 2;
    const drawY = (cHeight - drawHeight) / 2;

    // Step 1: Draw base video frame
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    // Step 2: Render typography in hero section
    const scrollY = window.scrollY || window.pageYOffset;
    const heroHeight = window.innerHeight;
    const heroOpacity = Math.max(0, Math.min(1, 1 - (scrollY / (heroHeight * 0.75))));

    if (toolsScatterLayer) {
      toolsScatterLayer.style.opacity = heroOpacity;
      toolsScatterLayer.style.pointerEvents = heroOpacity > 0.05 ? 'auto' : 'none';
    }

    if (heroOpacity > 0.01) {
      // Subject face anchor in original 1920x1080 frame
      const faceCenterX = drawX + drawWidth * 0.535;
      const faceCenterY = drawY + drawHeight * 0.36;

      // Font size proportionally scaled to video height for crisp framing
      const fontSize = Math.max(drawHeight * 0.205, cWidth * 0.105);
      const smallFontSize = fontSize * 0.24;

      ctx.save();
      ctx.globalAlpha = heroOpacity;
      ctx.fillStyle = '#FFFFFF';
      ctx.textBaseline = 'top';

      // Measure text widths
      ctx.font = `${fontSize}px 'Bebas Neue', 'Anton', sans-serif`;
      const viralWidth = ctx.measureText('VIRAL').width;

      // "VIRAL" right edge sits beside the left cheek/jaw
      const gapLeft = drawWidth * 0.088;
      const viralX = faceCenterX - gapLeft - viralWidth;
      const viralY = faceCenterY - fontSize * 0.32;

      // "I AM" sits directly above the "V" in "VIRAL"
      const iamX = viralX + 2;
      const iamY = viralY - smallFontSize * 1.05;

      // "YADAV" shifted clearly past the hair and right ear with comfortable margin
      const gapRight = drawWidth * 0.112;
      const yadavX = faceCenterX + gapRight;
      const yadavY = viralY;

      // Draw "I AM"
      ctx.font = `${smallFontSize}px 'Bebas Neue', 'Anton', sans-serif`;
      ctx.fillText('I AM', iamX, iamY);

      // Draw "VIRAL"
      ctx.font = `${fontSize}px 'Bebas Neue', 'Anton', sans-serif`;
      ctx.fillText('VIRAL', viralX, viralY);

      // Draw "YADAV" (cleanly positioned past ear and hair)
      ctx.fillText('YADAV', yadavX, yadavY);
      ctx.restore();
    }

    renderedFrameIndex = clampedIndex;
  }

  // Update target frame from window scroll position
  function updateScrollState() {
    const scrollY = window.scrollY || window.pageYOffset;
    
    // Map animation smoothly across full page scroll
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll > 0) {
      const scrollFraction = Math.max(0, Math.min(1, scrollY / maxScroll));
      targetFrame = scrollFraction * (TOTAL_FRAMES - 1);
    }

    // Scroll Hint visibility
    if (scrollHint) {
      if (scrollY > 50) {
        scrollHint.classList.add('hidden');
      } else {
        scrollHint.classList.remove('hidden');
      }
    }

    // Active Navigation Link Highlighting
    let currentSection = '';
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 200;
      const sectionHeight = section.offsetHeight;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  }

  // Main Render Loop (Butter-smooth Lerp)
  function renderLoop() {
    currentFrame += (targetFrame - currentFrame) * LERP_FACTOR;

    const targetFrameInt = Math.round(currentFrame);
    if (targetFrameInt !== renderedFrameIndex || window.scrollY < window.innerHeight) {
      drawFrame(targetFrameInt);
    }

    rafId = requestAnimationFrame(renderLoop);
  }

  // Preload all 145 frames
  function preloadImages() {
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFramePath(i);

      const onAssetLoaded = () => {
        loadedCount++;
        const percent = Math.min(100, Math.floor((loadedCount / TOTAL_FRAMES) * 100));

        // Update progress UI
        if (loaderPercent) {
          loaderPercent.textContent = `${percent}%`;
        }
        if (progressCircle) {
          const offset = CIRCLE_CIRCUMFERENCE - (percent / 100) * CIRCLE_CIRCUMFERENCE;
          progressCircle.style.strokeDashoffset = offset;
        }

        // Draw initial frame as soon as frame 0 is ready
        if (i === 0 && renderedFrameIndex === -1) {
          resizeCanvas();
          drawFrame(0);
        }

        // When all images are loaded
        if (loadedCount >= TOTAL_FRAMES && !isLoaded) {
          onAllAssetsReady();
        }
      };

      img.onload = onAssetLoaded;
      img.onerror = onAssetLoaded;
      images.push(img);
    }
  }

  // Finish preloading and activate experience
  function onAllAssetsReady() {
    isLoaded = true;

    setTimeout(() => {
      loader.classList.add('loaded');
      document.body.classList.add('hero-tools-ready');
      resizeCanvas();
      updateScrollState();

      if (!rafId) {
        rafId = requestAnimationFrame(renderLoop);
      }
    }, 350);
  }

  // Smooth Anchor Navigation
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });

  // Ensure fonts are loaded before initial canvas draw
  if (document.fonts) {
    document.fonts.ready.then(() => {
      renderedFrameIndex = -1;
      drawFrame(Math.round(currentFrame));
    });
  }

  // Scroll Reveal Observer for Experience & Section Media
  function initScrollReveal() {
    const revealElements = document.querySelectorAll('.scroll-reveal-up');
    if ('IntersectionObserver' in window && revealElements.length > 0) {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.12
      });

      revealElements.forEach(el => revealObserver.observe(el));
    } else {
      revealElements.forEach(el => el.classList.add('is-visible'));
    }
  }

  // =========================================================================
  // NaviSavi 3D Curved Video Carousel Gallery (Reference Match)
  // =========================================================================
  function initNaviSaviReelsGallery() {
    const viewport = document.getElementById('reelsFlowViewport');
    const items = Array.from(document.querySelectorAll('.reel-item'));
    if (!viewport || items.length === 0) return;

    const count = items.length; // 9
    let currentX = 0;
    let baseSpeed = 0.85; // Slow, cinematic drift from left to right
    let targetSpeed = baseSpeed;
    let currentSpeed = baseSpeed;
    let isHovered = false;
    let isDragging = false;
    let startX = 0;
    let lastX = 0;
    let dragVelocity = 0;
    let isVisible = true;
    let activePlayingVideo = null;
    let resumeTimeout = null;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      baseSpeed = 0;
      targetSpeed = 0;
      currentSpeed = 0;
    }

    function getCardSpacing() {
      const winW = window.innerWidth;
      if (winW < 600) {
        return 190;
      } else if (winW < 1024) {
        return 235;
      } else {
        return Math.max(275, Math.ceil((winW + 600) / count));
      }
    }

    function renderGallery() {
      const spacing = getCardSpacing();
      const totalWidth = count * spacing;
      const vpWidth = window.innerWidth;
      const halfVp = vpWidth / 2;

      items.forEach((item, index) => {
        // Calculate continuous wrapping position
        let rawPos = (currentX + index * spacing) % totalWidth;
        if (rawPos < 0) rawPos += totalWidth;

        // Center position relative to screen center
        let x = rawPos - (totalWidth / 2);

        // Normalize across viewport for 3D curved perspective
        const nx = x / halfVp;

        // 3D Curvature:
        // Left side cards rotate inward to the right; Right side cards rotate inward to the left
        const rotateY = -nx * 24;
        // Arc depth: edges curve away
        const z = -Math.pow(Math.min(Math.abs(nx), 2.2), 1.25) * 85;
        // Subtle scale hierarchy: center card is hero (scale 1.0)
        const scale = Math.max(0.78, 1.0 - Math.min(Math.abs(nx) * 0.08, 0.20));
        // Z-Index ordering
        const zIndex = Math.round(100 - Math.abs(nx) * 50);

        item.style.transform = `translate3d(${x.toFixed(2)}px, 0, ${z.toFixed(2)}px) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        item.style.zIndex = zIndex;
      });
    }

    // Video Playback Control (Autoplay All Videos Smoothly)
    function startAllVideos() {
      items.forEach(item => {
        const video = item.querySelector('.reel-video-element');
        if (video) {
          video.muted = true;
          video.playsInline = true;
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        }
      });
    }

    function pauseAllVideos() {
      items.forEach(item => {
        const video = item.querySelector('.reel-video-element');
        if (video) {
          video.pause();
        }
      });
    }

    // Hover Event Listeners (Pauses gallery movement on hover)
    items.forEach(item => {
      item.addEventListener('mouseenter', () => {
        isHovered = true;
        item.classList.add('is-hovered');
      });

      item.addEventListener('mouseleave', () => {
        isHovered = false;
        item.classList.remove('is-hovered');
      });

      // Mobile Touch Tap to toggle
      item.addEventListener('click', () => {
        if (isDragging) return;
        const video = item.querySelector('.reel-video-element');
        if (video) {
          if (video.paused) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      });
    });

    // Pointer / Drag Events
    function onPointerDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      isDragging = true;
      startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      lastX = startX;
      dragVelocity = 0;
      if (resumeTimeout) clearTimeout(resumeTimeout);
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const deltaX = clientX - lastX;
      lastX = clientX;

      currentX += deltaX;
      dragVelocity = deltaX;
      renderGallery();
    }

    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      
      currentSpeed = dragVelocity * 0.5;

      if (resumeTimeout) clearTimeout(resumeTimeout);
      resumeTimeout = setTimeout(() => {
        if (!prefersReducedMotion) {
          targetSpeed = baseSpeed;
        }
      }, 1200);
    }

    viewport.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('mouseup', onPointerUp);

    viewport.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Animation Render Loop
    function animationLoop() {
      if (isVisible) {
        if (isHovered || isDragging) {
          currentSpeed += (0 - currentSpeed) * 0.14;
        } else {
          const speedTarget = prefersReducedMotion ? 0 : baseSpeed;
          currentSpeed += (speedTarget - currentSpeed) * 0.05;
        }

        if (Math.abs(currentSpeed) > 0.001) {
          currentX += currentSpeed;
          renderGallery();
        }
      }

      requestAnimationFrame(animationLoop);
    }

    // Viewport Intersection Observer
    if ('IntersectionObserver' in window) {
      const visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            startAllVideos();
          } else {
            pauseAllVideos();
          }
        });
      }, { threshold: 0.05 });

      visibilityObserver.observe(viewport);
    } else {
      startAllVideos();
    }

    // Initialize
    window.addEventListener('resize', renderGallery, { passive: true });
    renderGallery();
    startAllVideos();
    requestAnimationFrame(animationLoop);
  }

  // =========================================================================
  // Product Launch: 4-Layer Scroll-Driven Stacked Video Animation
  // =========================================================================
  function initProductLaunchScrollStack() {
    const section = document.getElementById('launchShowcase');
    const cards = Array.from(document.querySelectorAll('.launch-card'));
    const videos = Array.from(document.querySelectorAll('.launch-video'));

    if (!section || cards.length === 0) return;

    let targetProgress = 0;
    let currentProgress = 0;
    let isVisible = false;

    function cubicEase(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function updateLaunchProgress() {
      const rect = section.getBoundingClientRect();
      const totalScrollable = section.offsetHeight - window.innerHeight;

      if (totalScrollable <= 0) return;

      const scrolled = -rect.top;
      targetProgress = Math.max(0, Math.min(1, scrolled / totalScrollable));
    }

    function renderStack() {
      // Base top-left offset for the 2nd stacked card (exact reference screenshot match)
      const stackOffset = {
        x: -44,
        y: -32,
        z: -40,
        scale: 0.94
      };

      // Card 0 (Front initially): Transitions downward & backward between 0.00 and 0.85
      const transitionEnd = 0.85;
      const t = Math.max(0, Math.min(1, currentProgress / transitionEnd));
      const ease = cubicEase(t);

      if (cards[0]) {
        if (currentProgress < transitionEnd) {
          const x = ease * 12;
          const y = ease * 145;
          const z = -ease * 220;
          const rotateX = -ease * 14;
          const scale = 1 - ease * 0.12;
          const opacity = Math.max(0, 1 - ease * 1.15);

          cards[0].style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateX(${rotateX.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
          cards[0].style.opacity = opacity.toFixed(3);
          cards[0].style.zIndex = 40;
          cards[0].style.pointerEvents = opacity < 0.2 ? 'none' : 'auto';
        } else {
          cards[0].style.transform = `translate3d(12px, 150px, -230px) rotateX(-15deg) scale(0.88)`;
          cards[0].style.opacity = '0';
          cards[0].style.zIndex = 1;
          cards[0].style.pointerEvents = 'none';
        }
      }

      // Card 1 (Stacked Behind initially): Steps smoothly forward from offset to active front
      if (cards[1]) {
        const x = (1 - ease) * stackOffset.x;
        const y = (1 - ease) * stackOffset.y;
        const z = (1 - ease) * stackOffset.z;
        const scale = stackOffset.scale + ease * (1 - stackOffset.scale);

        cards[1].style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) scale(${scale.toFixed(3)})`;
        cards[1].style.opacity = '1';
        cards[1].style.zIndex = Math.round(20 + ease * 20);
        cards[1].style.pointerEvents = 'auto';
      }
    }

    function animationLoop() {
      if (isVisible) {
        const diff = targetProgress - currentProgress;
        if (Math.abs(diff) > 0.0001) {
          currentProgress += diff * 0.16;
          renderStack();
        }
      }
      requestAnimationFrame(animationLoop);
    }

    function startVideos() {
      videos.forEach(v => {
        v.muted = true;
        v.playsInline = true;
        const p = v.play();
        if (p !== undefined) p.catch(() => {});
      });
    }

    function pauseVideos() {
      videos.forEach(v => v.pause());
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            startVideos();
            updateLaunchProgress();
            renderStack();
          } else {
            pauseVideos();
          }
        });
      }, { threshold: 0.01 });

      observer.observe(section);
    } else {
      isVisible = true;
      startVideos();
    }

    window.addEventListener('scroll', updateLaunchProgress, { passive: true });
    window.addEventListener('resize', () => {
      updateLaunchProgress();
      renderStack();
    }, { passive: true });

    updateLaunchProgress();
    currentProgress = targetProgress;
    renderStack();
    startVideos();
    requestAnimationFrame(animationLoop);
  }

  // =========================================================================
  // Social Media Posters & Phone Mockup Conveyor Loop (Right -> Left Flow)
  // =========================================================================
  function initSocialMediaPostersConveyor() {
    const section = document.getElementById('postersShowcase');
    const cards = Array.from(document.querySelectorAll('.poster-card-item'));
    const instaImage = document.getElementById('instaActiveImage');

    if (!section || cards.length === 0 || !instaImage) return;

    const images = [
      'Social Media/1.png',
      'Social Media/2.png',
      'Social Media/3.png',
      'Social Media/4.png',
      'Social Media/5.png',
      'Social Media/6.png'
    ];

    const N = images.length;
    const baseCenterIndex = 2; // Image 3 initially at center in phone
    const totalScrollSteps = 6; // Completes 6 steps through the carousel

    let targetProgress = 0;
    let currentProgress = 0;
    let isVisible = false;
    let currentActiveIndex = baseCenterIndex;

    function updatePostersProgress() {
      const rect = section.getBoundingClientRect();
      const totalScrollable = section.offsetHeight - window.innerHeight;

      if (totalScrollable <= 0) return;

      const scrolled = -rect.top;
      targetProgress = Math.max(0, Math.min(1, scrolled / totalScrollable));
    }

    function renderConveyor() {
      // Step value increases as user scrolls down: 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8
      const currentStep = baseCenterIndex + (currentProgress * totalScrollSteps);
      
      const viewportWidth = window.innerWidth;
      const isMobileSmall = viewportWidth <= 480;
      const isMobile = viewportWidth <= 768;
      const isTablet = viewportWidth <= 1024;
      const cardWidth = isMobileSmall ? 165 : (isMobile ? 190 : (isTablet ? 220 : 255));
      const gap = isMobileSmall ? 18 : (isMobile ? 22 : 32);
      const pitch = cardWidth + gap;

      cards.forEach((card, idx) => {
        // diff: difference from current center step
        let diff = (idx - currentStep) % N;
        while (diff < -N / 2) diff += N;
        while (diff >= N / 2) diff -= N;

        // When scrolling down, currentStep increases => diff decreases => x moves toward negative (LEFT)
        const x = diff * pitch;
        const absDiff = Math.abs(diff);

        // Subtle 3D depth and scale styling
        const scale = Math.max(0.72, 1 - absDiff * 0.08);
        const opacity = Math.max(0, 1 - Math.max(0, absDiff - 1.8) * 0.45);
        const zIndex = Math.round(20 - absDiff * 3);

        card.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0) scale(${scale.toFixed(3)})`;
        card.style.opacity = opacity.toFixed(3);
        card.style.zIndex = zIndex;
      });

      // Update Instagram screen with the closest center image
      const activeIdx = ((Math.round(currentStep) % N) + N) % N;
      if (activeIdx !== currentActiveIndex) {
        currentActiveIndex = activeIdx;
        instaImage.style.opacity = '0.4';
        instaImage.style.transform = 'scale(0.96)';
        setTimeout(() => {
          instaImage.src = images[currentActiveIndex];
          instaImage.style.opacity = '1';
          instaImage.style.transform = 'scale(1)';
        }, 60);
      }
    }

    function animationLoop() {
      if (isVisible) {
        const diff = targetProgress - currentProgress;
        if (Math.abs(diff) > 0.0001) {
          currentProgress += diff * 0.14;
          renderConveyor();
        }
      }
      requestAnimationFrame(animationLoop);
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            updatePostersProgress();
            renderConveyor();
          }
        });
      }, { threshold: 0.01 });

      observer.observe(section);
    } else {
      isVisible = true;
    }

    window.addEventListener('scroll', updatePostersProgress, { passive: true });
    window.addEventListener('resize', () => {
      updatePostersProgress();
      renderConveyor();
    }, { passive: true });

    updatePostersProgress();
    currentProgress = targetProgress;
    renderConveyor();
    requestAnimationFrame(animationLoop);
  }

  // Event Listeners
  window.addEventListener('scroll', updateScrollState, { passive: true });
  window.addEventListener('resize', resizeCanvas, { passive: true });

  // Initialize
  initScrollReveal();
  initNaviSaviReelsGallery();
  initProductLaunchScrollStack();
  initSocialMediaPostersConveyor();
  resizeCanvas();
  preloadImages();
})();
