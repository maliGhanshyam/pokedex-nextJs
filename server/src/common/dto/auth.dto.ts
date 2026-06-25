import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  username?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsOptional()
  refreshToken?: string;
}

/** Returned to client — tokens are set as HttpOnly cookies, not in the body */
export class AuthResponseDto {
  user: {
    id: string;
    email: string;
    name?: string;
    username?: string;
  };
}

/** Internal shape used by AuthService before cookies are set */
export interface AuthTokensResult {
  accessToken: string;
  refreshToken: string;
  user: AuthResponseDto['user'];
}

