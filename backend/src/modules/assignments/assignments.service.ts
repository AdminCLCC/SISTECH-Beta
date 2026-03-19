import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByWorkOrder(workOrderId: number) {
    await this.ensureWorkOrderExists(workOrderId);
    const data = await this.prisma.workOrderAssignment.findMany({
      where: { workOrderId },
      include: {
        technician: { select: { id: true, code: true, firstName: true, lastName: true, isAvailable: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });
    return { success: true, data };
  }

  async create(workOrderId: number, dto: CreateAssignmentDto, userId: number) {
    const workOrder = await this.prisma.workOrder.findUnique({ where: { id: workOrderId }, select: { id: true, asset: { select: { category: true } } } });
    if (!workOrder) throw new NotFoundException('Orden no encontrada');

    const technician = await this.prisma.technician.findUnique({ where: { id: dto.technicianId } });
    if (!technician || !technician.isActive) throw new BadRequestException('Técnico inválido');
    if (!technician.isAvailable) throw new BadRequestException('El técnico no está disponible');

    await this.prisma.$transaction(async (tx) => {
      await tx.workOrderAssignment.create({
        data: {
          workOrderId,
          technicianId: dto.technicianId,
          assignedByUserId: userId,
          assignmentType: dto.assignmentType,
          reason: dto.reason,
        },
      });
      await tx.workOrder.update({
        where: { id: workOrderId },
        data: { assignedTechnicianId: dto.technicianId },
      });
    });

    return this.listByWorkOrder(workOrderId);
  }

  async suggestion(workOrderId: number) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { id: true },
    });
    if (!workOrder) throw new NotFoundException('Orden no encontrada');

    const technicians = await this.prisma.technician.findMany({
      where: { isActive: true, isAvailable: true },
      select: {
        id: true,
        code: true,
        firstName: true,
        lastName: true,
        _count: { select: { assignedOrders: { where: { closedAt: null } } } },
      },
      orderBy: { assignedOrders: { _count: 'asc' } },
    });

    const suggested = technicians[0] ?? null;
    return {
      success: true,
      data: suggested
        ? {
            technicianId: suggested.id,
            technicianCode: suggested.code,
            technicianName: `${suggested.firstName} ${suggested.lastName}`,
            activeOrdersCount: suggested._count.assignedOrders,
          }
        : null,
    };
  }

  private async ensureWorkOrderExists(workOrderId: number) {
    const order = await this.prisma.workOrder.findUnique({ where: { id: workOrderId }, select: { id: true } });
    if (!order) throw new NotFoundException('Orden no encontrada');
  }
}
