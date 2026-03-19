import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { FinishStageTimeDto } from './dto/finish-stage-time.dto';
import { StartStageTimeDto } from './dto/start-stage-time.dto';

@Injectable()
export class StageTimesService {
  constructor(private readonly prisma: PrismaService) {}

  async listByWorkOrder(workOrderId: number) {
    await this.ensureWorkOrderExists(workOrderId);
    const data = await this.prisma.workOrderStageTime.findMany({
      where: { workOrderId },
      include: {
        technician: { select: { id: true, code: true, firstName: true, lastName: true } },
        processStage: { select: { id: true, code: true, name: true, sortOrder: true } },
      },
      orderBy: [{ startedAt: 'desc' }],
    });
    return { success: true, data };
  }

  async start(workOrderId: number, dto: StartStageTimeDto) {
    await this.ensureWorkOrderExists(workOrderId);
    await this.ensureTechnicianExists(dto.technicianId);
    await this.ensureStageExists(dto.processStageId);

    const openStage = await this.prisma.workOrderStageTime.findFirst({
      where: { workOrderId, technicianId: dto.technicianId, endedAt: null },
      select: { id: true, processStageId: true },
    });
    if (openStage) {
      throw new BadRequestException('El técnico ya tiene una etapa abierta en esta orden');
    }

    const created = await this.prisma.workOrderStageTime.create({
      data: {
        workOrderId,
        technicianId: dto.technicianId,
        processStageId: dto.processStageId,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : new Date(),
        notes: dto.notes,
      },
      include: {
        technician: { select: { id: true, code: true, firstName: true, lastName: true } },
        processStage: { select: { id: true, code: true, name: true } },
      },
    });

    return { success: true, message: 'Etapa iniciada', data: created };
  }

  async finish(workOrderId: number, stageTimeId: number, dto: FinishStageTimeDto) {
    await this.ensureWorkOrderExists(workOrderId);
    const stageTime = await this.prisma.workOrderStageTime.findFirst({
      where: { id: stageTimeId, workOrderId },
    });
    if (!stageTime) throw new NotFoundException('Registro de tiempo no encontrado');
    if (stageTime.endedAt) throw new BadRequestException('La etapa ya fue finalizada');

    const endedAt = dto.endedAt ? new Date(dto.endedAt) : new Date();
    if (endedAt < stageTime.startedAt) {
      throw new BadRequestException('La fecha de fin no puede ser menor a la de inicio');
    }

    const durationMinutes = Math.max(0, Math.round((endedAt.getTime() - stageTime.startedAt.getTime()) / 60000));
    const updated = await this.prisma.workOrderStageTime.update({
      where: { id: stageTimeId },
      data: {
        endedAt,
        durationMinutes,
        notes: dto.notes ?? stageTime.notes,
      },
      include: {
        technician: { select: { id: true, code: true, firstName: true, lastName: true } },
        processStage: { select: { id: true, code: true, name: true } },
      },
    });
    return { success: true, message: 'Etapa finalizada', data: updated };
  }

  async summary(workOrderId: number) {
    await this.ensureWorkOrderExists(workOrderId);
    const rows = await this.prisma.workOrderStageTime.groupBy({
      by: ['processStageId'],
      where: { workOrderId },
      _sum: { durationMinutes: true },
      _count: { _all: true },
    });
    const stages = await this.prisma.processStage.findMany({
      where: { id: { in: rows.map((r) => r.processStageId) } },
      select: { id: true, code: true, name: true },
    });
    const data = rows.map((row) => ({
      processStageId: row.processStageId,
      processStage: stages.find((s) => s.id === row.processStageId) ?? null,
      totalDurationMinutes: row._sum.durationMinutes ?? 0,
      recordsCount: row._count._all,
    }));
    return { success: true, data };
  }

  private async ensureWorkOrderExists(id: number) {
    const order = await this.prisma.workOrder.findUnique({ where: { id }, select: { id: true } });
    if (!order) throw new NotFoundException('Orden no encontrada');
  }

  private async ensureTechnicianExists(id: number) {
    const technician = await this.prisma.technician.findUnique({ where: { id }, select: { id: true, isActive: true } });
    if (!technician || !technician.isActive) throw new BadRequestException('Técnico inválido');
  }

  private async ensureStageExists(id: number) {
    const stage = await this.prisma.processStage.findUnique({ where: { id }, select: { id: true, isActive: true } });
    if (!stage || !stage.isActive) throw new BadRequestException('Etapa inválida');
  }
}
