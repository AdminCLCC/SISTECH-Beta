import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ListUsersQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() roleId?: number;
  @IsOptional() @Transform(({ value }) => value === 'true') @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) take?: number;
}
