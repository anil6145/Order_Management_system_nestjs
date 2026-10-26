import {  ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../../users/users.service.js";
import { UserStatus } from "../../users/enum/userStatus.enum.js";
import { ConfigService } from "@nestjs/config";
import { TokenPayload } from "../interfaces/token-payload.interface.js";
import { TokenUser } from "../interfaces/token-user.interface.js";


@Injectable()
export class JwtStrategy extends PassportStrategy(
    Strategy,
) {
constructor(private readonly usersService : UsersService,
    private readonly configService : ConfigService
) {

    super({

        // Extracts the jwt from :
        // Authorization : Bearer <token>
        jwtFromRequest : ExtractJwt.fromAuthHeaderAsBearerToken(),

        // rejects the token if its expiration time has completed 
        ignoreExpiration : false,

        // secret used to verify the jwt signature 
        secretOrKey : configService.getOrThrow<string>(
            'JWT_ACCESS_SECRET'
        )
    })

}

// passprt calls validate() after the jwt has been successfully verified 
async validate (payload : TokenPayload): Promise<TokenUser> {
     
        const user = await this.usersService.findById(
            payload.sub,
        )

        if(!user) {
            throw new UnauthorizedException(
                'user not found'
            );
        }

        if(user.status !== UserStatus.ACTIVE){
            throw new ForbiddenException('Your account is deactivated')
        }

        return {
            id : user.id,
            name : user.name,
            email : user.email,
            role : user.role
        }
    }
}


