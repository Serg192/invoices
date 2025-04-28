import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class PaginationDto {
  @IsInt()
  @IsOptional()
  @Type(() => {
    return Number;
  })
  @Min(1)
  page = 1;

  @IsOptional()
  @IsIn([10, 25, 50, 100])
  @IsInt()
  @Type(() => {
    return Number;
  })
  limit = 25;
}
