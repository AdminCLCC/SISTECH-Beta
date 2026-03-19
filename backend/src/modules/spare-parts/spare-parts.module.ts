import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { SparePartsController } from './spare-parts.controller';
import { SparePartsService } from './spare-parts.service';

@Module({
  imports: [PrismaModule],
  controllers: [SparePartsController],
  providers: [SparePartsService],
  exports: [SparePartsService],
})
export class SparePartsModule {}
