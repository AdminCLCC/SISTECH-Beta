import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UpsertDiagnosisDto } from './dto/upsert-diagnosis.dto';

@Injectable()
export class DiagnosesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByWorkOrder(workOrderId: number) {
    await this.ensureWorkOrderExists(workOrderId);
    const diagnosis = await this.prisma.diagnosis.findUnique({
      where: { workOrderId },
      include: {
        technician: { select: { id: true, code: true, firstName: true, lastName: true } },
        primaryDamageType: { select: { id: true, code: true, name: true } },
        secondaryDamageType: { select: { id: true, code: true, name: true } },
        nonRepairableReason: { select: { id: true, code: true, name: true } },
      },
    });
    return { success: true, data: diagnosis };
  }

  async upsert(workOrderId: number, dto: UpsertDiagnosisDto) {
    const workOrder = await this.prisma.workOrder.findUnique({ where: { id: workOrderId }, select: { id: true, isRepairable: true } });
    if (!workOrder) throw new NotFoundException('Orden no encontrada');

    const technician = await this.prisma.technician.findUnique({ where: { id: dto.technicianId } });
    if (!technician || !technician.isActive) throw new BadRequestException('Técnico inválido');

    if (dto.primaryDamageTypeId) {
      const damage = await this.prisma.damageType.findUnique({ where: { id: dto.primaryDamageTypeId } });
      if (!damage) throw new BadRequestException('Daño principal inválido');
    }
    if (dto.secondaryDamageTypeId) {
      const damage = await this.prisma.damageType.findUnique({ where: { id: dto.secondaryDamageTypeId } });
      if (!damage) throw new BadRequestException('Daño secundario inválido');
    }
    if (dto.nonRepairableReasonId) {
      const reason = await this.prisma.nonRepairableReason.findUnique({ where: { id: dto.nonRepairableReasonId } });
      if (!reason) throw new BadRequestException('Motivo de no reparabilidad inválido');
    }

    if (workOrder.isRepairable === false && !dto.nonRepairableReasonId) {
      throw new BadRequestException('Si la orden no es reparable, debe registrar un motivo');
    }
    if (workOrder.isRepairable === true && !dto.technicalDescription && !dto.primaryDamageTypeId) {
      throw new BadRequestException('Si la orden es reparable, debe registrar daño principal o descripción técnica');
    }

    const diagnosis = await this.prisma.diagnosis.upsert({
      where: { workOrderId },
      create: {
        workOrderId,
        technicianId: dto.technicianId,
        primaryDamageTypeId: dto.primaryDamageTypeId,
        secondaryDamageTypeId: dto.secondaryDamageTypeId,
        nonRepairableReasonId: dto.nonRepairableReasonId,
        technicalDescription: dto.technicalDescription,
        proposedSolution: dto.proposedSolution,
        estimatedHours: dto.estimatedHours,
        notes: dto.notes,
      },
      update: {
        technicianId: dto.technicianId,
        primaryDamageTypeId: dto.primaryDamageTypeId,
        secondaryDamageTypeId: dto.secondaryDamageTypeId,
        nonRepairableReasonId: dto.nonRepairableReasonId,
        technicalDescription: dto.technicalDescription,
        proposedSolution: dto.proposedSolution,
        estimatedHours: dto.estimatedHours,
        notes: dto.notes,
      },
    });

    return this.findByWorkOrder(diagnosis.workOrderId);
  }

  private async ensureWorkOrderExists(workOrderId: number) {
    const order = await this.prisma.workOrder.findUnique({ where: { id: workOrderId }, select: { id: true } });
    if (!order) throw new NotFoundException('Orden no encontrada');
  }
}
