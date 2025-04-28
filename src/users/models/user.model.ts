import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  email: string;

  @Prop({ required: true, default: false })
  password: string;

  @Prop({ required: true })
  role: string;

  @Prop()
  about?: string;

  @Prop({ required: false })
  profilePicture: string;

  @Prop({ required: true })
  emailVerified: boolean;

  @Prop({ required: true, default: false })
  accountDeleted: boolean;

  @Prop({ required: false })
  lastSeen: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
