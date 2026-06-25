import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { SignupDto, LoginDto, AuthTokensResult } from '../common/dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(signupDto: SignupDto): Promise<AuthTokensResult> {
    const existingUser = await this.usersService.findByEmail(signupDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if username is already taken if provided
    if (signupDto.username) {
      const existingUsername = await this.usersService.findByUsername(signupDto.username);
      if (existingUsername) {
        throw new ConflictException('Username already taken');
      }
    }

    const hashedPassword = await bcrypt.hash(signupDto.password, 10);
    const user = await this.usersService.create({
      email: signupDto.email,
      password: hashedPassword,
      name: signupDto.name,
      username: signupDto.username,
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.usersService.updateRefreshToken(user.id, tokens.hashedRefreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        isGuest: user.isGuest ?? false,
      },
    };
  }

  async createGuest(): Promise<AuthTokensResult> {
    const random = randomBytes(8).toString('hex');
    const email = `guest_${random}@guest.pokedex`;
    const password = randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      name: 'Guest Trainer',
      isGuest: true,
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.usersService.updateRefreshToken(user.id, tokens.hashedRefreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isGuest: true,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthTokensResult> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.usersService.updateRefreshToken(user.id, tokens.hashedRefreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        isGuest: user.isGuest ?? false,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokensResult> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.usersService.findOne(payload.sub);
      if (!user || !user.refreshToken) {
        throw new UnauthorizedException();
      }

      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException();
      }

      const tokens = await this.generateTokens(user.id, user.email);
      await this.usersService.updateRefreshToken(user.id, tokens.hashedRefreshToken);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          isGuest: user.isGuest ?? false,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async getUserIdFromRefreshToken(refreshToken: string): Promise<string | null> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }

  async logoutByRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      await this.usersService.updateRefreshToken(payload.sub, null);
    } catch {
      // Token invalid or expired — cookies will still be cleared
    }
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_ACCESS_TOKEN_EXPIRATION',
        '15m',
      ),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_REFRESH_TOKEN_EXPIRATION',
        '7d',
      ),
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    return {
      accessToken,
      refreshToken,
      hashedRefreshToken,
    };
  }
}

