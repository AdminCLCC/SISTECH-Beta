# Backend INGENIK

Backend NestJS preparado para despliegue en Render y conexión a PostgreSQL/Supabase mediante Prisma.

## Módulos incluidos
- Auth
- Users
- Health
- Work Orders
- Assignments
- Diagnoses
- Stage Times
- Closures
- Spare Parts
- Inventory
- Costs

## Arranque
1. Copiar `.env.example` a `.env`
2. Instalar dependencias: `npm install`
3. Generar cliente Prisma: `npm run prisma:generate`
4. Crear/aplicar migración: `npx prisma migrate dev --name spare_parts_inventory_costs`
5. Ejecutar seed: `npm run prisma:seed`
6. Iniciar en desarrollo: `npm run start:dev`

## Comentarios
- `work_orders` se mantiene como encabezado operativo.
- El consolidado oficial de costos vive en `work_order_costs`.
- El stock visible de repuestos vive en `spare_parts.current_stock`, pero debe mantenerse consistente con `inventory_movements`.
- El consumo de repuestos desde una orden genera salida de inventario automáticamente.
