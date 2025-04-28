import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { AuthService } from 'src/auth/auth.service';
import { Message, Chat, MessageSchema, ChatSchema } from './models';

// JWT Checks
import { JwtService } from '@nestjs/jwt';
import { User, UserSchema } from '../users/models/user.model';
import { UsersService } from '../users/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [ChatController],
  providers: [ChatService, JwtService, UsersService, AuthService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
