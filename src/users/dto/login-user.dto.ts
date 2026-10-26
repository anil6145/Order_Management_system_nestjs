import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginUserDto {

    @ApiProperty({
        description: 'User email address',
    example: 'ajay@gmail.com',
    
  })
    @Transform(({ value }) => value?.trim().toLowerCase())
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    email : string;

    @ApiProperty({description: 'User password',
    example: '123456'
    ,
  })
    @IsString()
    @IsNotEmpty()
    password : string;
}

// ApiProperty : it describes the DTO fields in swagger UI