import { IsEnum, IsString, MaxLength, ValidateIf } from "class-validator";
import { OrderStatus } from "../../orders/enums/order-status.enum";

export class UpdateOrderStatusDto {

    @IsEnum(OrderStatus)
    status : OrderStatus;

    @ValidateIf((dto : UpdateOrderStatusDto) => dto.status === OrderStatus.CANCELLED)
    @IsString()
    @MaxLength(250)
    reason : string
} 