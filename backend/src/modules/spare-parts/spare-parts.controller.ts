import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { SparePartsService } from './spare-parts.service';
import { ListSparePartsQueryDto } from './dto/list-spare-parts-query.dto';
import { CreateSparePartDto } from './dto/create-spare-part.dto';
import { UpdateSparePartDto } from './dto/update-spare-part.dto';
import { CreateWorkOrderSparePartDto } from './dto/create-work-order-spare-part.dto';
import { UpdateWorkOrderSparePartDto } from './dto/update-work-order-spare-part.dto';

@ApiTags('spare-parts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SparePartsController {
  constructor(private readonly service: SparePartsService) {}

  @Get('spare-parts')
  list(@Query() query: ListSparePartsQueryDto) {
    return this.service.list(query);
  }

  @Get('spare-parts/:id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Post('spare-parts')
  create(@Body() dto: CreateSparePartDto) {
    return this.service.create(dto);
  }

  @Put('spare-parts/:id')
  update(@Param('id') id: string, @Body() dto: UpdateSparePartDto) {
    return this.service.update(Number(id), dto);
  }

  @Get('work-orders/:workOrderId/spare-parts')
  listForWorkOrder(@Param('workOrderId') workOrderId: string) {
    return this.service.listForWorkOrder(Number(workOrderId));
  }

  @Post('work-orders/:workOrderId/spare-parts')
  addToWorkOrder(@Param('workOrderId') workOrderId: string, @Body() dto: CreateWorkOrderSparePartDto, @CurrentUser() user: JwtUser) {
    return this.service.addToWorkOrder(Number(workOrderId), dto, Number(user.sub));
  }

  @Put('work-orders/:workOrderId/spare-parts/:lineId')
  updateWorkOrderLine(@Param('workOrderId') workOrderId: string, @Param('lineId') lineId: string, @Body() dto: UpdateWorkOrderSparePartDto) {
    return this.service.updateWorkOrderLine(Number(workOrderId), Number(lineId), dto);
  }

  @Delete('work-orders/:workOrderId/spare-parts/:lineId')
  removeWorkOrderLine(@Param('workOrderId') workOrderId: string, @Param('lineId') lineId: string) {
    return this.service.removeWorkOrderLine(Number(workOrderId), Number(lineId));
  }
}
