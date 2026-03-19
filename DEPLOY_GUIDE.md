# Guía de despliegue

## 1. Base de datos en Supabase
1. Crear un proyecto nuevo en Supabase.
2. Abrir la sección **Connect** en el dashboard.
3. Copiar una cadena de conexión PostgreSQL compatible con Prisma.
4. Colocarla en `DATABASE_URL` del backend.

### Recomendación
Para despliegues iniciales, usar la cadena de conexión pooler si el entorno lo requiere.

## 2. Backend en Render
1. Subir este proyecto a GitHub.
2. En Render, crear un **Blueprint** o un **Web Service** nuevo.
3. Seleccionar el repositorio.
4. Confirmar que el servicio use:
   - `rootDir=backend`
   - `buildCommand=npm install && npm run prisma:generate && npm run build`
   - `startCommand=npm run prisma:migrate:deploy && npm run start`
5. Definir variables de entorno:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `FRONTEND_URL`
   - `NODE_ENV=production`
   - `PORT=10000`
6. Desplegar.
7. Verificar:
   - `/api/v1/health`
   - `/docs`

## 3. Frontend en Vercel
1. En Vercel, importar el mismo repositorio.
2. Elegir `frontend` como **Root Directory**.
3. Definir variable:
   - `NEXT_PUBLIC_API_URL=https://TU-BACKEND.onrender.com/api/v1`
4. Desplegar.
5. Verificar acceso y login.

## 4. Ajuste final de CORS
Una vez desplegado el frontend:
1. Copiar la URL pública de Vercel.
2. Actualizar `FRONTEND_URL` en Render con esa URL.
3. Volver a desplegar el backend si es necesario.

## 5. Comandos útiles
### Backend
- `npm run prisma:generate`
- `npm run prisma:migrate:deploy`
- `npm run prisma:seed`
- `npm run build`
- `npm run start`

### Frontend
- `npm run build`
- `npm run start`

## 6. Checklist mínimo antes de publicar
- variables de entorno completas
- migraciones aplicadas
- seed ejecutado
- backend respondiendo en `/api/v1/health`
- Swagger visible en `/docs`
- frontend autenticando contra el backend
