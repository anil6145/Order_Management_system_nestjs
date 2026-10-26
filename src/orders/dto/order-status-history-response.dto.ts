import { UserRole } from "../../users/enum/roles.enum";
import { OrderStatus } from "../enums/order-status.enum";

export class HistoryUserDto {
  id: string;
  name: string;
  role: UserRole;
}

export class OrderStatusHistoryResponseDto {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedBy: HistoryUserDto | null;
  reason: string | null;
  createdAt: Date;
}