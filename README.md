# Tarjetas digitales — TecnoAlquimia

Plataforma multi-cliente de tarjetas de contacto digitales con QR y vCard.
Cada empresa tiene su panel de administración y cada persona su tarjeta
pública en `/c/<empresa>/<persona>`.

## 1. Crear el proyecto en Supabase

1. Ve a https://supabase.com y crea un proyecto nuevo.
2. Entra a **SQL Editor** y ejecuta el contenido de `schema.sql`.
3. Ve a **Storage** y crea un bucket llamado `tarjetas`, márcalo como **público**.
4. Ve a **Authentication > Users** y crea el primer usuario admin
   (correo + contraseña) — este será tu login del panel.
5. Ve a **Table Editor > empresas** y crea tu primera empresa
   (ej. `Full Agro Millenium`, slug `fullagro`).
6. Ve a **Table Editor > usuarios_admin** e inserta una fila que vincule
   el `user_id` del usuario que creaste en el paso 4 con el `id` de la
   empresa del paso 5.
7. Ve a **Project Settings > API** y copia la `Project URL` y la
   `anon public key`.

## 2. Configurar el proyecto localmente

```bash
npm install
cp .env.example .env
```

Edita `.env` y pega tu URL y anon key de Supabase.

```bash
npm run dev
```

Abre `http://localhost:5173/login` e inicia sesión con el usuario admin.

## 3. Uso

- **`/login`** — inicio de sesión del panel.
- **`/admin`** — lista de tarjetas de tu empresa, crear/editar/eliminar,
  subir foto, ver el QR de cada persona (con los datos ya incluidos,
  funciona sin internet al escanear).
- **`/c/<empresa>/<persona>`** — la tarjeta pública que ve quien escanea
  el QR, con botón "Guardar contacto".

## 4. Publicar

Sube este proyecto a Vercel o Netlify (build command `npm run build`,
output folder `dist`), y agrega ahí las mismas variables de entorno del
`.env`. El dominio que te den (o uno propio que conectes) es el que va
en los QR.

## 5. Agregar una nueva empresa cliente

1. Crea la fila en `empresas` (nombre, slug, logo, colores).
2. Crea el usuario admin en Authentication.
3. Vincúlalo en `usuarios_admin`.
4. Ese cliente ya puede entrar a `/login` y gestionar sus propias tarjetas,
   sin ver las de otras empresas (las políticas de seguridad de Supabase
   ya lo aíslan).
