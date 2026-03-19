import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [adminRole, technicianRole] = await Promise.all([
    prisma.role.upsert({ where: { code: 'ADMIN' }, update: {}, create: { code: 'ADMIN', name: 'Administrador' } }),
    prisma.role.upsert({ where: { code: 'TECHNICIAN' }, update: {}, create: { code: 'TECHNICIAN', name: 'Técnico' } }),
  ]);

  await Promise.all([
    prisma.workOrderStatus.upsert({ where: { code: 'INGRESADA' }, update: {}, create: { code: 'INGRESADA', name: 'Ingresada' } }),
    prisma.workOrderStatus.upsert({ where: { code: 'EN_DIAGNOSTICO' }, update: {}, create: { code: 'EN_DIAGNOSTICO', name: 'En diagnóstico' } }),
    prisma.workOrderStatus.upsert({ where: { code: 'PENDIENTE_REPUESTO' }, update: {}, create: { code: 'PENDIENTE_REPUESTO', name: 'Pendiente de repuesto' } }),
    prisma.workOrderStatus.upsert({ where: { code: 'EN_REPARACION' }, update: {}, create: { code: 'EN_REPARACION', name: 'En reparación' } }),
    prisma.workOrderStatus.upsert({ where: { code: 'EN_PRUEBA' }, update: {}, create: { code: 'EN_PRUEBA', name: 'En prueba' } }),
    prisma.workOrderStatus.upsert({ where: { code: 'LISTA_CIERRE' }, update: {}, create: { code: 'LISTA_CIERRE', name: 'Lista para cierre' } }),
    prisma.workOrderStatus.upsert({ where: { code: 'CERRADA' }, update: {}, create: { code: 'CERRADA', name: 'Cerrada', isFinal: true } }),
    prisma.priority.upsert({ where: { code: 'NORMAL' }, update: {}, create: { code: 'NORMAL', name: 'Normal', weight: 1 } }),
    prisma.priority.upsert({ where: { code: 'ALTA' }, update: {}, create: { code: 'ALTA', name: 'Alta', weight: 2 } }),
    prisma.serviceType.upsert({ where: { code: 'REPARACION' }, update: {}, create: { code: 'REPARACION', name: 'Reparación' } }),
    prisma.serviceType.upsert({ where: { code: 'ENSAMBLAJE' }, update: {}, create: { code: 'ENSAMBLAJE', name: 'Ensamblaje' } }),
    prisma.processStage.upsert({ where: { code: 'DIAGNOSTICO' }, update: {}, create: { code: 'DIAGNOSTICO', name: 'Diagnóstico', sortOrder: 1 } }),
    prisma.processStage.upsert({ where: { code: 'REPARACION' }, update: {}, create: { code: 'REPARACION', name: 'Reparación', sortOrder: 2 } }),
    prisma.processStage.upsert({ where: { code: 'PRUEBA' }, update: {}, create: { code: 'PRUEBA', name: 'Prueba', sortOrder: 3 } }),
    prisma.processStage.upsert({ where: { code: 'ENTREGA' }, update: {}, create: { code: 'ENTREGA', name: 'Entrega', sortOrder: 4 } }),
    prisma.inventoryMovementType.upsert({ where: { code: 'ENTRY' }, update: {}, create: { code: 'ENTRY', name: 'Entrada', affectsStockSign: 1 } }),
    prisma.inventoryMovementType.upsert({ where: { code: 'OUTPUT' }, update: {}, create: { code: 'OUTPUT', name: 'Salida', affectsStockSign: -1 } }),
    prisma.inventoryMovementType.upsert({ where: { code: 'ADJUSTMENT_POSITIVE' }, update: {}, create: { code: 'ADJUSTMENT_POSITIVE', name: 'Ajuste positivo', affectsStockSign: 1 } }),
    prisma.inventoryMovementType.upsert({ where: { code: 'ADJUSTMENT_NEGATIVE' }, update: {}, create: { code: 'ADJUSTMENT_NEGATIVE', name: 'Ajuste negativo', affectsStockSign: -1 } }),
    prisma.sparePartType.upsert({ where: { code: 'GENERAL' }, update: {}, create: { code: 'GENERAL', name: 'General' } }),
    prisma.brand.upsert({ where: { name: 'Marca Prueba' }, update: {}, create: { name: 'Marca Prueba' } }),
    prisma.damageType.upsert({ where: { code: 'DANO001' }, update: {}, create: { code: 'DANO001', name: 'Falla de encendido' } }),
    prisma.nonRepairableReason.upsert({ where: { code: 'NR001' }, update: {}, create: { code: 'NR001', name: 'No tiene reparación económica' } }),
  ]);

  const generalType = await prisma.sparePartType.findUniqueOrThrow({ where: { code: 'GENERAL' } });
  await prisma.sparePart.upsert({
    where: { code: 'REP-0001' },
    update: {},
    create: {
      sparePartTypeId: generalType.id,
      code: 'REP-0001',
      name: 'Repuesto genérico de prueba',
      unitMeasure: 'unidad',
      standardCost: 10,
      minimumStock: 2,
      currentStock: 10,
    },
  });

  const technician = await prisma.technician.upsert({
    where: { code: 'TEC-001' },
    update: { isAvailable: true, isActive: true },
    create: {
      code: 'TEC-001',
      firstName: 'Tecnico',
      lastName: 'Prueba',
      email: 'tecnico1@ingenik.local',
      phone: '0999999999',
      isAvailable: true,
      isActive: true,
    },
  });

  const passwordHash = await bcrypt.hash('Admin123*', 10);
  await prisma.user.upsert({
    where: { email: 'admin@ingenik.local' },
    update: { passwordHash, roleId: adminRole.id, technicianId: technician.id },
    create: {
      firstName: 'Admin',
      lastName: 'Ingenik',
      email: 'admin@ingenik.local',
      passwordHash,
      roleId: adminRole.id,
      technicianId: technician.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'tecnico1@ingenik.local' },
    update: { passwordHash, roleId: technicianRole.id, technicianId: technician.id },
    create: {
      firstName: 'Tecnico',
      lastName: 'Prueba',
      email: 'tecnico1@ingenik.local',
      passwordHash,
      roleId: technicianRole.id,
      technicianId: technician.id,
    },
  });

  const customer = await prisma.customer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      fullName: 'Cliente Prueba INGENIK',
      identificationType: 'CEDULA',
      identificationNumber: '1234567890',
      phone: '0999999999',
      email: 'clienteprueba@ingenik.local',
      address: 'Quito',
      customerType: 'EXTERNO',
    },
  }).catch(async () => {
    const found = await prisma.customer.findFirst({ where: { identificationNumber: '1234567890' } });
    if (found) return found;
    return prisma.customer.create({ data: {
      fullName: 'Cliente Prueba INGENIK',
      identificationType: 'CEDULA',
      identificationNumber: '1234567890',
      phone: '0999999999',
      email: 'clienteprueba@ingenik.local',
      address: 'Quito',
      customerType: 'EXTERNO',
    } });
  });

  const brand = await prisma.brand.findUniqueOrThrow({ where: { name: 'Marca Prueba' } });
  const asset = await prisma.asset.findFirst({ where: { serialNumber: 'SERIE-PRUEBA-001' } }) ?? await prisma.asset.create({
    data: {
      customerId: customer.id,
      category: 'ELECTRODOMESTICO',
      subcategory: 'LICUADORA',
      brandId: brand.id,
      model: 'Modelo Prueba',
      serialNumber: 'SERIE-PRUEBA-001',
      accessories: 'Cable de prueba',
      physicalCondition: 'Buen estado',
      notes: 'Activo de prueba autogenerado por seed',
    },
  });

  const ingStatus = await prisma.workOrderStatus.findUniqueOrThrow({ where: { code: 'INGRESADA' } });
  const serviceType = await prisma.serviceType.findUniqueOrThrow({ where: { code: 'REPARACION' } });
  const priority = await prisma.priority.findUniqueOrThrow({ where: { code: 'NORMAL' } });

  const existingOrder = await prisma.workOrder.findUnique({ where: { orderNumber: 'OT-000001' } });
  if (!existingOrder) {
    await prisma.workOrder.create({
      data: {
        orderNumber: 'OT-000001',
        customerId: customer.id,
        assetId: asset.id,
        serviceTypeId: serviceType.id,
        priorityId: priority.id,
        currentStatusId: ingStatus.id,
        assignedTechnicianId: technician.id,
        createdByUserId: 1,
        initialProblemDescription: 'Prueba inicial autogenerada por seed',
      },
    });
  }
}

main().finally(async () => prisma.$disconnect());
