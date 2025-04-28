import { IsArray, IsOptional } from 'class-validator';

export class ChatDto {
  _id?: string;

  @IsOptional()
  @IsArray()
  recipients: string[];
}
