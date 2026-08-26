-- =========================================================
-- Esquema para la plataforma de tarjetas digitales
-- Ejecutar en el SQL Editor de Supabase
-- =========================================================

create extension if not exists "pgcrypto";

-- --------------------------------------------------------
-- Tabla: empresas (clientes de TecnoAlquimia)
-- --------------------------------------------------------
create table if not exists empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,          -- ej: 'fullagro'  -> usado en URLs
  logo_url text,
  color_primario text default '#2C5F3D',
  color_acento text default '#D9A441',
  creado_en timestamptz default now()
);

-- --------------------------------------------------------
-- Tabla: personas (cada tarjeta digital)
-- --------------------------------------------------------
create table if not exists personas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  slug text not null,                 -- ej: 'alberto-vasquez' -> /c/fullagro/alberto-vasquez
  nombre text not null,
  cargo text,
  celular text,
  correo text,
  whatsapp text,
  foto_url text,
  activo boolean default true,
  creado_en timestamptz default now(),
  unique (empresa_id, slug)
);

-- --------------------------------------------------------
-- Tabla: usuarios_admin (quién puede editar cada empresa)
-- Vincula un usuario de Supabase Auth con una empresa
-- --------------------------------------------------------
create table if not exists usuarios_admin (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  rol text default 'admin',           -- 'admin' | 'super_admin' (tú, TecnoAlquimia)
  unique (user_id, empresa_id)
);

-- --------------------------------------------------------
-- Row Level Security
-- --------------------------------------------------------
alter table empresas enable row level security;
alter table personas enable row level security;
alter table usuarios_admin enable row level security;

-- Lectura pública: cualquiera puede ver empresas y personas activas
-- (necesario para que la tarjeta pública funcione sin login)
create policy "empresas_lectura_publica"
  on empresas for select
  using (true);

create policy "personas_lectura_publica"
  on personas for select
  using (activo = true);

-- Escritura: solo un admin vinculado a esa empresa puede editar sus personas
create policy "personas_admin_insert"
  on personas for insert
  with check (
    exists (
      select 1 from usuarios_admin ua
      where ua.user_id = auth.uid() and ua.empresa_id = personas.empresa_id
    )
  );

create policy "personas_admin_update"
  on personas for update
  using (
    exists (
      select 1 from usuarios_admin ua
      where ua.user_id = auth.uid() and ua.empresa_id = personas.empresa_id
    )
  );

create policy "personas_admin_delete"
  on personas for delete
  using (
    exists (
      select 1 from usuarios_admin ua
      where ua.user_id = auth.uid() and ua.empresa_id = personas.empresa_id
    )
  );

-- Un admin puede ver su propia fila en usuarios_admin
create policy "usuarios_admin_lectura_propia"
  on usuarios_admin for select
  using (user_id = auth.uid());

-- --------------------------------------------------------
-- Storage: bucket para fotos y logos (crear desde el panel
-- de Supabase > Storage > New bucket, nombre: "tarjetas", público)
-- --------------------------------------------------------

-- =========================================================
-- Políticas de Storage para el bucket "tarjetas"
-- Ejecutar en el SQL Editor de Supabase (después de crear el bucket)
-- =========================================================

-- Cualquiera puede LEER los archivos (fotos/logos) del bucket
create policy "tarjetas_storage_lectura_publica"
  on storage.objects for select
  using (bucket_id = 'tarjetas');

-- Solo un usuario autenticado que sea admin de ALGUNA empresa
-- puede subir archivos al bucket
create policy "tarjetas_storage_insert_admins"
  on storage.objects for insert
  with check (
    bucket_id = 'tarjetas'
    and exists (
      select 1 from usuarios_admin ua where ua.user_id = auth.uid()
    )
  );

-- Y también puede reemplazar/actualizar archivos existentes
create policy "tarjetas_storage_update_admins"
  on storage.objects for update
  using (
    bucket_id = 'tarjetas'
    and exists (
      select 1 from usuarios_admin ua where ua.user_id = auth.uid()
    )
  );

-- Y eliminarlos si hace falta
create policy "tarjetas_storage_delete_admins"
  on storage.objects for delete
  using (
    bucket_id = 'tarjetas'
    and exists (
      select 1 from usuarios_admin ua where ua.user_id = auth.uid()
    )
  );

-- =========================================================
-- Falta este permiso: dejar que un admin actualice los datos
-- de SU empresa (nombre, logo, colores)
-- Ejecutar en el SQL Editor de Supabase
-- =========================================================

create policy "empresas_admin_update"
  on empresas for update
  using (
    exists (
      select 1 from usuarios_admin ua
      where ua.user_id = auth.uid() and ua.empresa_id = empresas.id
    )
  );


-- =========================================================
-- Migración: ubicación de oficina por empresa
-- Ejecutar en el SQL Editor de Supabase
-- =========================================================

alter table empresas add column if not exists ubicacion_url text;
alter table empresas add column if not exists ubicacion_texto text;

-- Ejemplo para cargar el dato de Full Agro Millenium S.R.L.
-- (podés hacerlo también desde el nuevo formulario en el Dashboard)
-- update empresas
-- set ubicacion_url = 'https://maps.app.goo.gl/KEDHnpXuXWLDijA17',
--     ubicacion_texto = 'Zona Este, Santa Cruz, Bolivia'
-- where slug = 'fullagro';