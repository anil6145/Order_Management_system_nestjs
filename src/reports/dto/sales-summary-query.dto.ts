import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsIn, IsNotEmpty, Matches } from "class-validator";

export class SalesSummaryQueryDto {
    @ApiProperty({
        description: 'Start date in YYYY-MM-DD format (interpreted in Asia/Kolkata timezone)',
        example: '2026-01-01',
    })
    @IsNotEmpty()
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    @IsDateString({strict : true, strictSeparator : true})
    fromDate! : string;

    @ApiProperty({
        description: 'End date in YYYY-MM-DD format (interpreted in Asia/Kolkata timezone, max 366/367 days)',
        example: '2026-12-31',
    })
    @IsNotEmpty()
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    @IsDateString({ strict : true , strictSeparator : true})
    toDate! : string;

    @ApiPropertyOptional({
        description: 'Aggregation interval',
        enum: ['day', 'month'],
        default: 'day',
        example: 'day',
    })
    @IsIn(['day','month'])
    groupBy : 'day' | 'month' = 'day'
}