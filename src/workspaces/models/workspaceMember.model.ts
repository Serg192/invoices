import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from 'src/users/models/user.model';
import mongoose from 'mongoose';
import { WorkspaceRole } from './workspaceRole.model';

@Schema({ timestamps: true })
export class WorkspaceMember extends Document {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  user: User;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkspaceRole',
  })
  role: WorkspaceRole;
}

export const WorkspaceMemberSchema =
  SchemaFactory.createForClass(WorkspaceMember);
