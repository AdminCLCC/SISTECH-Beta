# INGENIK Frontend funcional inicial

Frontend base en Next.js para consumir el backend NestJS del sistema INGENIK.

## Incluye
- login con JWT
- almacenamiento simple de sesión en localStorage
- protección básica de rutas
- panel técnico
- panel jefe de taller
- panel gerencia de operaciones
- estructura lista para conectar a endpoints reales

## Variables de entorno
Copiar `.env.example` a `.env.local`

```bash
cp .env.example .env.local
```

## Desarrollo
```bash
npm install
npm run dev
```

## URL esperada del backend
`NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`

## Nota
Este frontend ya se puede desplegar en Vercel. La siguiente mejora natural es conectar los dashboards y formularios a los endpoints reales de órdenes, asignaciones, diagnósticos, tiempos y repuestos.
