import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateWorkOrderDto {
  @IsInt() customerId!: number;
  @IsInt() assetId!: number;
  @IsInt() serviceTypeId!: number;
  @IsInt() priorityId!: number;
  @IsInt() currentStatusId!: number;
  @IsOptional() @IsInt() assignedTechnicianId?: number;
  @IsOptional() @IsDateString() receivedAt?: string;
  @IsOptional() @IsString() @MaxLength(2000) initialProblemDescription?: string;
}
