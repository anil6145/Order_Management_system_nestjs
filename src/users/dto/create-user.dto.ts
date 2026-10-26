import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, length, Matches, MinLength } from "class-validator";
// here class validator vadidates incomming data
import { UserRole } from "../enum/roles.enum.js";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
// here it transforms/cleans incomming data 

export class CreateUserDto {

    @ApiProperty({ description: 'User full name',
    example: 'Ajay',
    
  })
    @Transform(({value}) => value?.trim())
    @IsString()
    @IsNotEmpty()
    name : string

    @ApiProperty({
    description: 'Unique email address',
    example: 'ajay@gmail.com',
  })

    @Transform(({ value }) => value?.trim().toLowerCase())
    @IsEmail()
    email : string

    @ApiProperty({
    description: 'Password with minimum 8 characters',    
    example: '123456',
    
  })
    @IsString()
    @IsNotEmpty()
    @MinLength(8,{
      message : 'Password must be atleast 8 characters long'
    })
    @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/)
    password : string;

    @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.User,
  })
  @IsOptional()
    @IsEnum(UserRole)
    role? : UserRole


// swagger imports they are primarily for API documentation     

// @ApiProperty  : what are the fields should be entered in field it has description and with example 

// @ApiPropertyOptional : the property is optional 




    
}