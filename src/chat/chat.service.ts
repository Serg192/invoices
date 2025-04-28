import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Message, Chat } from './models';
import { MessageDto, ChatDto } from './dto';
import { encrypt, decrypt } from '../_helpers/encrypt.helper';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
    @InjectModel(Chat.name) private readonly chatModel: Model<Chat>,
  ) {}

  async createChat(chat: ChatDto): Promise<Chat> {
    try {
      const createdChat = new this.chatModel(chat);
      await createdChat.save();

      return createdChat.toObject();
    } catch (e) {
      console.error(e);
    }
  }

  async findMyChats(userId: string): Promise<Chat[]> {
    return this.chatModel.find({ recipients: userId });
  }

  async findOne(
    userId: string,
    chatId: string,
    pagination: PaginationDto,
  ): Promise<any> {
    const chat = await this.chatModel.findOne({
      recipients: userId,
      _id: chatId,
    });
    const lastMessages = await this.messageModel
      .find({ linkedChat: chatId })
      .sort({ createdAt: -1 })
      .populate('sender', ['name', 'photo'])
      .skip(pagination.limit * (pagination.page - 1))
      .limit(pagination.limit);

    lastMessages.forEach((messageEntity: Message) => {
      delete messageEntity.linkedChat;
      messageEntity.message = decrypt(messageEntity.message);
    });

    return {
      chat,
      lastMessages,
    };
  }

  async deleteChat(userId: string, chatId: string): Promise<boolean> {
    await this.chatModel.findOneAndDelete({ recipients: userId, _id: chatId });

    return true;
  }

  async sendMessage(
    recipients: string[],
    message: string,
  ): Promise<MessageDto> {
    // Find existing chat
    let chatId = (await this.chatModel.findOne({ recipients }))?._id;

    // If not found - create a new one
    if (!chatId) {
      chatId = (await this.createChat({ recipients }))._id;
    }

    const senderId = recipients[1];

    const messageDto = {
      message: encrypt(message),
      senderId,
      linkedChat: chatId,
    } as MessageDto;

    const createdMessage = new this.messageModel(messageDto);
    await createdMessage.save();

    return {
      ...createdMessage.toObject(),
      message,
    };
  }
}
