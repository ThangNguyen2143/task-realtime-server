import { Injectable, ConflictException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}
  private TIME_EXPIRE_REFRESH = 7 * 24 * 60 * 60 * 1000; // 7d
  async createUser(createUserDto: CreateUserDto) {
    const userFoundByEmail = await this.findByEmail(createUserDto.email);
    if (userFoundByEmail) {
      throw new ConflictException('Email đã được sử dụng');
    }
    const newUser = await this.db.user.create({
      data: {
        email: createUserDto.email,
        nameDisplay: createUserDto.name_display,
        password: await this.hashPassword(createUserDto.password),
      },
    });
    return {
      user: {
        id: newUser.id,
      },
    };
    // return HttpStatus.CREATED;
  }
  async findByEmail(email: string) {
    if (!email) return null;
    try {
      return await this.db.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error('Prisma error:', error);
      throw error;
    }
  }
  async findById(id: string) {
    return await this.db.user.findUnique({ where: { id } });
  }
  hashPassword(password: string): Promise<string> {
    throw new Promise((resolve, reject) => {
      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          return reject(null);
        }
        bcrypt.hash(password, salt, (err2, hash) => {
          return err2 ? reject(null) : resolve(hash);
        });
      });
    });
  }
  checkPassword(userPassword: string, password: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    throw new Promise((resolve, reject) => {
      bcrypt.compare(password, userPassword, (error, ok) => {
        return error || !ok ? resolve(false) : resolve(true);
      });
    });
  }
  //Save refresh token to database
  async saveRefreshToken(
    refreshToken: string,
    tokenId: string,
    userId: string,
  ): Promise<[boolean, string]> {
    const expireDate = new Date(
      new Date().getTime() + this.TIME_EXPIRE_REFRESH,
    );
    if (!tokenId || !refreshToken) {
      return [false, 'Token ID và Refresh Token là bắt buộc'];
    }
    await this.db.refreshToken.create({
      data: {
        tokenRefresh: await this.hashPassword(refreshToken),
        userId,
        id: tokenId,
        expiredAt: expireDate,
      },
    });
    return [true, expireDate.toLocaleDateString()];
  }
  // Hàm kiểm tra refresh token của user theo sessionId, nếu không tồn tại, đã hết hạn  thì trả về lỗi hoặc đã bị revoke thì trả về lỗi, nếu hợp lệ thì trả về true
  async verifyRefreshToken(
    refreshToken: string,
    tokenId: string,
  ): Promise<{ valid: boolean; revoked: boolean }> {
    if (!tokenId || !refreshToken) {
      return { valid: false, revoked: false };
    }
    const token = await this.db.refreshToken.findFirst({
      where: {
        id: tokenId,
      },
    });
    if (!token || token.expiredAt < new Date()) {
      return { valid: false, revoked: false };
    }
    return {
      valid: await this.checkPassword(token.tokenRefresh, refreshToken),
      revoked: false,
    };
  }
}
