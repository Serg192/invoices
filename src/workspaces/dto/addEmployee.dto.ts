import { IsEmail } from 'class-validator';

export class AddEmployeeDto {
  @IsEmail()
  email: string;
}
