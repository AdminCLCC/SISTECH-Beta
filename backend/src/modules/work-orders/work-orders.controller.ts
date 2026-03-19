import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { ListWorkOrdersQueryDto } from './dto/list-work-orders-query.dto';
import { SetRepairabilityDto } from './dto/set-repairability.dto';
import { ChangeWorkOrderStatusDto } from './dto/change-work-order-status.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { WorkOrdersService } from './work-orders.service';

@ApiTags('work-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get()
  list(@Query() query: ListWorkOrdersQueryDto) {
    return this.workOrdersService.list(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workOrdersService.findOne(Number(id));
  }

  @Post()
  create(@Body() dto: CreateWorkOrderDto, @CurrentUser() user: JwtUser) {
    return this.workOrdersService.create(dto, Number(user.sub));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWorkOrderDto) {
    return this.workOrdersService.update(Number(id), dto);
  }

  @Patch(':id/repairability')
  setRepairability(@Param('id') id: string, @Body() dto: SetRepairabilityDto) {
    return this.workOrdersService.setRepairability(Number(id), dto);
  }

  @Patch(':id/status')
  changeStatus(@Param('id') id: string, @Body() dto: ChangeWorkOrderStatusDto, @CurrentUser() user: JwtUser) {
    return this.workOrdersService.changeStatus(Number(id), dto.newStatusId, Number(user.sub), dto.reason);
  }

  @Get(':id/status-history')
  listStatusHistory(@Param('id') id: string) {
    return this.workOrdersService.listStatusHistory(Number(id));
  }

  @Patch(':id/ready-for-closure')
  markReadyForClosure(@Param('id') id: string, @Body('readyForClosure') readyForClosure: boolean) {
    return this.workOrdersService.markReadyForClosure(Number(id), readyForClosure);
  }
}
