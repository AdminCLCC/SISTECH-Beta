import { IsOptional, IsString } from 'class-validator';

export class ValidateClosureDto {
  @IsOptional()
  @IsString()
  closureNotes?: string;
}
