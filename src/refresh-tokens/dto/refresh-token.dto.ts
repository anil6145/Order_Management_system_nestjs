import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDto {
    @ApiProperty({
        description: 'JWT refresh token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYiLCJpYXQiOjE1MTYyMzkwMjJ9...',
    })
    @IsString()
    @IsNotEmpty()
    refresh_token : string
}