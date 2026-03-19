import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FinishStageTimeDto } from './dto/finish-stage-time.dto';
import { StartStageTimeDto } from './dto/start-stage-time.dto';
import { StageTimesService } from './stage-times.service';

@ApiTags('stage-times')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('work-orders/:workOrderId/stage-times')
export class StageTimesController {
  constructor(private readonly stageTimesService: StageTimesService) {}

  @Get()
  list(@Param('workOrderId') workOrderId: string) {
    return this.stageTimesService.listByWorkOrder(Number(workOrderId));
  }

  @Post('start')
  start(@Param('workOrderId') workOrderId: string, @Body() dto: StartStageTimeDto) {
    return this.stageTimesService.start(Number(workOrderId), dto);
  }

  @Post(':stageTimeId/finish')
  finish(
    @Param('workOrderId') workOrderId: string,
    @Param('stageTimeId') stageTimeId: string,
    @Body() dto: FinishStageTimeDto,
  ) {
    return this.stageTimesService.finish(Number(workOrderId), Number(stageTimeId), dto);
  }

  @Get('summary')
  summary(@Param('workOrderId') workOrderId: string) {
    return this.stageTimesService.summary(Number(workOrderId));
  }
}
