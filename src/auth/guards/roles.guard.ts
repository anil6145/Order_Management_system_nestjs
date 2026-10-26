import { CanActivate, ExecutionContext, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "../../users/enum/roles.enum.js";

@Injectable()
export class RolesGuard implements CanActivate {
    private readonly logger = new Logger('RolesGuard');

    constructor (
        private readonly reflector : Reflector,
    ){}
    // reflector is used to read metadata that placed on contoller or methods using decorators 

    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
        const requiredRoles = 
        this.reflector.getAllAndOverride
        // checks multiple values uses first defined value 
        <UserRole[]>(
            'roles',
            [
                context.getHandler(),
                // check the route method
                context.getClass()
                // check the controller class
            ]
        );

        const request = context.switchToHttp().getRequest();

        this.logger.log(`[GUARD] RolesGuard - canActivate() checking permissions`);

        if(!requiredRoles){
            this.logger.log(`[GUARD] RolesGuard - No role restriction on route → Authorization ALLOWED`);
            return true;
        }

        this.logger.log(`[GUARD] RolesGuard - Required roles: [${requiredRoles.join(', ')}]`);

        const user = request.user;      
        const userRole = user?.role;
        this.logger.log(`[GUARD] RolesGuard - Current user role: ${userRole || 'NONE'}`);

        const isAllowed = user && requiredRoles.includes(user.role);

        if (isAllowed) {
            this.logger.log(`[GUARD] RolesGuard - Authorization ALLOWED`);
        } else {
            this.logger.warn(`[GUARD] RolesGuard - Authorization DENIED`);
        }

        return isAllowed;
    }
}
