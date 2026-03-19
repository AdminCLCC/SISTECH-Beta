import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { InventoryService } from './inventory.service';
import { ListInventoryMovementsQueryDto } from './dto/list-inventory-movements-query.dto';
import { CreateInventoryEntryDto } from './dto/create-inventory-entry.dto';
import { CreateInventoryAdjustmentDto } from './dto/create-inventory-adjustment.dto';
import { CreateInventoryOutputDto } from './dto/create-inventory-output.dto';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get('inventory-movements')
  listMovements(@Query() query: ListInventoryMovementsQueryDto) {
    return this.service.listMovements(query);
  }

  @Post('inventory-movements/entry')
  createEntry(@Body() dto: CreateInventoryEntryDto, @CurrentUser() user: JwtUser) {
    return this.service.createEntry(dto, Number(user.sub));
  }

  @Post('inventory-movements/adjustment')
  createAdjustment(@Body() dto: CreateInventoryAdjustmentDto, @CurrentUser() user: JwtUser) {
    return this.service.createAdjustment(dto, Number(user.sub));
  }

  @Post('inventory-movements/output')
  createOutput(@Body() dto: CreateInventoryOutputDto, @CurrentUser() user: JwtUser) {
    return this.service.createOutput(dto, Number(user.sub));
  }

  @Get('inventory/status')
  status() {
    return this.service.status();
  }
}
