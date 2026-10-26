
import { SetMetadata } from "@nestjs/common";
// it allows us to attach metadata to a controller or route 
// SetMetadata() is what stores that information

import { UserRole } from "../../users/enum/roles.enum.js";
// we are importing our application UserRole enum


export const Roles = (...roles : UserRole[]) => SetMetadata('roles',roles)

// export make this available to other files 
// const we don't need to reassign the Roles variable 

// ...roles --> it is a rest parameter here it accept n no.of arguments and collect them into an array

// UserRole[] --> array of UserRole values 

// Roles is the name of our custom decorator 

// SetMetadata('roles',roles) here 'roles' is a key and roles is a value 

// later rolesguard will use the same key to retrieve it  



// this is the custom decorator used for role-based authorization 

// the main purpose is to attach required roles to a controller/route so a RolesGuard can later read them 