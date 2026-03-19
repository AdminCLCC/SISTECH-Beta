# INGENIK Fullstack Deploy Ready

Este proyecto queda preparado para ejecutarse localmente y desplegarse con:
- **Frontend:** Vercel
- **Backend:** Render
- **Base de datos:** Supabase PostgreSQL

## Correcciones aplicadas
- Se corrigió el `.env.example` del frontend para que apunte a `http://localhost:4000/api/v1`.
- Se agregó `render.yaml` para desplegar el backend en Render.
- Se agregó `frontend/vercel.json` para el despliegue del frontend en Vercel.
- Se agregó `backend/.env.render.example` con un ejemplo listo para producción.
- Se centralizó la guía de despliegue en `DEPLOY_GUIDE.md`.

## Estructura
- `backend/`: NestJS + Prisma + PostgreSQL
- `frontend/`: Next.js
- `docker-compose.yml`: ejecución local
- `render.yaml`: despliegue del backend en Render
- `DEPLOY_GUIDE.md`: guía paso a paso de despliegue

## Ejecución local sin Docker
### Backend
1. Copiar `backend/.env.example` a `backend/.env`
2. Ajustar `DATABASE_URL`
3. Ejecutar:
   - `npm install`
   - `npm run prisma:generate`
   - `npx prisma migrate dev --name init`
   - `npm run prisma:seed`
   - `npm run start:dev`

### Frontend
1. Copiar `frontend/.env.example` a `frontend/.env.local`
2. Ejecutar:
   - `npm install`
   - `npm run dev`

## Ejecución local con Docker
Desde la raíz:
- `docker compose up --build`

Servicios esperados:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000/api/v1`
- Swagger: `http://localhost:4000/docs`
- PostgreSQL: `localhost:5432`

## Usuario semilla sugerido
- correo: `admin@ingenik.local`
- contraseña: `Admin123*`

## Estado actual
Esta base incluye:
- Auth
- Users
- Work Orders
- Assignments
- Diagnoses
- Stage Times
- Status History
- Closures
- Spare Parts
- Inventory
- Costs
- Frontend con login, panel técnico, jefe de taller y gerencia

## Siguiente objetivo
Subir el repositorio a GitHub y desplegar:
- el frontend en Vercel,
- el backend en Render,
- la base en Supabase.
