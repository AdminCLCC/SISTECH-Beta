import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSparePartDto {
  @IsOptional()
  @IsNumber()
  sparePartTypeId?: number;

  @IsString()
  code!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  unitMeasure?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  standardCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumStock?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
