const SUPABASE_PROJECT_URL = 'https://qwrhihpltwkcargfifis.supabase.co';
const SUPABASE_PROJECT_KEY = 'sb_publishable_VJQdUrQbPFEyTnsWXKoTIA_RVpcSS35';
const PROJECT_SERVICE_LABELS = {
  instalacion: 'Instalación de Fibra Óptica',
  fusion: 'Fusión y Certificación',
  mantenimiento: 'Mantenimiento y Reparación',
  cableado: 'Cableado Estructurado',
  lauchado: 'Lauchado de Ductos'
};

const projectGrid = document.getElementById('projectsGrid');
const projectStatus = document.getElementById('projectsStatus');
const staticProjectTitles = new Set(
  [...projectGrid.querySelectorAll(':scope > .project-card .project-info h3')]
    .map((title) => normalizeProjectTitle(title.textContent))
);

function normalizeProjectTitle(title) {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es');
}

const groupPublicProjects = (rows) => {
  const groups = new Map();
  rows.forEach((row) => {
    const projectId = row.proyecto_id || `legacy-${row.id}`;
    if (!groups.has(projectId)) {
      groups.set(projectId, {
        categoria: row.categoria,
        etiqueta: row.etiqueta || '',
        titulo: row.titulo || '',
        descripcion: row.descripcion || '',
        proyecto_orden: row.proyecto_orden ?? row.orden ?? 0,
        media: []
      });
    }
    groups.get(projectId).media.push(row);
  });
  return [...groups.values()]
    .map((project) => ({
      ...project,
      media: project.media.sort((a, b) => (a.medio_orden ?? a.orden ?? 0) - (b.medio_orden ?? b.orden ?? 0))
    }))
    .sort((a, b) => a.proyecto_orden - b.proyecto_orden || a.titulo.localeCompare(b.titulo, 'es'));
};

const makeProjectCard = (project) => {
  const article = document.createElement('article');
  article.className = 'project-card';
  const carousel = document.createElement('div');
  carousel.className = 'project-carousel';
  carousel.tabIndex = 0;
  carousel.setAttribute('aria-label', `Imágenes de ${project.titulo}`);
  const badge = document.createElement('span');
  badge.className = 'project-category';
  badge.textContent = project.etiqueta || PROJECT_SERVICE_LABELS[project.categoria] || project.categoria;
  carousel.append(badge);

  const track = document.createElement('div');
  track.className = 'carousel-track';
  const slides = [];
  const dots = [];
  project.media.forEach((media, index) => {
    let src;
    try {
      const mediaPath = String(media.imagen_url || '').trim();
      if (!mediaPath) return;
      const url = new URL(mediaPath, window.location.href);
      const isRelativePath = !/^[a-z][a-z\d+.-]*:/i.test(mediaPath) && !mediaPath.startsWith('//');
      if (isRelativePath) {
        src = url.href;
      } else if (['http:', 'https:'].includes(url.protocol)) {
        src = url.href;
      } else {
        return;
      }
    } catch {
      return;
    }

    const isVideo = /\.(mp4|webm|ogg)(?:$|[?#])/i.test(src);
    const slide = document.createElement(isVideo ? 'video' : 'img');
    slide.className = `carousel-slide${slides.length === 0 ? ' is-active' : ''}`;
    slide.dataset.slide = '';
    slide.src = src;
    if (isVideo) {
      slide.muted = true;
      slide.playsInline = true;
      slide.loop = true;
      slide.preload = 'metadata';
      slide.setAttribute('aria-label', media.descripcion || project.titulo);
    } else {
      slide.alt = media.descripcion || project.titulo;
      slide.loading = index === 0 ? 'eager' : 'lazy';
    }
    slides.push(slide);
    track.append(slide);

    const dot = document.createElement('button');
    dot.className = `carousel-dot${slides.length === 1 ? ' is-active' : ''}`;
    dot.type = 'button';
    dot.dataset.dot = String(slides.length - 1);
    dot.setAttribute('aria-label', `Ver imagen ${slides.length}`);
    if (slides.length === 1) dot.setAttribute('aria-current', 'true');
    dots.push(dot);
  });
  carousel.append(track);

  if (slides.length > 1) {
    const previous = document.createElement('button');
    previous.className = 'carousel-button carousel-button-prev';
    previous.type = 'button';
    previous.setAttribute('aria-label', 'Imagen anterior');
    previous.innerHTML = '<i data-lucide="chevron-left" aria-hidden="true"></i>';
    const next = document.createElement('button');
    next.className = 'carousel-button carousel-button-next';
    next.type = 'button';
    next.setAttribute('aria-label', 'Imagen siguiente');
    next.innerHTML = '<i data-lucide="chevron-right" aria-hidden="true"></i>';
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel-dots';
    dotsContainer.setAttribute('aria-label', 'Seleccionar imagen');
    dotsContainer.append(...dots);
    carousel.append(previous, next, dotsContainer);

    let activeIndex = 0;
    const selectSlide = (requestedIndex) => {
      activeIndex = (requestedIndex + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === activeIndex);
        if (slide.tagName === 'VIDEO') {
          if (slideIndex === activeIndex) slide.play().catch(() => {});
          else slide.pause();
        }
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === activeIndex);
        dot.toggleAttribute('aria-current', dotIndex === activeIndex);
      });
    };

    previous.addEventListener('click', () => selectSlide(activeIndex - 1));
    next.addEventListener('click', () => selectSlide(activeIndex + 1));
    dots.forEach((dot) => dot.addEventListener('click', () => selectSlide(Number(dot.dataset.dot))));
    carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') selectSlide(activeIndex - 1);
      if (event.key === 'ArrowRight') selectSlide(activeIndex + 1);
    });
  }

  const info = document.createElement('div');
  info.className = 'project-info';
  const title = document.createElement('h3');
  title.textContent = project.titulo;
  const description = document.createElement('p');
  description.textContent = project.descripcion;
  info.append(title, description);
  article.append(carousel, info);
  return article;
};

const loadPublicProjects = async () => {
  const query = new URLSearchParams({
    select: 'id,categoria,titulo,descripcion,imagen_url,orden,etiqueta,proyecto_id,proyecto_orden,medio_orden,es_proyecto',
    es_proyecto: 'eq.true',
    order: 'proyecto_orden.asc,medio_orden.asc,id.asc'
  });
  const response = await fetch(`${SUPABASE_PROJECT_URL}/rest/v1/tarjetas?${query}`, {
    headers: {
      apikey: SUPABASE_PROJECT_KEY,
      Authorization: `Bearer ${SUPABASE_PROJECT_KEY}`
    }
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase respondió ${response.status}: ${details}`);
  }
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('La respuesta no contiene una lista de proyectos.');
  const projects = groupPublicProjects(rows)
    .filter((project) => !staticProjectTitles.has(normalizeProjectTitle(project.titulo)));
  projectGrid.querySelectorAll('.project-card-from-db').forEach((card) => card.remove());
  const projectCards = projects.map((project) => {
    const card = makeProjectCard(project);
    card.classList.add('project-card-from-db');
    return card;
  });
  projectGrid.append(...projectCards);
  projectStatus.textContent = '';
  projectStatus.hidden = true;
  if (window.lucide) lucide.createIcons();
};

if (projectGrid && projectStatus) {
  loadPublicProjects().catch((error) => {
    console.error('No se pudieron cargar los proyectos publicados desde Supabase.', error);
    projectStatus.textContent = 'Mostrando proyectos destacados. No fue posible actualizar la lista en este momento.';
    projectStatus.hidden = false;
  });
}
