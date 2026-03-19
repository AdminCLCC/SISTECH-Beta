import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UpsertWorkOrderCostsDto } from './dto/upsert-work-order-costs.dto';

@Injectable()
export class CostsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(workOrderId: number) {
    await this.ensureWorkOrderExists(workOrderId);
    const costs = await this.prisma.workOrderCost.findUnique({ where: { workOrderId } });
    return { success: true, data: costs };
  }

  async upsert(workOrderId: number, dto: UpsertWorkOrderCostsDto) {
    await this.ensureWorkOrderExists(workOrderId);
    const estimatedLaborCost = dto.estimatedLaborCost ?? undefined;
    const estimatedPartsCost = dto.estimatedPartsCost ?? undefined;
    const actualLaborCost = dto.actualLaborCost ?? undefined;
    const actualPartsCost = dto.actualPartsCost ?? undefined;

    const estimatedTotalCost = (estimatedLaborCost ?? 0) + (estimatedPartsCost ?? 0);
    const actualTotalCost = (actualLaborCost ?? 0) + (actualPartsCost ?? 0);
    const varianceAmount = actualTotalCost - estimatedTotalCost;

    const data = await this.prisma.workOrderCost.upsert({
      where: { workOrderId },
      create: {
        workOrderId,
        estimatedLaborCost,
        estimatedPartsCost,
        estimatedTotalCost,
        actualLaborCost,
        actualPartsCost,
        actualTotalCost,
        varianceAmount,
        notes: dto.notes,
      },
      update: {
        estimatedLaborCost,
        estimatedPartsCost,
        estimatedTotalCost,
        actualLaborCost,
        actualPartsCost,
        actualTotalCost,
        varianceAmount,
        notes: dto.notes,
      },
    });
    return { success: true, message: 'Costos consolidados correctamente', data };
  }

  async recalculate(workOrderId: number) {
    await this.ensureWorkOrderExists(workOrderId);

    const diagnosis = await this.prisma.diagnosis.findUnique({ where: { workOrderId }, select: { estimatedHours: true } });
    const consumed = await this.prisma.workOrderSparePart.findMany({
      where: { workOrderId, lineType: 'consumed' },
      select: { totalCost: true, unitCost: true, quantity: true },
    });
    const required = await this.prisma.workOrderSparePart.findMany({
      where: { workOrderId, lineType: 'required' },
      select: { totalCost: true, unitCost: true, quantity: true },
    });

    const actualPartsCost = consumed.reduce((acc, line) => acc + Number(line.totalCost ?? (Number(line.unitCost ?? 0) * Number(line.quantity))), 0);
    const estimatedPartsCost = required.reduce((acc, line) => acc + Number(line.totalCost ?? (Number(line.unitCost ?? 0) * Number(line.quantity))), 0);
    const estimatedLaborCost = Number(diagnosis?.estimatedHours ?? 0) * 10;

    const stageSummary = await this.prisma.workOrderStageTime.aggregate({
      where: { workOrderId, endedAt: { not: null } },
      _sum: { durationMinutes: true },
    });
    const totalMinutes = Number(stageSummary._sum.durationMinutes ?? 0);
    const actualLaborCost = (totalMinutes / 60) * 10;

    return this.upsert(workOrderId, {
      estimatedLaborCost,
      estimatedPartsCost,
      actualLaborCost,
      actualPartsCost,
      notes: 'Recalculado automáticamente desde diagnóstico, tiempos y repuestos',
    });
  }

  private async ensureWorkOrderExists(id: number) {
    const order = await this.prisma.workOrder.findUnique({ where: { id }, select: { id: true } });
    if (!order) throw new NotFoundException('Orden no encontrada');
  }
}
