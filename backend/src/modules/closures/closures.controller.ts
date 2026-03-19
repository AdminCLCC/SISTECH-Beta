import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ClosuresService } from './closures.service';
import { ExecuteClosureDto } from './dto/execute-closure.dto';
import { ValidateClosureDto } from './dto/validate-closure.dto';

@ApiTags('closures')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('work-orders/:workOrderId/closure')
export class ClosuresController {
  constructor(private readonly closuresService: ClosuresService) {}

  @Get()
  get(@Param('workOrderId') workOrderId: string) {
    return this.closuresService.get(Number(workOrderId));
  }

  @Post('validate')
  validate(@Param('workOrderId') workOrderId: string, @Body() dto: ValidateClosureDto) {
    return this.closuresService.validate(Number(workOrderId), dto.closureNotes);
  }

  @Post('close')
  close(@Param('workOrderId') workOrderId: string, @Body() dto: ExecuteClosureDto, @CurrentUser() user: JwtUser) {
    return this.closuresService.close(Number(workOrderId), Number(user.sub), dto.closureNotes);
  }
}
