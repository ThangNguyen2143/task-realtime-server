import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiHeaders } from '@nestjs/swagger';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { SetAccessTokenHeaderInterceptor } from './auth.interceptor';
import { LoginCredential } from './dto/login-credential.dto';

@Controller('/api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  @ApiBody({ type: CreateUserDto })
  async createNewUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }
  @Post('login')
  @UseInterceptors(SetAccessTokenHeaderInterceptor)
  async login(@Body() loginDto: LoginCredential) {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
  @ApiHeaders([
    {
      name: 'x-refresh-token',
      description: 'Refresh token',
      required: true,
    },
  ])
  @Post('refresh')
  @UseInterceptors(SetAccessTokenHeaderInterceptor)
  async refreshToken(@Request() req: any) {
    return await this.authService.refreshToken(req.headers['x-refresh-token']);
  }
}
