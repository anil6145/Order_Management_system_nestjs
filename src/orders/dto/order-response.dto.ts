import { UserRole } from "../../users/enum/roles.enum";
import { OrderStatus } from "../enums/order-status.enum";

export class OrderUserResponseDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
}

export class OrderProductResponseDto {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  price: string;
  stock: number;
  status: string;
}

export class OrderItemResponseDto {
  id: string;
  product: OrderProductResponseDto;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export class OrderResponseDto {
  id: string;
  order_number: string;
  user: OrderUserResponseDto;
  totalAmount: string;
  status: OrderStatus;
  items: OrderItemResponseDto[];
  notes: string | null;
  createdAt: Date;
}
