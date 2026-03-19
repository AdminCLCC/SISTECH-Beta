import { IsInt, IsISO8601, IsOptional, IsString } from 'class-validator';

export class StartStageTimeDto {
  @IsInt()
  technicianId!: number;

  @IsInt()
  processStageId!: number;

  @IsOptional()
  @IsISO8601()
  startedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
