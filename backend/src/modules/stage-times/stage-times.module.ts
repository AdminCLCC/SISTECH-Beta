import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { StageTimesController } from './stage-times.controller';
import { StageTimesService } from './stage-times.service';

@Module({
  imports: [PrismaModule],
  controllers: [StageTimesController],
  providers: [StageTimesService],
  exports: [StageTimesService],
})
export class StageTimesModule {}
