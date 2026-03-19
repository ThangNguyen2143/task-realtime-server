import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Request,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { SetAccessTokenHeaderInterceptor } from './auth.interceptor';
import { LoginCredential } from './dto/login-credential.dto';
import ResponseHelper from 'src/helper/ResponseModel';
import { Response } from 'express';
import { JwtGuard } from './guards/jwt.guard';

@Controller('/api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  @ApiBody({ type: CreateUserDto })
  async createNewUser(@Body() createUserDto: CreateUserDto) {
    try {
      const res = await this.authService.register(createUserDto);
      return ResponseHelper.ResponseSuccess(res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
  @Post('login')
  @UseInterceptors(SetAccessTokenHeaderInterceptor)
  async login(@Body() loginDto: LoginCredential) {
    try {
      const result = await this.authService.login(loginDto);
      return ResponseHelper.ResponseSuccess(result);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
  @Post('refresh')
  @UseInterceptors(SetAccessTokenHeaderInterceptor)
  async refreshToken(@Request() req: any) {
    try {
      const refreshToken = req.cookies['refresh_token'];

      if (!refreshToken) {
        throw new HttpException('No refresh token', HttpStatus.UNAUTHORIZED);
      }

      const res = await this.authService.refreshToken(refreshToken);
      return ResponseHelper.ResponseSuccess(res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token');
    return { message: 'Logged out' };
  }
  @ApiBearerAuth('access-token')
  @UseGuards(JwtGuard)
  @Get('me')
  async findOne(@Request() req: any) {
    try {
      const res = await this.authService.getProfile(req.user.userId);
      return ResponseHelper.ResponseSuccess(res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
