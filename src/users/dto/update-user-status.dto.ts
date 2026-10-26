import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { UserStatus } from "../enum/userStatus.enum.js";

export class UpdateUserStatusDto {
    @ApiProperty({
        enum: UserStatus,
        example: UserStatus.ACTIVE,
        description: 'New user status (ACTIVE or INACTIVE)',
    })
    @IsEnum(UserStatus)
    status : UserStatus
}