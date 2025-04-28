import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  HttpException,
  UploadedFile,
  DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileSizeValidationPipe } from '../_pipes/file-validation.pipe';
import { UsersService } from './user.service';
import { UserDto } from './dto/user.dto';
import { User } from './models/user.model';
import { Roles } from '../_decorators/roles.decorator';
import { ECustomError } from '../_exceptions/error-codes';
import { JwtAuthGuard, RolesGuard } from '../_guards';
import { ReqUser } from '../_decorators/user.decorator';
import { PaginatedResponse } from 'src/_helpers/pagination.helper';
import { UpdateUserDto } from './dto/updateUser.dto';

@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: UserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyAccount(@ReqUser('id') userId: string): Promise<User> {
    await this.usersService.update(userId, {
      ...new UpdateUserDto(),
      lastSeen: new Date(),
    });
    return this.usersService.findOne(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteAccount(@ReqUser('id') userId): Promise<boolean> {
    await this.usersService.remove(userId);
    return true;
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async searchByUsername(
    @Query('page', new DefaultValuePipe(1)) page: number,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize: number,
    @Query('usernamePattern') pattern: string,
  ): Promise<PaginatedResponse<User>> {
    return this.usersService.searchByUsername({ page, pageSize }, pattern);
  }

  /*
    This endpoint could be also limited to admin-only access.
    It depends on how private the app would be.
  */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  // @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1)) page: number,
    @Query('pageSize', new DefaultValuePipe(10)) pageSize: number,
  ): Promise<User[]> {
    return this.usersService.findAll(page, pageSize);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @ReqUser('id') userId: string,
    @ReqUser('role') userRole: string,
  ): Promise<User> {
    if (
      (userId.toString() !== id && userRole !== 'admin') ||
      (updateUserDto.role && userRole !== 'admin')
    ) {
      throw new HttpException('Access forbidden', ECustomError.FORBIDDEN);
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<boolean> {
    await this.usersService.remove(id);
    return true;
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @ReqUser('id') userId: string,
    @UploadedFile(new FileSizeValidationPipe()) file,
  ) {
    if (!file) {
      throw new HttpException('File is required', ECustomError.BAD_REQUEST);
    }

    return this.usersService.uploadProfilePicture(userId, file);
  }
}
