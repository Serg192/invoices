import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import mongoose from 'mongoose';
import { WorkspaceMember } from './workspaceMember.model';

@Schema({ timestamps: true })
export class Workspace extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ unique: true })
  email: string;

  @Prop()
  about: string;

  @Prop()
  picture?: string;

  @Prop({
    required: true,
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceMember' }],
  })
  members: WorkspaceMember[];
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);

WorkspaceSchema.pre('save', async function (this: Workspace, next) {
  console.log('Pre save');
  if (!this.email) {
    this.email = `${this._id}@${process.env.WORKSPACE_DOMAIN}`;
  }
  next();
});
