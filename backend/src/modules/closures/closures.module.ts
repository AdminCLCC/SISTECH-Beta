import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { ClosuresController } from './closures.controller';
import { ClosuresService } from './closures.service';

@Module({
  imports: [PrismaModule],
  controllers: [ClosuresController],
  providers: [ClosuresService],
  exports: [ClosuresService],
})
export class ClosuresModule {}
