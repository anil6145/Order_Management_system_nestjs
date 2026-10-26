
> here it stores only hashed refresh tokens in PostgreSQl instead of storing the original tokens

- interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  exp?: number;
}
> defines the expected JWT payload. sub is the user's ID, and exp is the token expiration in unix seconds 

- interface TokenUser {
  id: string;
  email: string;
  role: string;
}
> defines the user information needed to generate tokens these interfaces provide TypeScript type checking 

- private hashToken(token: string): string {
    return createHash('sha256')
>  createHash comes from node.js built-in crypto module. 'sha256' specifies the SHA-256 hashing algorithm
> it creates a hash object that can process the token 
      .update(token)
> passes you oroginal refresh token into the hash object so it can calculate the hash 
      .digest('hex');
> calculates the final hash 
> 'hex' converts the hash bytes into a readable hexadecimal string 
> returns the resulting hash as a string

> if an attacker obtains a copy of our database, they directly use the stored hash as the original refresh token 

> when a user sends a refresh token to /auth/refresh your service can hash the submitted token and compare that hash with the stored token_hash

- const tokenHash = this.hashToken(refreshToken);

// Find the matching hashed token in the database
const storedToken = await this.refreshTokenRepository.findOne({
  where: {
    token_hash: tokenHash,
  },
});

> if a matching record exists and the token has not expired or been revoked the service can continue validating it and issue a new token pair according to your authentication logic 

# here why should i use SHA-256 instead of bcrypt :
> refresh tokens are normally cryptographically random high entropy values 
> SHA-256 is suitable for hashing these tokens because it is fast and deterministic the same token always produces the same hash 

## High Entropy :
> refresh tokens are already generated as random high entropy strings 
## speed :
> slow hashing algorithms like bcrypt are designed to slow down brute-force attacks on passwords 

> for refresh tokens a fast hash like SHA-256 is ideal because the server must verify the token quickly on every single refresh request 

> dataBase safety : storing a SHA-256 hash ensures that if an attacker database they only see hashed values rather than live , reusable refresh tokens 

## how the flow works 
# generate the token :
> when a user logs in , create high entropy random string
# hash and store :
> compute the SHA-256 hash of that token and save the hash in your db 
## send plaintext to client :
> send the unhashed raw token to the client 
## verify on refresh :
> when the client sends the refresg token back compute its SHA-256 hash on the server and query database for a matching hash 
## rotate :
> issue a brand new refresh token hash the new one for the database, invalidate the old hash and return the new plaintext to the client 

## fast cryptographic hash :
> A cryptographic hash converts input data into a fixed length hash value 
- createHash('sha256')
  .update(token)
  .digest('hex');

> fast : SHA-256 calculates the hash quickly so you application can process refresh token without delay

> high entrophy : means the token contaions a large amount of randomness making it difficult to guess 
> a securely generated , long , random refresh token extremely difficult to guess  

## SHA-256 :
> stands for Secure Hash Algorithm 256-bit 
> it is a cryptographic hashing algorithm that converts input data into fixed length hash of 256 bits usually represented as a 64-character hexadecimal string 

## HMAC-SHA-256 :
> stands for hash-based Message authentication code it combines a cryptographic hash alogorithm such as SHA-256 with a secret key  

-   private async verifyRefreshToken(
    token: string,
  ): Promise<TokenPayload> {
    try {
      const payload =
        await this.jwtService.verifyAsync<TokenPayload>(
          token,
          { secret: this.refreshSecret },
        );

      if (
        typeof payload.sub !== 'string' ||
        typeof payload.email !== 'string' ||
        typeof payload.role !== 'string' ||
        typeof payload.exp !== 'number'
      ) {
        throw new Error('Invalid refresh-token claims');
      }

      return payload;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired refresh token',
      );
    }
  }

> verifyRefreshToken() method is used to verify wheather a refresh token is valid   

- private async verifyRefreshToken(
  token: string,
): Promise<TokenPayload>
> private - can be used only inside this service class
> async - allows asynchronous operations
> token : string - recieves the refresh token from the user
> promise<TokenPayload> - returns the decoded token payload if valid 

- const payload =
  await this.jwtService.verifyAsync<TokenPayload>(
    token,
    { secret: this.refreshSecret },
  );
> verifyAsync() verifies the token's signature and expiration 
> this.refreshSecret is the secret used to verify the refresh token 
> payload contains the token's data such as user's ID, email,role and expiration time   

- if (
  typeof payload.sub !== 'string' ||
  typeof payload.email !== 'string' ||
  typeof payload.role !== 'string' ||
  typeof payload.exp !== 'number'
)
> here validating the token data 
> sub must be a string (user ID)
> email must be a string 
> role must be a string
> exp must be a number

- return payload;
> if verification and validation succeed the method returns the payload so the refresh token logic can use the user's information 

- async saveRefreshToken(
  userId: string,
  refreshToken: string,
): Promise<void> {
  const payload = await this.verifyRefreshToken(refreshToken);

  if (payload.sub !== userId) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  await this.refreshTokenRepository.save(
    this.refreshTokenRepository.create({
      userId,
      tokenHash: this.hashToken(refreshToken),
      expires_at: new Date(payload.exp! * 1000),
      revoked_at: null,
    }),
  );
}
> the purpose of saveRefreshToken() is to verify a refresh token and store its hashed value in the database here the application can manage refresh token securely 

- async saveRefreshToken(
  userId: string,
  refreshToken: string,
): Promise<void>
> userId : the ID of the user who owns the token
> refreshToken : the refresh token generated during login 
> Promise<void> : the method performs an asynchronous operation but doesn't return any value 

- const payload = await this.verifyRefreshToken(refreshToken);
> here checks wheather refresh token is valid and signed correctly 

- if (payload.sub !== userId) {
  throw new UnauthorizedException('Invalid refresh token');
}
> payload.sub : contains the user ID stored inside the the JWt 
> userId : is the ID provided to this method 
> if they don't match the token is rejected 

- await this.refreshTokenRepository.save(
  this.refreshTokenRepository.create({
    userId,
    tokenHash: this.hashToken(refreshToken),
    expires_at: new Date(payload.exp! * 1000),
    revoked_at: null,
  }),
);
> userId identifies the token's owner
> tokenHash stores a hash instead of the original token 
> expires_at stores when the token expires 
> revoked_at : null indicates that the token has not revoked 

> payload.exp! * 1000 the JWT expiration is in Unix seconds but the JS Date expects milliseconds multiplying by 1000 converts the value 

- async validateForRotation(
  refreshToken: string,
): Promise<TokenUser> {
  const payload = await this.verifyRefreshToken(refreshToken);
  const tokenHash = this.hashToken(refreshToken);

  const storedToken = await this.refreshTokenRepository.findOne({
    where: { tokenHash },
  });

  if (
    !storedToken ||
    storedToken.userId !== payload.sub ||
    storedToken.revoked_at !== null ||
    storedToken.expires_at.getTime() <= Date.now()
  ) {
    throw new UnauthorizedException(
      'Refresh token is invalid, expired, or revoked',
    );
  }

> validateForRotation() method is used to check wheather a a refresh token is valid before generating a new access token and refresh token 

- const payload = await this.verifyRefreshToken(refreshToken);
> checks wheather the JWT refresh token is genuine and has not expired 
> returns the token's payload including sub(the user's ID)
> if invalid or expired verification fails 

- const tokenHash = this.hashToken(refreshToken);
> converts the refresh token into a hash
> we store the hash in the database instead of the original token for security 

- const storedToken = await this.refreshTokenRepository.findOne({
  where: { tokenHash },
});
> searches the refresh_token table for the matching hash 
> confirms that the token is registrated in our databse 

- if (
  !storedToken ||
  storedToken.userId !== payload.sub ||
  storedToken.revoked_at !== null ||
  storedToken.expires_at.getTime() <= Date.now()
)
> !storedToken token doesn't exist in the database

>  storedToken.userId !== payload.sub || : token belongs to a different user than the one in the JWT payload 

> storedToken.revoked_at !== null || : token has already been revoked or invalidated

> storedToken.expires_at.getTime() <= Date.now() : token has expired according to the database expiry time 

- const user = await this.userRepository.findOne({
  where: { id: payload.sub },
});
> fetches the user information from the database using the user ID in the token 

- if (user.status !== UserStatus.ACTIVE) {
  throw new ForbiddenException('Your account is deactivated');
}
> prevents deactivated users from refreshing their tokens it returns 403 

- return {
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
};
> returns the users information so the authenticate service can generate a new pair of tokens 

## rotate :

-   // Called when POST /auth/refresh is received.
  async rotate(oldRefreshToken: string,
    newRefreshToken : string
  ) : Promise<void> {
    const oldPayload = await this.verifyRefreshToken(oldRefreshToken);

    const newPayload = this.verifyRefreshToken(newRefreshToken);

if (oldPayload.sub !== (await newPayload).sub) {
      throw new UnauthorizedException(
        'Refresh tokens belong to different users',
      );
    }

    const oldTokenHash = this.hashToken(oldRefreshToken);
    const newTokenHash = this.hashToken(newRefreshToken);

    if (oldTokenHash === newTokenHash) {
      throw new UnauthorizedException(
        'A new refresh token is required',
      );
    }
    const user = await this.userRepository.findOne({
        where : {id : oldPayload.sub}
    })

    if(!user) {
        throw new UnauthorizedException('user not found')
    }

    if(user.status !== UserStatus.ACTIVE) {
        throw new ForbiddenException('Your account is deactivated')
    }

    // Revoke the old token and save the new token atomically.
    await this.dataSource.transaction(async (manager) => {
      const result = await manager.update(
        RefreshToken,
        {
        tokenHash: oldTokenHash,
          userId: oldPayload.sub,
          revoked_at: IsNull(),
          expires_at: MoreThan(new Date()),
        },
        {
          revoked_at: new Date(),
        },
      );

      // Only one concurrent request can revoke this record.
      if (result.affected !== 1) {
        throw new UnauthorizedException(
          'Refresh token is invalid, expired, or already used',
        );
      }

      await manager.insert(RefreshToken, {
        userId: (await newPayload).sub,
        tokenHash: newTokenHash,
        expires_at: new Date((await newPayload).exp! * 1000),
        revoked_at: null,
      });
    });
  }

> the purpose of rotate() is to replace an old refresh token with a new refresh token this process is called Refresh Token Rotation 
> when the client calls 
- POST/auth/refresh the application validates the old token revokes it and saves the new token in the database 

- async rotate(
  oldRefreshToken: string,
  newRefreshToken: string
): Promise<void>

> oldRefreshToken : The refresh token the client is currently using 

> newRefreshToken : the new refresh token to replace the old one 
> Promise<void> : the method performs an operation but does not return a value 

- const oldPayload = await this.verifyRefreshToken(oldRefreshToken);
const newPayload = await this.verifyRefreshToken(newRefreshToken);
> here verify the both tokens are valid and extract their payload such as user's is(sub) and expiration time(exp)

- if (oldPayload.sub !== newPayload.sub) {
  throw new UnauthorizedException(
    'Refresh tokens belong to different users',
  );
}
> here checks wheather both tokens belong to the same user 

- const oldTokenHash = this.hashToken(oldRefreshToken);
const newTokenHash = this.hashToken(newRefreshToken);
> convert the tokens into hashes before using them in database operations this allows the application to store token hashes instead of raw refresh tokens 

- if (oldTokenHash === newTokenHash) {
  throw new UnauthorizedException(
    'A new refresh token is required',
  );
}
> the client reusing the same token instead of rotating 

- const user = await this.userRepository.findOne({
  where: { id: oldPayload.sub },
});
> checks the user still exists 

- if (!user) {
  throw new UnauthorizedException('user not found');
}

if (user.status !== UserStatus.ACTIVE) {
  throw new ForbiddenException('Your account is deactivated');
}
> rejects the request if the user doesn't exist or their account has been deactivated

- await this.dataSource.transaction(async (manager) => {
> make the database changes atomic either both operations succees or both are rolled back if a error occurs  

- const result = await manager.update(
  RefreshToken,
  {
    tokenHash: oldTokenHash,
    userId: oldPayload.sub,
    revoked_at: IsNull(),
    expires_at: MoreThan(new Date()),
  },
  {
    revoked_at: new Date(),
  },
);
> this updated the old token if 
- its hash matches
- it belongs to the correct user
- it has not already been revoked
- it has not expired

- if (result.affected !== 1) {
  throw new UnauthorizedException(
    'Refresh token is invalid, expired, or already used',
  );
}
> prevent reuse of an old token 
> ensures exactly one matching token record was updated if no record was updated the refresh request is rejected 

- await manager.insert(RefreshToken, {
  userId: newPayload.sub,
  tokenHash: newTokenHash,
  expires_at: new Date(newPayload.exp! * 1000),
  revoked_at: null,
});
> save the new refresh token 
> store the new token's hash its user's Id and its expiration time revoked_at: null means the token has not been revoked 

-   // Called when POST /auth/logout is received.
  async revoke(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenHash = this.hashToken(refreshToken);

    const result = await this.refreshTokenRepository.update(
      {
        tokenHash,
        userId: payload.sub,
        revoked_at: IsNull(),
        expires_at: MoreThan(new Date()),
      },
      {
        revoked_at: new Date(),
      },
    );

    if (result.affected !== 1) {
      throw new UnauthorizedException(
        'Refresh token is invalid, expired, or revoked',
      );
    }

    return { message: 'Logged out successfully' };
  }
> revoke() method is used to log out a user by invalidating their refresh token 
> after logout the user cannot use that refresh token to generate new access and refresh tokens

- const payload = await this.verifyRefreshToken(refreshToken);
> checks wheather the refresh token is valid and not expired 
> returns the token payload inclusing the sub 

- const tokenHash = this.hashToken(refreshToken);
> here hash the refresh token converts the refresh token into a SHA-256
> you database stores the hash instead of the original token 

- const result = await this.refreshTokenRepository.update(
  {
    tokenHash,
    userId: payload.sub,
    revoked_at: IsNull(),
    expires_at: MoreThan(new Date()),
  },
  {
    revoked_at: new Date(),
  },
);
> tokenHash : must match the stored token hash
> userId : payload.sub : must belong to the correct user
> revoked_at : IsNull() : must not already revoked 
> expires_at : morethan(new Date())

> the second object 
- revoked_at : new Date() : records the current dte and time as the revocation time 

- if (result.affected !== 1) {
  throw new UnauthorizedException(
    'Refresh token is invalid, expired, or revoked',
  );
}
> checks wheather the token was revoked 

