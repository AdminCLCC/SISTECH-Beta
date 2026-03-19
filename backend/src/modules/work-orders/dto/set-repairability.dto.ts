import { IsBoolean } from 'class-validator';

export class SetRepairabilityDto {
  @IsBoolean() isRepairable!: boolean;
}
