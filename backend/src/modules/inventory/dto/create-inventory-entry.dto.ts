import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInventoryEntryDto {
  @IsNumber()
  sparePartId!: number;

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
