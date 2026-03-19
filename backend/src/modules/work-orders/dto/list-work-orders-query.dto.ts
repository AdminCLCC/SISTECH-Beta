import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListWorkOrdersQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() currentStatusId?: number;
  @IsOptional() @Type(() => Number) @IsInt() assignedTechnicianId?: number;
  @IsOptional() @Type(() => Number) @IsInt() customerId?: number;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) take?: number;
}
