import { UserRole } from "../../users/enum/roles.enum";

export interface TokenUser {
  id: string;
  name : string
  email: string;
  role: UserRole;
}