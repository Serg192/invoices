import { Types } from 'mongoose';
import {
  Controller,
  Get,
  Param,
  UseGuards,
  HttpException,
  Query,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ECustomError } from '../_exceptions/error-codes';
import { JwtAuthGuard } from '../_guards';
import { ReqUser } from '../_decorators/user.decorator';
import { PaginationDto } from './dto/pagination.dto';

@Controller({
  path: 'chat',
  version: '1',
})
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get('all')
  async getChats(@ReqUser('id') userId: string): Promise<any> {
    return this.chatService.findMyChats(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  async getChat(
    @ReqUser('id') userId: string,
    @Param('id') chatId: string,
    @Query() pagination: PaginationDto,
  ): Promise<any> {
    if (!Types.ObjectId.isValid(chatId)) {
      throw new HttpException(
        'Parameter should be ObjectId',
        ECustomError.BAD_REQUEST,
      );
    }

    return this.chatService.findOne(userId, chatId, pagination);
  }
}
