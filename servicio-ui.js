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
