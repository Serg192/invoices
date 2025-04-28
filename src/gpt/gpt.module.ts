import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { GptController } from './gpt.controller';
import { GptService } from './gpt.service';

// JWT Checks
import { JwtService } from '@nestjs/jwt';
import { User, UserSchema } from '../users/models/user.model';
import { UsersService } from '../users/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [GptController],
  providers: [GptService, UsersService, JwtService],
  exports: [GptService],
})
export class GptModule {}
