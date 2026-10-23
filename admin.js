const SUPABASE_URL = 'https://qwrhihpltwkcargfifis.supabase.co';
const SUPABASE_KEY = 'sb_publishable_VJQdUrQbPFEyTnsWXKoTIA_RVpcSS35';
const STORAGE_BUCKET = 'imagenes-proyectos';
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const SERVICE_LABELS = {
  instalacion: 'Instalación de Fibra Óptica',
  fusion: 'Fusión y Certificación',
  mantenimiento: 'Mantenimiento y Reparación',
  cableado: 'Cableado Estructurado',
  lauchado: 'Lauchado de Ductos'
};

let accessToken = '';
let projects = [];
let editingProjectId = '';

const loginPanel = document.getElementById('adminLoginPanel');
const loginForm = document.getElementById('adminLoginForm');
const adminSite = document.getElementById('adminSite');
const loginNotice = document.getElementById('adminNotice');
const projectStatus = document.getElementById('projectsStatus');
const formNotice = document.getElementById('formNotice');
const projectDialog = document.getElementById('adminProjectDialog');
const projectForm = document.getElementById('adminProjectForm');
const fileInput = document.getElementById('adminFile');
const saveButton = document.getElementById('adminSaveButton');
const projectGrid = document.getElementById('projectsGrid');
const staticProjectCards = [...projectGrid.querySelectorAll(':scope > .project-card')];

const normalizeProjectTitle = (title) => title
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLocaleLowerCase('es');
const staticProjectTitles = new Set(
  staticProjectCards.map((card) => normalizeProjectTitle(card.querySelector('.project-info h3')?.textContent || ''))
);

const showLogin = (message = 'Ingresa tus credenciales de administración.', kind = 'info') => {
  adminSite.hidden = true;
  loginPanel.hidden = false;
  showNotice(loginNotice, message, kind);
};

const showNotice = (element, message, kind = 'info') => {
  element.textContent = message;
  element.dataset.kind = kind;
  element.hidden = false;
};

const readResponse = async (response) => {
  const body = await response.text();
  if (!response.ok) {
    let reason = body;
    try {
      const payload = JSON.parse(body);
      reason = payload.msg || payload.message || payload.error_description || payload.error || body;
    } catch {
      // Keep the original response body when Supabase does not return JSON.
    }
    throw new Error(`Supabase respondió ${response.status}: ${reason}`);
  }
  if (!body) return null;
  return JSON.parse(body);
};

const apiRequest = async (path, { method = 'GET', body, prefer } = {}) => {
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${accessToken}`
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return readResponse(response);
};

const storageRequest = async (path, { method = 'POST', body, contentType } = {}) => {
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${accessToken}`
  };
  if (contentType) headers['Content-Type'] = contentType;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/${path}`, {
    method,
    headers,
    body
  });
  return readResponse(response);
};

const makeUuid = () => {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.random() * 16 | 0;
    return (character === 'x' ? random : (random & 0x3 | 0x8)).toString(16);
  });
};

const safeMediaUrl = (value) => {
  const mediaPath = String(value || '').trim();
  if (!mediaPath) return '';
  try {
    const url = new URL(mediaPath, document.baseURI);
    const isRelativePath = !/^[a-z][a-z\d+.-]*:/i.test(mediaPath) && !mediaPath.startsWith('//');
    if (isRelativePath) return url.href;
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
};

const createIconButton = (icon, label, className, action) => {
  const button = document.createElement('button');
  button.className = className;
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.dataset.carouselAction = action;
  const iconElement = document.createElement('i');
  iconElement.dataset.lucide = icon;
  iconElement.setAttribute('aria-hidden', 'true');
  button.append(iconElement);
  return button;
};

const activateSlide = (carousel, slides, dots, selectedIndex) => {
  const current = (selectedIndex + slides.length) % slides.length;
  slides.forEach((slide, index) => {
    const active = index === current;
    slide.classList.toggle('is-active', active);
    if (slide.tagName === 'VIDEO') {
      if (active) slide.play().catch(() => {});
      else slide.pause();
    }
  });
  dots.forEach((dot, index) => {
    const active = index === current;
    dot.classList.toggle('is-active', active);
    dot.toggleAttribute('aria-current', active);
  });
  carousel.dataset.currentSlide = String(current);
};

const renderCarousel = (project) => {
  const carousel = document.createElement('div');
  carousel.className = 'project-carousel';
  carousel.setAttribute('aria-label', `Imágenes de ${project.titulo}`);
  carousel.tabIndex = 0;

  const badge = document.createElement('span');
  badge.className = 'project-category';
  badge.textContent = project.etiqueta || SERVICE_LABELS[project.categoria] || project.categoria;
  carousel.append(badge);

  const track = document.createElement('div');
  track.className = 'carousel-track';
  const slides = [];
  const dots = [];
  project.media.forEach((media, index) => {
    const src = safeMediaUrl(media.imagen_url);
    if (!src) return;
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
      slide.loading = index > 0 ? 'lazy' : 'eager';
    }
    slides.push(slide);
    track.append(slide);

    const dot = document.createElement('button');
    dot.className = `carousel-dot${slides.length === 1 ? ' is-active' : ''}`;
    dot.type = 'button';
    dot.dataset.carouselDot = String(slides.length - 1);
    dot.setAttribute('aria-label', `Ver imagen ${slides.length}`);
    if (slides.length === 1) dot.setAttribute('aria-current', 'true');
    dots.push(dot);
  });
  carousel.append(track);

  if (slides.length > 1) {
    const previous = createIconButton('chevron-left', 'Imagen anterior', 'carousel-button carousel-button-prev', 'previous');
    const next = createIconButton('chevron-right', 'Imagen siguiente', 'carousel-button carousel-button-next', 'next');
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'carousel-dots';
    dotsContainer.setAttribute('aria-label', 'Seleccionar imagen');
    dotsContainer.append(...dots);
    carousel.append(previous, next, dotsContainer);
  }

  carousel.addEventListener('click', (event) => {
    const button = event.target.closest('[data-carousel-action], [data-carousel-dot]');
    if (!button || !carousel.contains(button)) return;
    const current = Number(carousel.dataset.currentSlide || 0);
    if (button.dataset.carouselAction === 'previous') activateSlide(carousel, slides, dots, current - 1);
    if (button.dataset.carouselAction === 'next') activateSlide(carousel, slides, dots, current + 1);
    if (button.hasAttribute('data-carousel-dot')) activateSlide(carousel, slides, dots, Number(button.dataset.carouselDot));
  });
  carousel.addEventListener('keydown', (event) => {
    const current = Number(carousel.dataset.currentSlide || 0);
    if (event.key === 'ArrowLeft') activateSlide(carousel, slides, dots, current - 1);
    if (event.key === 'ArrowRight') activateSlide(carousel, slides, dots, current + 1);
  });
  return carousel;
};

const renderProject = (project) => {
  const article = document.createElement('article');
  article.className = 'project-card admin-project-card admin-dynamic-project';
  article.dataset.projectId = project.projectId;
  article.append(renderCarousel(project));

  const info = document.createElement('div');
  info.className = 'project-info';
  const title = document.createElement('h3');
  title.textContent = project.titulo;
  const description = document.createElement('p');
  description.textContent = project.descripcion;
  info.append(title, description);

  const actions = document.createElement('div');
  actions.className = 'admin-project-actions';
  const edit = document.createElement('button');
  edit.className = 'admin-project-action';
  edit.type = 'button';
  edit.dataset.projectAction = 'edit';
  edit.dataset.projectId = project.projectId;
  edit.title = 'Añadir o editar fotos del carrusel';
  edit.setAttribute('aria-label', `Añadir o editar fotos del carrusel de ${project.titulo}`);
  edit.innerHTML = '<i data-lucide="images" aria-hidden="true"></i><span>Editar carrusel</span>';
  const remove = document.createElement('button');
  remove.className = 'admin-project-action admin-project-action-delete';
  remove.type = 'button';
  remove.dataset.projectAction = 'delete';
  remove.dataset.projectId = project.projectId;
  remove.title = `Eliminar proyecto ${project.titulo}`;
  remove.setAttribute('aria-label', `Eliminar proyecto ${project.titulo}`);
  remove.innerHTML = '<i data-lucide="trash-2" aria-hidden="true"></i><span>Eliminar</span>';
  actions.append(edit, remove);
  info.append(actions);
  article.append(info);
  return article;
};

const groupProjects = (rows) => {
  const groups = new Map();
  for (const row of rows) {
    const key = row.proyecto_id || `legacy-${row.id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        projectId: key,
        categoria: row.categoria,
        etiqueta: row.etiqueta || '',
        titulo: row.titulo || '',
        descripcion: row.descripcion || '',
        proyecto_orden: row.proyecto_orden ?? row.orden ?? 0,
        media: []
      });
    }
    groups.get(key).media.push(row);
  }
  return [...groups.values()].map((project) => ({
    ...project,
    media: project.media.sort((a, b) => (a.medio_orden ?? a.orden ?? 0) - (b.medio_orden ?? b.orden ?? 0))
  })).sort((a, b) => a.proyecto_orden - b.proyecto_orden || a.titulo.localeCompare(b.titulo, 'es'));
};

const loadProjects = async () => {
  showNotice(projectStatus, 'Cargando proyectos publicados...');
  const params = new URLSearchParams({
    select: 'id,categoria,titulo,descripcion,imagen_url,orden,etiqueta,proyecto_id,proyecto_orden,medio_orden,es_proyecto',
    es_proyecto: 'eq.true',
    order: 'proyecto_orden.asc,medio_orden.asc,id.asc'
  });
  const response = await apiRequest(`/rest/v1/tarjetas?${params}`);
  if (!Array.isArray(response)) throw new Error('Supabase no devolvió una lista de proyectos.');
  projects = groupProjects(response);

  const staticCards = projects.filter((project) => !staticProjectTitles.has(normalizeProjectTitle(project.titulo)));
  projectGrid.querySelectorAll('.admin-dynamic-project').forEach((card) => card.remove());
  projectGrid.append(...staticCards.map(renderProject));
  projectStatus.hidden = true;
  projectStatus.textContent = '';
  if (window.lucide) lucide.createIcons();
};

const ensureCreateProjectSlot = () => {
  let createCard = document.getElementById('adminCreateProject');
  if (!createCard) {
    createCard = document.createElement('button');
    createCard.className = 'admin-create-project';
    createCard.id = 'adminCreateProject';
    createCard.type = 'button';
    createCard.innerHTML = '<span class="admin-create-icon" aria-hidden="true">+</span><strong>Agregar Nuevo Proyecto</strong><span>Publica un nuevo trabajo realizado</span>';
  }
  projectGrid.prepend(createCard);
};

const verifyAdministrator = async (session) => {
  const userId = session.user?.id;
  if (!userId) throw new Error('La sesión no incluye un identificador de usuario.');
  const params = new URLSearchParams({ select: 'user_id', user_id: `eq.${userId}`, limit: '1' });
  const result = await apiRequest(`/rest/v1/admin_users?${params}`);
  if (!Array.isArray(result) || result.length !== 1) {
    throw new Error('Esta cuenta no está autorizada para administrar el portafolio.');
  }
};

const showWorkspace = () => {
  loginPanel.hidden = true;
  adminSite.hidden = false;
  ensureCreateProjectSlot();
  showNotice(projectStatus, 'Cargando proyectos publicados...');
  window.dispatchEvent(new Event('bertel-admin-visible'));
  window.scrollTo(0, 0);
  if (window.lucide) lucide.createIcons();
};

const setBusy = (busy) => {
  saveButton.disabled = busy;
  document.getElementById('adminCancelButton').disabled = busy;
  document.getElementById('adminDialogClose').disabled = busy;
};

const setProgress = (completed, total) => {
  const percent = total ? Math.round(completed / total * 100) : 0;
  document.getElementById('adminProgressBar').value = percent;
  document.getElementById('adminProgressLabel').textContent =
    `Subiendo archivos a Supabase Storage... (${completed} de ${total})`;
};

const uploadFile = async (file, projectId, index) => {
  const cleanName = file.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || `archivo-${index + 1}`;
  const objectPath = `${projectId}/${String(index + 1).padStart(3, '0')}-${makeUuid()}-${cleanName}`;
  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
  await storageRequest(`object/${STORAGE_BUCKET}/${encodedPath}`, {
    method: 'POST',
    body: file,
    contentType: file.type || 'application/octet-stream'
  });
  return {
    path: objectPath,
    url: `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${encodedPath}`
  };
};

const deleteStorageObjects = async (objectPaths) => {
  const errors = [];
  for (const path of objectPaths) {
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    try {
      await storageRequest(`object/${STORAGE_BUCKET}/${encodedPath}`, { method: 'DELETE' });
    } catch (error) {
      errors.push(error);
    }
  }
  return errors;
};

const oldStorageObjectPaths = (project) => project.media.flatMap((media) => {
  try {
    const url = new URL(media.imagen_url);
    const prefix = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    if (url.origin !== SUPABASE_URL || !url.pathname.startsWith(prefix)) return [];
    return [decodeURIComponent(url.pathname.slice(prefix.length))];
  } catch {
    return [];
  }
});

const readProjectForm = () => {
  const values = new FormData(projectForm);
  return {
    categoria: values.get('categoria'),
    etiqueta: values.get('etiqueta').trim(),
    titulo: values.get('titulo').trim(),
    descripcion: values.get('descripcion').trim(),
    files: [...fileInput.files]
  };
};

const closeProjectDialog = () => {
  projectDialog.close();
  projectForm.reset();
  editingProjectId = '';
  document.getElementById('adminDialogTitle').textContent = 'Crear Nuevo Proyecto';
  document.getElementById('adminFileHint').textContent =
    'Selecciona uno o más archivos. Los archivos nuevos reemplazan el carrusel completo al editar.';
  document.getElementById('adminUploadProgress').hidden = true;
  formNotice.hidden = true;
  document.getElementById('adminProgressBar').value = 0;
};

const openProjectDialog = (project = null) => {
  projectForm.reset();
  editingProjectId = project?.projectId || '';
  document.getElementById('adminDialogTitle').textContent = project ? 'Editar Proyecto' : 'Crear Nuevo Proyecto';
  document.getElementById('adminCategory').value = project?.categoria || 'instalacion';
  document.getElementById('adminBadge').value = project?.etiqueta || '';
  document.getElementById('adminTitle').value = project?.titulo || '';
  document.getElementById('adminDescription').value = project?.descripcion || '';
  document.getElementById('adminFileHint').textContent = project
    ? `El nuevo carrusel reemplazará los ${project.media.length} medios actuales. Selecciona al menos un archivo.`
    : 'Selecciona uno o más archivos para crear el carrusel del proyecto.';
  fileInput.required = true;
  formNotice.hidden = true;
  document.getElementById('adminUploadProgress').hidden = true;
  projectDialog.showModal();
  document.getElementById('adminTitle').focus();
};

const removeProjectRows = async (project) => {
  const params = new URLSearchParams({ proyecto_id: `eq.${project.projectId}`, es_proyecto: 'eq.true' });
  await apiRequest(`/rest/v1/tarjetas?${params}`, { method: 'DELETE' });
};

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = document.getElementById('adminLoginButton');
  button.disabled = true;
  showNotice(loginNotice, 'Verificando acceso...');

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('adminEmail').value.trim(),
        password: document.getElementById('adminPassword').value
      })
    });
    const session = await readResponse(response);
    if (!session?.access_token) throw new Error('Supabase no devolvió una sesión válida.');
    accessToken = session.access_token;
    await verifyAdministrator(session);
    document.getElementById('adminPassword').value = '';
    showWorkspace();
    try {
      await loadProjects();
    } catch (error) {
      console.error('No se pudieron cargar los proyectos de Supabase.', error);
      showNotice(projectStatus, `No se pudieron cargar los proyectos. ${error.message}`, 'error');
    }
  } catch (error) {
    console.error('No se pudo iniciar la sesión de administración.', error);
    accessToken = '';
    showLogin(`Acceso no disponible. ${error.message}`, 'error');
  } finally {
    button.disabled = false;
  }
});

document.getElementById('adminCancelButton').addEventListener('click', closeProjectDialog);
document.getElementById('adminDialogClose').addEventListener('click', closeProjectDialog);
projectDialog.addEventListener('click', (event) => {
  if (event.target === projectDialog) closeProjectDialog();
});

projectForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formValues = readProjectForm();
  if (!formValues.files.length) {
    showNotice(formNotice, 'Selecciona al menos un archivo para el carrusel.', 'error');
    return;
  }
  const invalidFiles = formValues.files.filter((file) => !file.type.startsWith('image/') && !file.type.startsWith('video/'));
  if (invalidFiles.length) {
    showNotice(formNotice, 'Solo se permiten archivos de imagen o video.', 'error');
    return;
  }
  const oversizedFiles = formValues.files.filter((file) => file.size > MAX_FILE_SIZE);
  if (oversizedFiles.length) {
    showNotice(formNotice, 'Cada archivo debe pesar 50 MB o menos.', 'error');
    return;
  }

  const existingProject = projects.find((project) => project.projectId === editingProjectId);
  const projectId = makeUuid();
  const uploadedObjects = [];
  let projectRowsCommitted = false;
  setBusy(true);
  document.getElementById('adminUploadProgress').hidden = false;
  showNotice(formNotice, 'Preparando la subida de archivos...');
  setProgress(0, formValues.files.length);

  try {
    for (const [index, file] of formValues.files.entries()) {
      let uploaded;
      try {
        uploaded = await uploadFile(file, projectId, index);
      } catch (error) {
        throw new Error(`Falló la subida a Storage en el archivo ${index + 1} de ${formValues.files.length}. ${error.message}`);
      }
      uploadedObjects.push(uploaded);
      setProgress(index + 1, formValues.files.length);
    }

    const nextProjectOrder = projects.reduce((highest, project) => Math.max(highest, project.proyecto_orden || 0), 0) + 10;
    const projectOrder = existingProject?.proyecto_orden ?? nextProjectOrder;
    const rows = uploadedObjects.map((media, index) => ({
      categoria: formValues.categoria,
      titulo: formValues.titulo,
      descripcion: formValues.descripcion,
      imagen_url: media.url,
      etiqueta: formValues.etiqueta,
      proyecto_id: projectId,
      proyecto_orden: projectOrder,
      medio_orden: index,
      orden: index,
      es_proyecto: true
    }));
    try {
      await apiRequest('/rest/v1/tarjetas', {
        method: 'POST',
        body: rows,
        prefer: 'return=minimal'
      });
    } catch (error) {
      throw new Error(`Los archivos subieron, pero Supabase rechazó las filas de public.tarjetas. ${error.message}`);
    }
    projectRowsCommitted = true;

    try {
      if (existingProject) await removeProjectRows(existingProject);
    } catch (error) {
      const insertedParams = new URLSearchParams({ proyecto_id: `eq.${projectId}`, es_proyecto: 'eq.true' });
      try {
        await apiRequest(`/rest/v1/tarjetas?${insertedParams}`, { method: 'DELETE' });
        projectRowsCommitted = false;
      } catch (rollbackError) {
        console.error('No se pudieron revertir las filas nuevas tras fallar la edición.', rollbackError);
      }
      throw new Error(`No se pudo sustituir el proyecto anterior. ${error.message}`);
    }

    let cleanupWarning = '';
    if (existingProject) {
      const cleanupErrors = await deleteStorageObjects(oldStorageObjectPaths(existingProject));
      if (cleanupErrors.length) {
        console.error('El proyecto se actualizó, pero algunos archivos anteriores no se pudieron limpiar.', cleanupErrors);
        cleanupWarning = ' Algunos archivos anteriores quedaron en Storage y pueden borrarse manualmente.';
      }
    }

    closeProjectDialog();
    try {
      await loadProjects();
    } catch (error) {
      console.error('El proyecto se guardó, pero la lista no pudo recargarse.', error);
      showNotice(projectStatus, `El proyecto se guardó, pero la lista no pudo actualizarse. ${error.message}`, 'error');
      return;
    }
    showNotice(projectStatus, `${existingProject ? 'Proyecto actualizado' : 'Proyecto publicado'} correctamente.${cleanupWarning}`, 'success');
  } catch (error) {
    console.error('No se pudo publicar el proyecto.', error);
    if (uploadedObjects.length && !projectRowsCommitted) {
      const cleanupErrors = await deleteStorageObjects(uploadedObjects.map((media) => media.path));
      if (cleanupErrors.length) console.error('No se pudieron limpiar todos los archivos de la carga fallida.', cleanupErrors);
    }
    showNotice(formNotice, `No se pudo guardar el proyecto. ${error.message}`, 'error');
  } finally {
    setBusy(false);
    document.getElementById('adminUploadProgress').hidden = true;
  }
});

projectGrid.addEventListener('click', async (event) => {
  const createButton = event.target.closest('#adminCreateProject');
  if (createButton && projectGrid.contains(createButton)) {
    openProjectDialog();
    return;
  }
  const button = event.target.closest('[data-project-action]');
  if (!button) return;
  const project = projects.find((item) => item.projectId === button.dataset.projectId);
  if (!project) {
    showNotice(projectStatus, 'El proyecto ya no está disponible. Recarga la lista.', 'error');
    return;
  }
  if (button.dataset.projectAction === 'edit') {
    openProjectDialog(project);
    return;
  }
  if (button.dataset.projectAction !== 'delete') return;
  if (!window.confirm(`¿Eliminar "${project.titulo}" y todos sus medios? Esta acción no se puede deshacer.`)) return;

  button.disabled = true;
  try {
    await removeProjectRows(project);
    const cleanupErrors = await deleteStorageObjects(oldStorageObjectPaths(project));
    await loadProjects();
    showNotice(
      projectStatus,
      cleanupErrors.length
        ? 'Proyecto eliminado. Algunos archivos antiguos no se pudieron limpiar de Storage.'
        : 'Proyecto y archivos eliminados correctamente.',
      cleanupErrors.length ? 'info' : 'success'
    );
  } catch (error) {
    console.error('No se pudo eliminar el proyecto.', error);
    showNotice(projectStatus, `No se pudo eliminar el proyecto. ${error.message}`, 'error');
  } finally {
    button.disabled = false;
  }
});

document.getElementById('adminSignOut').addEventListener('click', async () => {
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${accessToken}` }
    });
  } catch (error) {
    console.error('No se pudo invalidar la sesión en Supabase.', error);
  }
  accessToken = '';
  projects = [];
  projectGrid.querySelectorAll('.admin-dynamic-project').forEach((card) => card.remove());
  document.getElementById('adminCreateProject')?.remove();
  showLogin('Sesión cerrada. Ingresa para continuar.');
});

if (window.lucide) lucide.createIcons();
