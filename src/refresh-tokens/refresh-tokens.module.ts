import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RefreshToken } from "./entities/refresh-token.entity";
import { RefreshTokensService } from "./refresh-tokens.service";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { User } from "../users/entities/user.entity";

@Module({
    imports : [
        ConfigModule,
        JwtModule.register({}),
        TypeOrmModule.forFeature([RefreshToken,User])
    ],
    providers : [RefreshTokensService],
    exports : [RefreshTokensService]
})

export class RefreshTokensModule {}