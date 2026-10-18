-- Ejecutar una sola vez en el SQL Editor del proyecto Supabase.
-- Migra galerías y proyectos destacados a tarjetas, prepara Storage y
-- restringe las escrituras a usuarios Auth inscritos en public.admin_users.

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE
);

ALTER TABLE public.tarjetas
  ADD COLUMN IF NOT EXISTS orden integer;

UPDATE public.tarjetas
SET orden = 0
WHERE orden IS NULL;

ALTER TABLE public.tarjetas
  ALTER COLUMN orden SET DEFAULT 0,
  ALTER COLUMN orden SET NOT NULL;

INSERT INTO public.tarjetas (categoria, titulo, descripcion, imagen_url, orden)
SELECT seed.categoria, seed.titulo, seed.descripcion, seed.imagen_url, seed.orden
FROM (VALUES
  ('instalacion', 'Tendido de fibra óptica en terreno', 'Instalación y tendido de fibra óptica en terreno.', 'img/ins.jpg', 10),
  ('instalacion', 'Instalación y organización de fibra óptica', 'Instalación y organización de fibra óptica.', 'fotos/a1.jpeg', 20),
  ('instalacion', 'Infraestructura aérea de telecomunicaciones', 'Infraestructura aérea de telecomunicaciones.', 'fotos/cab2.jpeg', 30),
  ('instalacion', 'Infraestructura de red de fibra óptica', 'Infraestructura de red de fibra óptica.', 'fotos/b1.jpeg', 40),
  ('instalacion', 'Canalización de fibra óptica', 'Canalización de fibra óptica.', 'fotos/b2.jpeg', 50),
  ('instalacion', 'Tendido de red en terreno', 'Tendido de red de fibra óptica en terreno.', 'fotos/b3.jpeg', 60),
  ('instalacion', 'Instalación de fibra óptica en postación', 'Instalación de fibra óptica en postación.', 'fotos/cab1.jpeg', 70),
  ('instalacion', 'Terminaciones de fibra óptica', 'Terminaciones de fibra óptica.', 'fotos/a2.jpeg', 80),
  ('instalacion', 'Gabinete de telecomunicaciones', 'Gabinete de telecomunicaciones.', 'fotos/a3.jpeg', 90),
  ('fusion', 'Preparación y certificación de empalmes', 'Preparación y certificación de empalmes de fibra óptica.', 'img/fusion.png', 10),
  ('fusion', 'Bandeja de empalme de fibra óptica', 'Bandeja de empalme de fibra óptica.', 'fotos/ban1.jpeg', 20),
  ('fusion', 'Organización de fibras ópticas', 'Organización de fibras ópticas en bandeja.', 'fotos/band2.jpeg', 30),
  ('fusion', 'Detalle de fusión de fibra óptica', 'Detalle de empalme por fusión de fibra óptica.', 'fotos/band3.jpg', 40),
  ('fusion', 'Trabajo de fusión en terreno', 'Trabajo de fusión de fibra óptica en terreno.', 'fotos/foto1.jpeg', 50),
  ('fusion', 'Preparación de enlace óptico', 'Preparación de enlace óptico.', 'fotos/foto2.jpeg', 60),
  ('fusion', 'Organización de fibras en gabinete', 'Organización de fibras ópticas en gabinete.', 'fotos/a1.jpeg', 70),
  ('fusion', 'Terminaciones de fibra óptica', 'Terminaciones de fibra óptica.', 'fotos/a2.jpeg', 80),
  ('fusion', 'Panel de distribución óptica', 'Panel de distribución óptica.', 'fotos/a3.jpeg', 90),
  ('mantenimiento', 'Mantenimiento de infraestructura de fibra', 'Mantenimiento de infraestructura de fibra óptica.', 'img/repara.jpg', 10),
  ('mantenimiento', 'Inspección de red aérea', 'Inspección de red aérea de fibra óptica.', 'fotos/cab2.jpeg', 20),
  ('mantenimiento', 'Revisión de conexiones de fibra óptica', 'Revisión de conexiones de fibra óptica.', 'fotos/cab1.jpeg', 30),
  ('mantenimiento', 'Registro de trabajos de mantenimiento', 'Video de trabajos de mantenimiento de fibra óptica.', 'fotos/cab12.mp4', 40),
  ('mantenimiento', 'Infraestructura de red de fibra óptica', 'Infraestructura de red de fibra óptica.', 'fotos/b1.jpeg', 50),
  ('mantenimiento', 'Canalización de fibra óptica', 'Canalización de fibra óptica.', 'fotos/b2.jpeg', 60),
  ('mantenimiento', 'Revisión de infraestructura de red', 'Revisión de infraestructura de red.', 'fotos/b3.jpeg', 70),
  ('mantenimiento', 'Intervención de enlace óptico', 'Intervención de enlace óptico.', 'fotos/foto1.jpeg', 80),
  ('mantenimiento', 'Mantenimiento de conexiones ópticas', 'Mantenimiento de conexiones ópticas.', 'fotos/foto2.jpeg', 90),
  ('cableado', 'Organización de cableado estructurado', 'Organización de cableado estructurado.', 'img/cableado.jpg', 10),
  ('cableado', 'Rack de comunicaciones', 'Rack de comunicaciones.', 'fotos/bannertrabajos.jpeg', 20),
  ('cableado', 'Terminaciones y distribución de red', 'Terminaciones y distribución de red.', 'fotos/a2.jpeg', 30),
  ('cableado', 'Instalación en gabinete de comunicaciones', 'Instalación en gabinete de comunicaciones.', 'fotos/a1.jpeg', 40),
  ('cableado', 'Interior de tablero y conexiones', 'Interior de tablero y conexiones.', 'fotos/a3.jpeg', 50),
  ('cableado', 'Infraestructura de comunicaciones', 'Infraestructura de comunicaciones.', 'fotos/b1.jpeg', 60),
  ('cableado', 'Canalización de red', 'Canalización de red.', 'fotos/b2.jpeg', 70),
  ('cableado', 'Distribución de cableado', 'Distribución de cableado estructurado.', 'fotos/b3.jpeg', 80),
  ('cableado', 'Trabajo de instalación de red', 'Trabajo de instalación de red.', 'fotos/foto1.jpeg', 90),
  ('cableado', 'Terminaciones de telecomunicaciones', 'Terminaciones de telecomunicaciones.', 'fotos/foto2.jpeg', 100)
) AS seed(categoria, titulo, descripcion, imagen_url, orden)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.tarjetas existing
  WHERE existing.categoria = seed.categoria
    AND existing.imagen_url = seed.imagen_url
);

ALTER TABLE public.tarjetas
  ADD COLUMN IF NOT EXISTS etiqueta text,
  ADD COLUMN IF NOT EXISTS proyecto_id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS proyecto_orden integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medio_orden integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS es_proyecto boolean NOT NULL DEFAULT false;

UPDATE public.tarjetas
SET proyecto_id = gen_random_uuid()
WHERE proyecto_id IS NULL;

ALTER TABLE public.tarjetas
  ALTER COLUMN proyecto_id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN proyecto_id SET NOT NULL;

WITH project_seed AS (
  SELECT *
  FROM (VALUES
    ('empalmes', 'fusion', 'Fusión de Precisión', 'Empalme y Organización de Bandejas', 'Trabajo de fusión limpia para centro de datos corporativo.', 10, ARRAY['fotos/ban1.jpeg', 'fotos/band2.jpeg', 'fotos/band3.jpg']::text[]),
    ('odf', 'cableado', 'Armado y Conectorización', 'ODF de distribución óptica', 'Instalación de panel de terminación y distribución de fibra óptica, incorporando conectores SC/APC, pigtails y bandeja de gestión de fibras.', 20, ARRAY['fotos/b1.jpeg', 'fotos/b2.jpeg', 'fotos/b3.jpeg']::text[]),
    ('industrial', 'instalacion', 'Tendido Subterráneo y Fusión', 'Red de Fibra Óptica Industrial', 'Fusión de precisión y conectorización de fibra óptica en túneles e infraestructura subterránea.', 30, ARRAY['fotos/a1.jpeg', 'fotos/a2.jpeg', 'fotos/a3.jpeg']::text[]),
    ('mantenimiento-aereo', 'mantenimiento', 'Mantención de enlaces en postación aérea', 'Diagnóstico y Reparación de Enlaces', 'Servicio especializado de mantenimiento preventivo y correctivo de enlaces de telecomunicaciones instalados en postación aérea.', 40, ARRAY['fotos/cab12.mp4', 'fotos/cab2.jpeg', 'fotos/cab1.jpeg']::text[]),
    ('lauchado-subterraneo', 'lauchado', 'Lauchado de ductos', 'Lauchado de Ductos subterráneos', 'Trabajo de sondeado y lauchado en canalizaciones subterráneas para la verificación de rutas y posterior tendido de redes de telecomunicaciones.', 50, ARRAY['fotos/lauchadovideo.mp4', 'fotos/lauchado1.jpeg', 'fotos/lauchado2.jpeg', 'fotos/lauchado3.jpeg', 'fotos/lauchado4.jpeg']::text[]),
    ('certificacion', 'fusion', 'Certificación Óptica', 'Medición y Validación de Enlaces', 'Medición de pérdidas mediante OTDR y Powermeter, con validación del rendimiento de enlaces ópticos instalados.', 60, ARRAY['img/fusion.png', 'fotos/band2.jpeg', 'img/cableado.jpg']::text[])
  ) AS projects(project_key, categoria, etiqueta, titulo, descripcion, project_order, media_paths)
),
project_media AS (
  SELECT
    (md5('bertel-project-' || project_key))::uuid AS proyecto_id,
    categoria,
    etiqueta,
    titulo,
    descripcion,
    project_order,
    media_path,
    media_ordinality::integer - 1 AS media_order
  FROM project_seed
  CROSS JOIN LATERAL unnest(media_paths) WITH ORDINALITY AS media(media_path, media_ordinality)
)
INSERT INTO public.tarjetas (
  categoria, etiqueta, titulo, descripcion, imagen_url, proyecto_id,
  proyecto_orden, medio_orden, orden, es_proyecto
)
SELECT
  seed.categoria, seed.etiqueta, seed.titulo, seed.descripcion, seed.media_path,
  seed.proyecto_id, seed.project_order, seed.media_order, seed.media_order, true
FROM project_media AS seed
WHERE NOT EXISTS (
  SELECT 1
  FROM public.tarjetas existing
  WHERE existing.proyecto_id = seed.proyecto_id
    AND existing.imagen_url = seed.media_path
    AND existing.es_proyecto = true
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'imagenes-proyectos',
  'imagenes-proyectos',
  true,
  52428800,
  ARRAY['image/*', 'video/*']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Se reemplazan las políticas de estas dos tablas para impedir que cualquier
-- usuario no autorizado conserve permisos de escritura anteriores.
DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('tarjetas', 'admin_users')
  LOOP
    EXECUTE format(
      'DROP POLICY %I ON public.%I',
      policy_record.policyname,
      policy_record.tablename
    );
  END LOOP;
END
$$;

ALTER TABLE public.tarjetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE public.tarjetas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.tarjetas TO authenticated;
REVOKE ALL ON TABLE public.admin_users FROM anon, authenticated;
GRANT SELECT ON TABLE public.admin_users TO authenticated;

DO $$
DECLARE
  tarjetas_sequence text;
BEGIN
  tarjetas_sequence := pg_get_serial_sequence('public.tarjetas', 'id');
  IF tarjetas_sequence IS NOT NULL THEN
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO authenticated', tarjetas_sequence);
  END IF;
END
$$;

CREATE POLICY tarjetas_public_read
  ON public.tarjetas FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY tarjetas_admin_insert
  ON public.tarjetas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY tarjetas_admin_update
  ON public.tarjetas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY tarjetas_admin_delete
  ON public.tarjetas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY admin_users_read_self
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS bertel_project_media_public_read ON storage.objects;
DROP POLICY IF EXISTS bertel_project_media_admin_insert ON storage.objects;
DROP POLICY IF EXISTS bertel_project_media_admin_update ON storage.objects;
DROP POLICY IF EXISTS bertel_project_media_admin_delete ON storage.objects;

CREATE POLICY bertel_project_media_public_read
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'imagenes-proyectos');

CREATE POLICY bertel_project_media_admin_insert
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'imagenes-proyectos'
    AND EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY bertel_project_media_admin_update
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'imagenes-proyectos'
    AND EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    bucket_id = 'imagenes-proyectos'
    AND EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY bertel_project_media_admin_delete
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'imagenes-proyectos'
    AND EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.user_id = (SELECT auth.uid())
    )
  );

-- Después de crear la cuenta administradora en Authentication > Users,
-- reemplace el correo de ejemplo y ejecute este fragmento por separado:
--
-- INSERT INTO public.admin_users (user_id)
-- SELECT id FROM auth.users WHERE lower(email) = lower('admin@bertelspa.cl')
-- ON CONFLICT (user_id) DO NOTHING;
