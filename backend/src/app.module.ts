import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { DiagnosesModule } from './modules/diagnoses/diagnoses.module';
import { StageTimesModule } from './modules/stage-times/stage-times.module';
import { ClosuresModule } from './modules/closures/closures.module';
import { SparePartsModule } from './modules/spare-parts/spare-parts.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CostsModule } from './modules/costs/costs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    HealthModule,
    WorkOrdersModule,
    AssignmentsModule,
    DiagnosesModule,
    StageTimesModule,
    ClosuresModule,
    SparePartsModule,
    InventoryModule,
    CostsModule,
  ],
})
export class AppModule {}
