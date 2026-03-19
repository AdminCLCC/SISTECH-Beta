import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ListInventoryMovementsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sparePartId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  workOrderId?: number;

  @IsOptional()
  @IsString()
  movementTypeCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  take?: number = 20;
}
