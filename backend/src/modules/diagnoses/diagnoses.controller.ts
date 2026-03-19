import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpsertDiagnosisDto } from './dto/upsert-diagnosis.dto';
import { DiagnosesService } from './diagnoses.service';

@ApiTags('diagnoses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('work-orders/:workOrderId/diagnosis')
export class DiagnosesController {
  constructor(private readonly diagnosesService: DiagnosesService) {}

  @Get()
  find(@Param('workOrderId') workOrderId: string) {
    return this.diagnosesService.findByWorkOrder(Number(workOrderId));
  }

  @Post()
  create(@Param('workOrderId') workOrderId: string, @Body() dto: UpsertDiagnosisDto) {
    return this.diagnosesService.upsert(Number(workOrderId), dto);
  }

  @Put()
  update(@Param('workOrderId') workOrderId: string, @Body() dto: UpsertDiagnosisDto) {
    return this.diagnosesService.upsert(Number(workOrderId), dto);
  }
}
