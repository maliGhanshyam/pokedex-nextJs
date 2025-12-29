import { IsString, IsEmail, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateContactDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must be at most 100 characters' })
  name: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsNotEmpty({ message: 'Mobile number is required' })
  @IsString({ message: 'Mobile number must be a string' })
  @MinLength(10, { message: 'Mobile number must be at least 10 digits' })
  @MaxLength(15, { message: 'Mobile number must be at most 15 digits' })
  mobile: string;

  @IsNotEmpty({ message: 'Message is required' })
  @IsString({ message: 'Message must be a string' })
  @MinLength(5, { message: 'Message must be at least 5 characters' })
  @MaxLength(2000, { message: 'Message must be at most 2000 characters' })
  message: string;
}

export class ContactResponseDto {
  id: string;
  name: string;
  email: string;
  mobile: string;
  message: string;
  createdAt: Date;
}

