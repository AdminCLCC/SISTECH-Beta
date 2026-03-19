import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { ListWorkOrdersQueryDto } from './dto/list-work-orders-query.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { SetRepairabilityDto } from './dto/set-repairability.dto';

@Injectable()
export class WorkOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListWorkOrdersQueryDto) {
    const take = query.take ?? 20;
    const page = query.page ?? 1;
    const data = await this.prisma.workOrder.findMany({
      where: {
        currentStatusId: query.currentStatusId,
        assignedTechnicianId: query.assignedTechnicianId,
        customerId: query.customerId,
        OR: query.search
          ? [
              { orderNumber: { contains: query.search, mode: 'insensitive' } },
              { customer: { fullName: { contains: query.search, mode: 'insensitive' } } },
              { asset: { serialNumber: { contains: query.search, mode: 'insensitive' } } },
            ]
          : undefined,
      },
      include: {
        customer: { select: { id: true, fullName: true } },
        asset: { select: { id: true, category: true, subcategory: true, model: true, serialNumber: true, brand: { select: { name: true } } } },
        currentStatus: { select: { id: true, code: true, name: true } },
        assignedTechnician: { select: { id: true, code: true, firstName: true, lastName: true } },
      },
      orderBy: { id: 'desc' },
      take,
      skip: (page - 1) * take,
    });
    return { success: true, data };
  }

  async findOne(id: number) {
    const order = await this.prisma.workOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        asset: { include: { brand: true } },
        serviceType: true,
        priority: true,
        currentStatus: true,
        assignedTechnician: true,
        diagnosis: true,
      },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return { success: true, data: order };
  }

  async create(dto: CreateWorkOrderDto, userId: number) {
    await this.validateReferences(dto);
    const asset = await this.prisma.asset.findUnique({ where: { id: dto.assetId }, select: { id: true, customerId: true } });
    if (!asset || asset.customerId !== dto.customerId) {
      throw new BadRequestException('El cliente no coincide con el activo');
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const last = await tx.workOrder.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });
      const orderNumber = `OT-${String((last?.id ?? 0) + 1).padStart(6, '0')}`;
      const order = await tx.workOrder.create({
        data: {
          orderNumber,
          customerId: dto.customerId,
          assetId: dto.assetId,
          serviceTypeId: dto.serviceTypeId,
          priorityId: dto.priorityId,
          currentStatusId: dto.currentStatusId,
          assignedTechnicianId: dto.assignedTechnicianId,
          createdByUserId: userId,
          receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
          initialProblemDescription: dto.initialProblemDescription,
        },
      });
      await tx.workOrderStatusHistory.create({
        data: {
          workOrderId: order.id,
          previousStatusId: null,
          newStatusId: dto.currentStatusId,
          changedByUserId: userId,
          changeReason: 'Estado inicial al crear la orden',
        },
      });
      if (dto.assignedTechnicianId) {
        await tx.workOrderAssignment.create({
          data: {
            workOrderId: order.id,
            technicianId: dto.assignedTechnicianId,
            assignedByUserId: userId,
            assignmentType: 'manual',
            reason: 'Asignación inicial al crear la orden',
          },
        });
      }
      return order;
    });
    return this.findOne(created.id);
  }

  async update(id: number, dto: UpdateWorkOrderDto) {
    await this.ensureExists(id);
    if (dto.assetId || dto.customerId || dto.serviceTypeId || dto.priorityId || dto.currentStatusId || dto.assignedTechnicianId) {
      await this.validateReferences({
        customerId: dto.customerId,
        assetId: dto.assetId,
        serviceTypeId: dto.serviceTypeId,
        priorityId: dto.priorityId,
        currentStatusId: dto.currentStatusId,
        assignedTechnicianId: dto.assignedTechnicianId,
      });
    }

    const current = await this.prisma.workOrder.findUnique({ where: { id }, select: { customerId: true, assetId: true } });
    const assetId = dto.assetId ?? current!.assetId;
    const customerId = dto.customerId ?? current!.customerId;
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId }, select: { customerId: true } });
    if (!asset || asset.customerId !== customerId) {
      throw new BadRequestException('El cliente no coincide con el activo');
    }

    await this.prisma.workOrder.update({
      where: { id },
      data: {
        customerId: dto.customerId,
        assetId: dto.assetId,
        serviceTypeId: dto.serviceTypeId,
        priorityId: dto.priorityId,
        currentStatusId: dto.currentStatusId,
        assignedTechnicianId: dto.assignedTechnicianId,
        receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : undefined,
        initialProblemDescription: dto.initialProblemDescription,
      },
    });
    return this.findOne(id);
  }

  async setRepairability(id: number, dto: SetRepairabilityDto) {
    await this.ensureExists(id);
    const order = await this.prisma.workOrder.update({
      where: { id },
      data: { isRepairable: dto.isRepairable },
      select: { id: true, orderNumber: true, isRepairable: true },
    });
    return { success: true, message: 'Reparabilidad actualizada', data: order };
  }



  async changeStatus(id: number, newStatusId: number, changedByUserId: number, reason?: string) {
    const order = await this.prisma.workOrder.findUnique({ where: { id }, select: { id: true, currentStatusId: true, readyForClosure: true, closedAt: true } });
    if (!order) throw new NotFoundException('Orden no encontrada');

    const status = await this.prisma.workOrderStatus.findUnique({ where: { id: newStatusId } });
    if (!status) throw new BadRequestException('Estado inválido');
    if (order.closedAt) throw new BadRequestException('La orden ya está cerrada');
    if (status.code === 'CERRADA') throw new BadRequestException('Use el módulo de cierre para cerrar la orden');

    await this.prisma.$transaction(async (tx) => {
      await tx.workOrder.update({ where: { id }, data: { currentStatusId: newStatusId } });
      await tx.workOrderStatusHistory.create({
        data: {
          workOrderId: id,
          previousStatusId: order.currentStatusId,
          newStatusId,
          changedByUserId,
          changeReason: reason,
        },
      });
    });

    return this.findOne(id);
  }

  async listStatusHistory(id: number) {
    await this.ensureExists(id);
    const data = await this.prisma.workOrderStatusHistory.findMany({
      where: { workOrderId: id },
      include: {
        previousStatus: { select: { id: true, code: true, name: true } },
        newStatus: { select: { id: true, code: true, name: true } },
        changedByUser: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { changedAt: 'desc' },
    });
    return { success: true, data };
  }

  async markReadyForClosure(id: number, readyForClosure: boolean) {
    await this.ensureExists(id);
    const order = await this.prisma.workOrder.update({
      where: { id },
      data: { readyForClosure },
      select: { id: true, orderNumber: true, readyForClosure: true },
    });
    return { success: true, message: 'Estado de cierre actualizado', data: order };
  }

  private async validateReferences(dto: Partial<CreateWorkOrderDto>) {
    if (dto.customerId) {
      const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
      if (!customer) throw new BadRequestException('Cliente inválido');
    }
    if (dto.assetId) {
      const asset = await this.prisma.asset.findUnique({ where: { id: dto.assetId } });
      if (!asset) throw new BadRequestException('Activo inválido');
    }
    if (dto.serviceTypeId) {
      const serviceType = await this.prisma.serviceType.findUnique({ where: { id: dto.serviceTypeId } });
      if (!serviceType) throw new BadRequestException('Tipo de servicio inválido');
    }
    if (dto.priorityId) {
      const priority = await this.prisma.priority.findUnique({ where: { id: dto.priorityId } });
      if (!priority) throw new BadRequestException('Prioridad inválida');
    }
    if (dto.currentStatusId) {
      const status = await this.prisma.workOrderStatus.findUnique({ where: { id: dto.currentStatusId } });
      if (!status) throw new BadRequestException('Estado inválido');
    }
    if (dto.assignedTechnicianId) {
      const technician = await this.prisma.technician.findUnique({ where: { id: dto.assignedTechnicianId } });
      if (!technician || !technician.isActive) throw new BadRequestException('Técnico inválido');
    }
  }

  private async ensureExists(id: number) {
    const order = await this.prisma.workOrder.findUnique({ where: { id }, select: { id: true } });
    if (!order) throw new NotFoundException('Orden no encontrada');
  }
}
