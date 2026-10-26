import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, MaxLength, NotEquals } from "class-validator";

export class AdjustStockDto {
    @ApiProperty({
        description: 'Quantity change (positive to increase stock, negative to decrease stock, non-zero)',
        example: 10,
    })
    @Type(() => Number)
    @IsInt()
    @NotEquals(0, { message: 'Quantity must not be zero' })
    quantity: number;

    @ApiProperty({
        description: 'Reason for the stock adjustment',
        example: 'Restocked by supplier batch #482',
        maxLength: 250,
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(250)
    reason: string;
}