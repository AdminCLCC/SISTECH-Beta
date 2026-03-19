import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ListInventoryMovementsQueryDto } from './dto/list-inventory-movements-query.dto';
import { CreateInventoryEntryDto } from './dto/create-inventory-entry.dto';
import { CreateInventoryAdjustmentDto } from './dto/create-inventory-adjustment.dto';
import { CreateInventoryOutputDto } from './dto/create-inventory-output.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async listMovements(query: ListInventoryMovementsQueryDto) {
    const take = query.take ?? 20;
    const page = query.page ?? 1;
    const data = await this.prisma.inventoryMovement.findMany({
      where: {
        sparePartId: query.sparePartId,
        workOrderId: query.workOrderId,
        inventoryMovementType: query.movementTypeCode ? { is: { code: query.movementTypeCode } } : undefined,
      },
      include: {
        sparePart: { select: { id: true, code: true, name: true } },
        inventoryMovementType: { select: { id: true, code: true, name: true } },
        movedByUser: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { movedAt: 'desc' },
      take,
      skip: (page - 1) * take,
    });
    return { success: true, data, meta: { page, take } };
  }

  async createEntry(dto: CreateInventoryEntryDto, userId: number) {
    return this.createMovement('ENTRY', dto.sparePartId, dto.quantity, userId, {
      unitCost: dto.unitCost,
      referenceDocument: dto.referenceDocument,
      notes: dto.notes,
    });
  }

  async createAdjustment(dto: CreateInventoryAdjustmentDto, userId: number) {
    return this.createMovement(dto.movementTypeCode, dto.sparePartId, dto.quantity, userId, {
      unitCost: dto.unitCost,
      referenceDocument: dto.referenceDocument,
      notes: dto.notes,
    });
  }

  async createOutput(dto: CreateInventoryOutputDto, userId: number) {
    if (dto.workOrderId) {
      const workOrder = await this.prisma.workOrder.findUnique({ where: { id: dto.workOrderId }, select: { id: true } });
      if (!workOrder) throw new BadRequestException('Orden inválida');
    }
    return this.createMovement('OUTPUT', dto.sparePartId, dto.quantity, userId, {
      unitCost: dto.unitCost,
      referenceDocument: dto.referenceDocument,
      notes: dto.notes,
      workOrderId: dto.workOrderId,
    });
  }

  async status() {
    const items = await this.prisma.sparePart.findMany({
      include: { sparePartType: { select: { id: true, code: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    const summary = {
      totalItems: items.length,
      belowMinimum: items.filter((item) => Number(item.currentStock) <= Number(item.minimumStock)).length,
      totalStockValue: items.reduce((acc, item) => acc + Number(item.currentStock) * Number(item.standardCost ?? 0), 0),
    };
    return { success: true, data: { summary, items } };
  }

  private async createMovement(
    movementTypeCode: 'ENTRY' | 'OUTPUT' | 'ADJUSTMENT_POSITIVE' | 'ADJUSTMENT_NEGATIVE',
    sparePartId: number,
    quantity: number,
    userId: number,
    extra: { unitCost?: number; referenceDocument?: string; notes?: string; workOrderId?: number },
  ) {
    const sparePart = await this.prisma.sparePart.findUnique({ where: { id: sparePartId } });
    if (!sparePart) throw new NotFoundException('Repuesto no encontrado');

    const movementType = await this.prisma.inventoryMovementType.findFirst({ where: { code: movementTypeCode } });
    if (!movementType) throw new BadRequestException(`Tipo de movimiento ${movementTypeCode} no configurado`);

    const signedDelta = movementType.affectsStockSign * quantity;
    const currentStock = Number(sparePart.currentStock);
    const newStock = currentStock + signedDelta;
    if (newStock < 0) throw new BadRequestException('El movimiento dejaría stock negativo');

    const data = await this.prisma.$transaction(async (tx) => {
      const movement = await tx.inventoryMovement.create({
        data: {
          sparePartId,
          inventoryMovementTypeId: movementType.id,
          workOrderId: extra.workOrderId,
          quantity,
          unitCost: extra.unitCost ?? sparePart.standardCost,
          referenceDocument: extra.referenceDocument,
          notes: extra.notes,
          movedByUserId: userId,
        },
      });
      await tx.sparePart.update({
        where: { id: sparePartId },
        data: { currentStock: newStock },
      });
      return movement;
    });

    return { success: true, message: 'Movimiento registrado correctamente', data };
  }
}
