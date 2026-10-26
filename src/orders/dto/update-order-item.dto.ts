import { ApiPropertyOptional } from "@nestjs/swagger";
import { ArrayMinSize, IsArray, IsOptional, IsUUID, ValidateNested } from "class-validator";
import { CreateOrderItemDto } from "./create-order-item.dto.js";
import { Type } from "class-transformer";

export class UpdateOrderItemsDto {
    @ApiPropertyOptional({
        type: [CreateOrderItemDto],
        description: 'Items to add or increment in a PENDING order',
        example: [
            {
                productId: 'a0000000-0000-0000-0000-000000000001',
                quantity: 1,
            },
        ],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each : true})
    @Type(() => CreateOrderItemDto)
    addItems? : CreateOrderItemDto[] ;

    @ApiPropertyOptional({
        description: 'Array of existing order item UUIDs to remove',
        example: ['b0000000-0000-0000-0000-000000000001'],
    })
    @IsOptional()
    @IsArray()
    @ArrayMinSize(1, {
        message : 'removeItemIds mut not be empty when provided'
    })
    @IsUUID('all', {each : true})
    removeItemIds? : string[]
}