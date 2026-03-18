import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import ResponseHelper from 'src/helper/ResponseModel';

@Controller('/api/workspace')
@ApiBearerAuth('access-token')
@UseGuards(JwtGuard)
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post()
  async create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @Req() req: any,
  ) {
    try {
      const res = await this.workspaceService.create(
        createWorkspaceDto,
        req['user'],
      );
      return ResponseHelper.ResponseSuccess(res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async findAll(@Req() req: any) {
    try {
      const res = await this.workspaceService.findAll(req['user'].userId);
      return ResponseHelper.ResponseSuccess(res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    try {
      const res = await this.workspaceService.findOne(id, req['user'].userId);
      return ResponseHelper.ResponseSuccess(res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @Req() req: any,
  ) {
    try {
      const res = await this.workspaceService.update(
        id,
        req['user'].userId,
        updateWorkspaceDto,
      );
      return ResponseHelper.ResponseSuccess(res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    try {
      const res = await this.workspaceService.remove(id, req['user'].userId);
      return ResponseHelper.ResponseSuccess(res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
