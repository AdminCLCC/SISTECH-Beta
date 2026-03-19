import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInventoryAdjustmentDto {
  @IsNumber()
  sparePartId!: number;

  @IsString()
  @IsIn(['ADJUSTMENT_POSITIVE', 'ADJUSTMENT_NEGATIVE'])
  movementTypeCode!: 'ADJUSTMENT_POSITIVE' | 'ADJUSTMENT_NEGATIVE';

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsString()
  referenceDocument?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
