import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsInt, IsNotEmpty, IsOptional, Matches, Max, Min } from "class-validator";

export class TopProductsQueryDto {
    @ApiProperty({
        description: 'Start date in YYYY-MM-DD format (interpreted in Asia/Kolkata timezone)',
        example: '2026-01-01',
    })
    @IsNotEmpty()
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    @IsDateString({ strict : true, strictSeparator : true})
    fromDate! : string;

    @ApiProperty({
        description: 'End date in YYYY-MM-DD format (interpreted in Asia/Kolkata timezone, max 366 days)',
        example: '2026-12-31',
    })
    @IsNotEmpty()
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    @IsDateString({strict : true, strictSeparator :true})
    toDate! : string;

    @ApiPropertyOptional({
        description: 'Maximum number of top products to return (1-100)',
        example: 5,
        default: 5,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit = 5;
}