import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CostsService } from './costs.service';
import { UpsertWorkOrderCostsDto } from './dto/upsert-work-order-costs.dto';

@ApiTags('costs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('work-orders/:workOrderId/costs')
export class CostsController {
  constructor(private readonly service: CostsService) {}

  @Get()
  get(@Param('workOrderId') workOrderId: string) {
    return this.service.get(Number(workOrderId));
  }

  @Post()
  createOrUpdate(@Param('workOrderId') workOrderId: string, @Body() dto: UpsertWorkOrderCostsDto) {
    return this.service.upsert(Number(workOrderId), dto);
  }

  @Put()
  update(@Param('workOrderId') workOrderId: string, @Body() dto: UpsertWorkOrderCostsDto) {
    return this.service.upsert(Number(workOrderId), dto);
  }

  @Post('recalculate')
  recalculate(@Param('workOrderId') workOrderId: string) {
    return this.service.recalculate(Number(workOrderId));
  }
}
