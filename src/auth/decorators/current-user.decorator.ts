import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AuthenticatedUser } from "../interfaces/authenticated-user.interface";


export const currentUser = createParamDecorator(
    (data : unknown , ctx : ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user as AuthenticatedUser
    }
)