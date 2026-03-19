import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class ClosuresService {
  constructor(private readonly prisma: PrismaService) {}

  async get(workOrderId: number) {
    await this.ensureWorkOrderExists(workOrderId);
    const closure = await this.prisma.workOrderClosure.findUnique({
      where: { workOrderId },
      include: { closedByUser: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
    return { success: true, data: closure };
  }

  async validate(workOrderId: number, closureNotes?: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { diagnosis: true },
    });
    if (!workOrder) throw new NotFoundException('Orden no encontrada');

    const openStage = await this.prisma.workOrderStageTime.findFirst({
      where: { workOrderId, endedAt: null },
      select: { id: true },
    });
    const completedTimes = !openStage && (await this.prisma.workOrderStageTime.count({ where: { workOrderId } })) > 0;
    const diagnosisCompleted = !!workOrder.diagnosis && (workOrder.isRepairable === false ? !!workOrder.diagnosis.nonRepairableReasonId : !!workOrder.diagnosis.technicalDescription || !!workOrder.diagnosis.primaryDamageTypeId);
    const closureAllowed = diagnosisCompleted && completedTimes && workOrder.readyForClosure;

    const closure = await this.prisma.workOrderClosure.upsert({
      where: { workOrderId },
      create: {
        workOrderId,
        diagnosisCompleted,
        timesCompleted: completedTimes,
        closureAllowed,
        closureNotes,
      },
      update: {
        diagnosisCompleted,
        timesCompleted: completedTimes,
        closureAllowed,
        closureNotes,
      },
    });

    return { success: true, data: closure };
  }

  async close(workOrderId: number, userId: number, closureNotes?: string) {
    const validation = await this.validate(workOrderId, closureNotes);
    if (!validation.data.closureAllowed) {
      throw new BadRequestException('La orden no cumple las condiciones para cierre');
    }

    const closedStatus = await this.prisma.workOrderStatus.findFirst({ where: { code: 'CERRADA' } });
    if (!closedStatus) throw new BadRequestException('No existe estado cerrada');

    const current = await this.prisma.workOrder.findUnique({ where: { id: workOrderId }, select: { currentStatusId: true } });
    if (!current) throw new NotFoundException('Orden no encontrada');

    await this.prisma.$transaction(async (tx) => {
      await tx.workOrder.update({
        where: { id: workOrderId },
        data: { currentStatusId: closedStatus.id, closedAt: new Date() },
      });
      await tx.workOrderStatusHistory.create({
        data: {
          workOrderId,
          previousStatusId: current.currentStatusId,
          newStatusId: closedStatus.id,
          changedByUserId: userId,
          changeReason: 'Cierre de orden',
        },
      });
      await tx.workOrderClosure.update({
        where: { workOrderId },
        data: { closedByUserId: userId, closedAt: new Date(), closureAllowed: true, closureNotes },
      });
    });

    return this.get(workOrderId);
  }

  private async ensureWorkOrderExists(id: number) {
    const order = await this.prisma.workOrder.findUnique({ where: { id }, select: { id: true } });
    if (!order) throw new NotFoundException('Orden no encontrada');
  }
}
