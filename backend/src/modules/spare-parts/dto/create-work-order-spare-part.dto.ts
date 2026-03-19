import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateWorkOrderSparePartDto {
  @IsNumber()
  sparePartId!: number;

  @IsOptional()
  @IsNumber()
  technicianId?: number;

  @IsString()
  @IsIn(['required', 'consumed'])
  lineType!: 'required' | 'consumed';

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
