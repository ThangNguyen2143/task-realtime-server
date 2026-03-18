import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import ResponseHelper from 'src/helper/ResponseModel';

@Controller('/api/user')
@ApiBearerAuth('access-token')
@UseGuards(JwtGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const res = await this.userService.findById(id);
      return ResponseHelper.ResponseSuccess(res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
