import { IsMongoId, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class MessageDto {
  _id?: string;

  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  senderId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2048)
  message: string;

  @IsNotEmpty()
  @IsMongoId()
  linkedChat: string;
}
