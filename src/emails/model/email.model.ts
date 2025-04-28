import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Email extends Document {
  @Prop({ required: true })
  to: string;

  @Prop({ required: true })
  from: string;

  @Prop()
  subject: string;

  @Prop()
  text: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  attachmentKeys: string[];

  // This property is used for workspace deletion. If a workspace is about to be removed, emails
  // will remain in the database but should be flagged as inactive to avoid conflicts if a new
  // workspace with the same email is created.
  @Prop({ required: true })
  isActive: boolean;
}

export const EmailSchema = SchemaFactory.createForClass(Email);
