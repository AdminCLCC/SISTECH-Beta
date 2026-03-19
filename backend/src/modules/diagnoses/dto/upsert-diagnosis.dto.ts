import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpsertDiagnosisDto {
  @IsInt() technicianId!: number;
  @IsOptional() @Type(() => Number) @IsInt() primaryDamageTypeId?: number;
  @IsOptional() @Type(() => Number) @IsInt() secondaryDamageTypeId?: number;
  @ValidateIf((o) => o.nonRepairableReasonId !== undefined)
  @Type(() => Number)
  @IsInt()
  nonRepairableReasonId?: number;
  @IsOptional() @IsString() @MaxLength(4000) technicalDescription?: string;
  @IsOptional() @IsString() @MaxLength(4000) proposedSolution?: string;
  @IsOptional() @Type(() => Number) estimatedHours?: number;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}
