import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  senderId: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Chat', required: true })
  linkedChat: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.virtual('sender', {
  ref: 'User',
  localField: 'senderId',
  foreignField: '_id',
  justOne: true,
});

MessageSchema.set('toJSON', { virtuals: true });
