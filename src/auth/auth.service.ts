import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { LoginCredential } from './dto/login-credential.dto';
import { PayloadTokenDto } from './dto/payload-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}
  private TIME_EXPIRE_ACCESS = 2 * 60 * 60 * 1000; // 2h
  private TIME_EXPIRE_REFRESH = 7 * 24 * 60 * 60 * 1000; // 7d
  async register(accountData: CreateUserDto) {
    return this.userService.createUser(accountData);
  }
  async login(credential: LoginCredential) {
    const user = await this.userService.findByEmail(credential.email);
    if (!user) {
      throw new BadRequestException();
    }
    const isMatched = await this.userService.checkPassword(
      user.password,
      credential.password,
    );
    if (!isMatched) {
      throw new UnauthorizedException();
    }
    const userData = {
      id: user.id,
      name: user.nameDisplay,
      email: user.email,
    };
    const payloadToken: PayloadTokenDto = {
      jit: crypto.randomUUID(),
      sub: user.nameDisplay,
      userId: user.id,
    };
    const tokenData = await this.generateAuthToken(payloadToken);
    // Tính thời gian hết hạn của refresh token (7 ngày): theo định dạng dd/MM/yyyy HH:mm:ss
    const tokenSaved = await this.userService.saveRefreshToken(
      tokenData.refreshToken,
      payloadToken.jit,
      user.id,
    );
    if (!tokenSaved[0]) {
      throw new InternalServerErrorException('Lỗi kết nối server');
    }
    return {
      user: userData,
      refreshToken: tokenData.refreshToken,
      expiresIn: tokenSaved[1],
      accessToken: tokenData.accessToken,
    };
  }
  async getProfile(userId: string) {
    return this.userService.findById(userId);
  }
  async refreshToken(refreshToken: string) {
    const userInfo = await this.decodeToken(refreshToken);
    if (!userInfo || userInfo.isExpired) {
      throw new UnauthorizedException();
    }
    const { valid, revoked } = await this.userService.verifyRefreshToken(
      refreshToken,
      userInfo.user.jit,
    );
    if (!valid || revoked) {
      //Tạm thời chưa phân biệt được lỗi token hết hạn hay token bị revoke,
      // nếu token bị revoke thì xử lý revoke session hiện tại, cảnh báo người dùng và yêu cầu đăng nhập lại
      throw new UnauthorizedException();
    }
    const payload: PayloadTokenDto = {
      jit: crypto.randomUUID(),
      sub: userInfo.user.username,
      userId: userInfo.user.userId,
    };
    const tokenData = await this.generateAuthToken(payload);
    const [tokenSaved, expireDate] = await this.userService.saveRefreshToken(
      tokenData.refreshToken,
      payload.jit,
      userInfo.user.userId,
    );
    if (!tokenSaved) {
      throw new InternalServerErrorException('Lỗi kết nối server');
    }
    return {
      accessToken: await this.jwtService.signAsync(payload, {
        expiresIn: this.TIME_EXPIRE_ACCESS,
        secret: process.env.JWT_SECRET!,
      }),
      refreshToken: await this.jwtService.signAsync(payload, {
        expiresIn: this.TIME_EXPIRE_REFRESH,
        secret: process.env.JWT_REFRESH_TOKEN_SECRET!,
      }),
      expiresIn: expireDate,
    };
  }
  private async generateAuthToken(payload: any) {
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.TIME_EXPIRE_ACCESS,
      secret: process.env.JWT_SECRET!,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.TIME_EXPIRE_REFRESH,
      secret: process.env.JWT_REFRESH_TOKEN_SECRET!,
    });
    return { accessToken, refreshToken };
  }
  private async decodeToken(token: string) {
    if (!token) {
      return null;
    }
    const decoded = this.jwtService.decode(token) as {
      sub?: string;
      userId?: string;
      roles?: string;
      exp?: number;
      jit?: string;
    } | null;

    if (!decoded || typeof decoded !== 'object') {
      return null;
    }
    const isExpired = !decoded.exp || decoded.exp * 1000 <= Date.now();
    return {
      isExpired,
      user: {
        userId: decoded.userId ?? null,
        username: decoded.sub ?? null,
        role: decoded.roles ?? null,
        jit: decoded.jit ?? null,
      },
    };
  }
}
