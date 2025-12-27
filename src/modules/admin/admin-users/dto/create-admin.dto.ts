import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@example.com',
    maxLength: 150,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(150, { message: 'Email must not exceed 150 characters' })
  email: string;

  @ApiProperty({
    description: 'Admin password',
    example: 'StrongPass@123',
    minLength: 8,
    maxLength: 18,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(18, { message: 'Password must not exceed 18 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,18}$/, {
    message: 'Password must include uppercase, lowercase, number, and special character',
  })
  password: string;

  @ApiProperty({
    description: 'First name of the admin',
    example: 'John',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    description: 'Last name of the admin',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({
    description: 'Indian phone number in +91 format',
    example: '+919876543210',
  })
  @IsString()
  @Matches(/^\+91[6-9]\d{9}$/, {
    message: 'Phone number must be a valid Indian number starting with +91',
  })
  phone: string;
}
