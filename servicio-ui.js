if (window.lucide) {
  lucide.createIcons();
}

const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
  const setMenuOpen = (isOpen) => {
    navMenu.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    navToggle.innerHTML = `<i data-lucide="${isOpen ? 'x' : 'menu'}"></i>`;
    if (window.lucide) lucide.createIcons();
  };

  navToggle.addEventListener('click', () => {
    setMenuOpen(navToggle.getAttribute('aria-expanded') !== 'true');
  });
  navMenu.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => setMenuOpen(false));
  });
}

const lightbox = document.getElementById('serviceLightbox');
const lightboxImage = document.getElementById('lightboxImage');

if (lightbox && lightboxImage) {
  document.querySelectorAll('.service-gallery-item img').forEach((thumbnail) => {
    thumbnail.closest('button')?.addEventListener('click', () => {
      lightboxImage.src = thumbnail.currentSrc || thumbnail.src;
      lightboxImage.alt = thumbnail.alt;
      lightbox.showModal();
    });
  });

  document.getElementById('lightboxClose')?.addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) lightbox.close();
  });
}

const expoCarousel = document.querySelector('[data-expo-carousel]');

if (expoCarousel) {
  const expoTrack = expoCarousel.querySelector('[data-expo-track]');
  const expoSlides = [...expoCarousel.querySelectorAll('[data-expo-slide]')];
  const expoDots = [...expoCarousel.querySelectorAll('[data-expo-dot]')];
  const expoCount = expoCarousel.querySelector('[data-expo-count]');
  const previousExpoButton = expoCarousel.querySelector('[data-expo-previous]');
  const nextExpoButton = expoCarousel.querySelector('[data-expo-next]');

  if (expoTrack && expoSlides.length && expoDots.length === expoSlides.length && expoCount && previousExpoButton && nextExpoButton) {
    let activeExpoSlide = 0;
    let expoAutoplay;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const showExpoSlide = (requestedIndex) => {
      activeExpoSlide = (requestedIndex + expoSlides.length) % expoSlides.length;
      expoTrack.style.transform = `translateX(-${activeExpoSlide * 100}%)`;
      expoSlides.forEach((slide, index) => {
        const isActive = index === activeExpoSlide;
        slide.setAttribute('aria-hidden', String(!isActive));
        slide.toggleAttribute('inert', !isActive);
      });
      expoDots.forEach((dot, index) => {
        if (index === activeExpoSlide) {
          dot.setAttribute('aria-current', 'true');
        } else {
          dot.removeAttribute('aria-current');
        }
      });
      expoCount.textContent = `${String(activeExpoSlide + 1).padStart(2, '0')} / ${String(expoSlides.length).padStart(2, '0')}`;
    };

    const stopExpoAutoplay = () => {
      window.clearInterval(expoAutoplay);
    };
    const startExpoAutoplay = () => {
      stopExpoAutoplay();
      if (!prefersReducedMotion && !document.hidden) {
        expoAutoplay = window.setInterval(() => {
          showExpoSlide(activeExpoSlide + 1);
        }, 5000);
      }
    };

    previousExpoButton.addEventListener('click', () => showExpoSlide(activeExpoSlide - 1));
    nextExpoButton.addEventListener('click', () => showExpoSlide(activeExpoSlide + 1));
    expoDots.forEach((dot) => {
      dot.addEventListener('click', () => showExpoSlide(Number(dot.dataset.expoDot)));
    });
    expoCarousel.addEventListener('mouseenter', stopExpoAutoplay);
    expoCarousel.addEventListener('mouseleave', startExpoAutoplay);
    expoCarousel.addEventListener('focusin', stopExpoAutoplay);
    expoCarousel.addEventListener('focusout', (event) => {
      if (!expoCarousel.contains(event.relatedTarget)) startExpoAutoplay();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopExpoAutoplay();
      } else if (!expoCarousel.matches(':hover') && !expoCarousel.contains(document.activeElement)) {
        startExpoAutoplay();
      }
    });
    expoCarousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showExpoSlide(activeExpoSlide - 1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showExpoSlide(activeExpoSlide + 1);
      }
    });
    showExpoSlide(activeExpoSlide);
    startExpoAutoplay();
  }
}
