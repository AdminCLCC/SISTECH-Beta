import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';
import { ListSparePartsQueryDto } from './dto/list-spare-parts-query.dto';
import { CreateWorkOrderSparePartDto } from './dto/create-work-order-spare-part.dto';
import { UpdateWorkOrderSparePartDto } from './dto/update-work-order-spare-part.dto';

@Injectable()
export class SparePartsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListSparePartsQueryDto) {
    const take = query.take ?? 20;
    const page = query.page ?? 1;
    let data = await this.prisma.sparePart.findMany({
      where: {
        sparePartTypeId: query.sparePartTypeId,
        OR: query.search
          ? [
              { code: { contains: query.search, mode: 'insensitive' } },
              { name: { contains: query.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: { sparePartType: { select: { id: true, code: true, name: true } } },
      orderBy: { name: 'asc' },
      take,
      skip: (page - 1) * take,
    });
    if (query.belowMinimum) {
      data = data.filter((item) => Number(item.currentStock) <= Number(item.minimumStock));
    }

    const total = await this.prisma.sparePart.count({
      where: {
        sparePartTypeId: query.sparePartTypeId,
        OR: query.search
          ? [
              { code: { contains: query.search, mode: 'insensitive' } },
              { name: { contains: query.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
    });
    return { success: true, data, meta: { page, take, total } };
  }

  async findOne(id: number) {
    const data = await this.prisma.sparePart.findUnique({
      where: { id },
      include: { sparePartType: true },
    });
    if (!data) throw new NotFoundException('Repuesto no encontrado');
    return { success: true, data };
  }

  async create(dto: CreateSparePartDto) {
    if (dto.sparePartTypeId) await this.ensureSparePartTypeExists(dto.sparePartTypeId);
    const exists = await this.prisma.sparePart.findUnique({ where: { code: dto.code } });
    if (exists) throw new BadRequestException('Ya existe un repuesto con ese código');

    const data = await this.prisma.sparePart.create({
      data: {
        sparePartTypeId: dto.sparePartTypeId,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        unitMeasure: dto.unitMeasure,
        standardCost: dto.standardCost,
        minimumStock: dto.minimumStock ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
    return { success: true, message: 'Repuesto creado correctamente', data };
  }

  async update(id: number, dto: UpdateSparePartDto) {
    await this.ensureSparePartExists(id);
    if (dto.sparePartTypeId) await this.ensureSparePartTypeExists(dto.sparePartTypeId);
    if (dto.code) {
      const exists = await this.prisma.sparePart.findFirst({ where: { code: dto.code.trim().toUpperCase(), NOT: { id } } } as any);
      if (exists) throw new BadRequestException('Ya existe un repuesto con ese código');
    }

    const data = await this.prisma.sparePart.update({
      where: { id },
      data: {
        sparePartTypeId: dto.sparePartTypeId,
        code: dto.code?.trim().toUpperCase(),
        name: dto.name?.trim(),
        unitMeasure: dto.unitMeasure,
        standardCost: dto.standardCost,
        minimumStock: dto.minimumStock,
        isActive: dto.isActive,
      },
    });
    return { success: true, message: 'Repuesto actualizado correctamente', data };
  }

  async listForWorkOrder(workOrderId: number) {
    await this.ensureWorkOrderExists(workOrderId);
    const data = await this.prisma.workOrderSparePart.findMany({
      where: { workOrderId },
      include: {
        sparePart: { select: { id: true, code: true, name: true, unitMeasure: true } },
        technician: { select: { id: true, code: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return { success: true, data };
  }

  async addToWorkOrder(workOrderId: number, dto: CreateWorkOrderSparePartDto, userId: number) {
    await this.ensureWorkOrderExists(workOrderId);
    const sparePart = await this.ensureSparePartExists(dto.sparePartId);
    if (dto.technicianId) await this.ensureTechnicianExists(dto.technicianId);

    const unitCost = dto.unitCost ?? Number(sparePart.standardCost ?? 0);
    const totalCost = unitCost * dto.quantity;

    const line = await this.prisma.$transaction(async (tx) => {
      const created = await tx.workOrderSparePart.create({
        data: {
          workOrderId,
          sparePartId: dto.sparePartId,
          technicianId: dto.technicianId,
          lineType: dto.lineType,
          quantity: dto.quantity,
          unitCost,
          totalCost,
          notes: dto.notes,
        },
      });

      if (dto.lineType === 'consumed') {
        const movementType = await tx.inventoryMovementType.findFirst({ where: { code: 'OUTPUT' } });
        if (!movementType) throw new BadRequestException('No existe el tipo de movimiento OUTPUT');
        const current = Number(sparePart.currentStock);
        if (current < dto.quantity) throw new BadRequestException('Stock insuficiente para consumir el repuesto');

        await tx.inventoryMovement.create({
          data: {
            sparePartId: dto.sparePartId,
            inventoryMovementTypeId: movementType.id,
            workOrderId,
            quantity: dto.quantity,
            unitCost,
            notes: dto.notes ?? 'Consumo desde orden de trabajo',
            movedByUserId: userId,
          },
        });
        await tx.sparePart.update({
          where: { id: dto.sparePartId },
          data: { currentStock: { decrement: dto.quantity } },
        });
      }

      return created;
    });

    return { success: true, message: 'Línea de repuesto registrada', data: line };
  }

  async updateWorkOrderLine(workOrderId: number, lineId: number, dto: UpdateWorkOrderSparePartDto) {
    const line = await this.prisma.workOrderSparePart.findUnique({ where: { id: lineId } });
    if (!line || line.workOrderId !== workOrderId) throw new NotFoundException('Línea de repuesto no encontrada');
    if (line.lineType === 'consumed') throw new BadRequestException('No se permite editar líneas consumidas directamente. Registre un ajuste de inventario y una nueva línea.');
    if (dto.sparePartId) await this.ensureSparePartExists(dto.sparePartId);
    if (dto.technicianId) await this.ensureTechnicianExists(dto.technicianId);

    const unitCost = dto.unitCost ?? Number(line.unitCost ?? 0);
    const quantity = dto.quantity ?? Number(line.quantity);
    const totalCost = unitCost * quantity;

    const data = await this.prisma.workOrderSparePart.update({
      where: { id: lineId },
      data: {
        sparePartId: dto.sparePartId,
        technicianId: dto.technicianId,
        lineType: dto.lineType,
        quantity,
        unitCost,
        totalCost,
        notes: dto.notes,
      },
    });
    return { success: true, message: 'Línea actualizada correctamente', data };
  }

  async removeWorkOrderLine(workOrderId: number, lineId: number) {
    const line = await this.prisma.workOrderSparePart.findUnique({ where: { id: lineId } });
    if (!line || line.workOrderId !== workOrderId) throw new NotFoundException('Línea de repuesto no encontrada');
    if (line.lineType === 'consumed') throw new BadRequestException('No se permite eliminar líneas consumidas directamente. Use un ajuste de inventario.');
    await this.prisma.workOrderSparePart.delete({ where: { id: lineId } });
    return { success: true, message: 'Línea eliminada correctamente' };
  }

  private async ensureSparePartTypeExists(id: number) {
    const item = await this.prisma.sparePartType.findUnique({ where: { id } });
    if (!item) throw new BadRequestException('Tipo de repuesto inválido');
  }

  private async ensureSparePartExists(id: number) {
    const item = await this.prisma.sparePart.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Repuesto no encontrado');
    return item;
  }

  private async ensureTechnicianExists(id: number) {
    const item = await this.prisma.technician.findUnique({ where: { id } });
    if (!item) throw new BadRequestException('Técnico inválido');
  }

  private async ensureWorkOrderExists(id: number) {
    const item = await this.prisma.workOrder.findUnique({ where: { id }, select: { id: true } });
    if (!item) throw new NotFoundException('Orden no encontrada');
  }
}
