import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpsertWorkOrderCostsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedLaborCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedPartsCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualLaborCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualPartsCost?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
