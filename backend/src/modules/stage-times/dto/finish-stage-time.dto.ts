import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class FinishStageTimeDto {
  @IsOptional()
  @IsISO8601()
  endedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
