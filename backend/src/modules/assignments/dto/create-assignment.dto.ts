import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAssignmentDto {
  @IsInt() technicianId!: number;
  @IsIn(['manual', 'automatic']) assignmentType!: 'manual' | 'automatic';
  @IsOptional() @IsString() @MaxLength(1000) reason?: string;
}
