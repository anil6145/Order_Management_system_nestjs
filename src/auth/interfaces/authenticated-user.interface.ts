import { UserRole } from "../../users/enum/roles.enum";

export interface AuthenticatedUser {
    id : string,
    name : string,
    email : string,
    role : UserRole
}