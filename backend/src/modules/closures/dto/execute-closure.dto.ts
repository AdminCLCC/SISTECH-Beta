import { IsOptional, IsString } from 'class-validator';

export class ExecuteClosureDto {
  @IsOptional()
  @IsString()
  closureNotes?: string;
}
