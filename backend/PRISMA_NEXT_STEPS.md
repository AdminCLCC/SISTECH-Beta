# Prisma next steps

1. Install dependencies:
   - `npm install`
2. Generate Prisma client:
   - `npm run prisma:generate`
3. Create and apply migration for spare parts, inventory and costs:
   - `npx prisma migrate dev --name spare_parts_inventory_costs`
4. Seed base catalogs and admin user:
   - `npm run prisma:seed`
5. Start backend:
   - `npm run start:dev`

## Included seed data
- base work order statuses
- base service types
- base process stages
- inventory movement types
- default spare part type
- sample spare part
- admin user
