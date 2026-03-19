import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { AssignmentsService } from './assignments.service';

@ApiTags('assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('work-orders/:workOrderId/assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  list(@Param('workOrderId') workOrderId: string) {
    return this.assignmentsService.listByWorkOrder(Number(workOrderId));
  }

  @Get('suggestion')
  suggestion(@Param('workOrderId') workOrderId: string) {
    return this.assignmentsService.suggestion(Number(workOrderId));
  }

  @Post()
  create(
    @Param('workOrderId') workOrderId: string,
    @Body() dto: CreateAssignmentDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.assignmentsService.create(Number(workOrderId), dto, Number(user.sub));
  }
}
