import { Types } from 'mongoose';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { UsersService } from '../users/user.service';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io-client';
import * as jwt from 'jsonwebtoken';
import { User } from '../users/models/user.model';

@WebSocketGateway(8080, {
  cors: '*',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map();

  constructor(
    private readonly usersService: UsersService,
    private readonly chatService: ChatService,
  ) {}

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() payload: { message: string; toUserId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    if (!payload.toUserId || !payload.message) {
      this.server.to(client.id).emit('error', {
        msg: "'toUserId' and 'message' cannot be empty",
      });
      return;
    }

    const recipientId = payload.toUserId;
    if (!Types.ObjectId.isValid(recipientId)) {
      this.server.to(client.id).emit('error', {
        msg: "'toUserId' should be ObjectId",
      });
      return;
    }

    const foundUser = await this.usersService.findOne(recipientId);
    if (!foundUser) {
      this.server.to(client.id).emit('error', {
        msg: "User from 'toUserId' has not been found",
      });
    }

    // Send message to the user in any case
    const senderId = this.connectedUsers.get(client.id);
    const recipients = [senderId, recipientId];

    const sentMessage = await this.chatService.sendMessage(
      recipients,
      payload.message,
    );

    // Notify the recipient if they are online
    const foundOnlineRecipient = this.getByValue(
      this.connectedUsers,
      recipientId,
    );

    if (foundOnlineRecipient) {
      this.server.to(foundOnlineRecipient).emit('receivedMessage', sentMessage);
    }
  }

  async handleConnection(@ConnectedSocket() socket: any) {
    const token = socket.handshake.headers.authorization;

    let user;
    try {
      user = await this.getUserByTokenOrLogError(token);
      if (!user) {
        throw new Error('User not found');
      }
    } catch {
      this.server.to(socket.id).emit('error', {
        msg: 'Authorization failed!',
      });
      return socket.disconnect(false);
    }

    this.connectedUsers.set(socket.id, user._id.toString());
  }

  private async getUserByTokenOrLogError(token: string): Promise<User> {
    const jwtData = this.validateToken(token);
    const user = await this.usersService.findByEmail(jwtData.username);

    if (!user) {
      // this.logger.error('No user with this Id found!');
      return null;
    }

    return user;
  }

  async handleDisconnect(client: Socket) {
    const disconnectedUserId = client.id;
    this.connectedUsers.delete(disconnectedUserId);
  }

  private validateToken(auth: string): any {
    if (!auth || auth.split(' ')[0] !== 'Bearer') {
      throw new WsException('Token is either invalid or expired.');
    }
    try {
      const token = auth.split(' ')[1];

      return jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET);
    } catch (error) {
      const message = 'Token Error: ' + (error.message || error.name);
      console.error(message);
      return null;
    }
  }

  private getByValue(map, searchValue: string) {
    for (const [key, value] of map.entries()) {
      if (value === searchValue) return key;
    }
  }
}
