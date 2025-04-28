import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Chat extends Document {
  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'User', required: true })
  recipients: string[];
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
