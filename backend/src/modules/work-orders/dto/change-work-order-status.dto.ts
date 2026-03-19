import { IsInt, IsOptional, IsString } from 'class-validator';

export class ChangeWorkOrderStatusDto {
  @IsInt()
  newStatusId!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
