import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Document } from 'mongoose';
import { Workspace } from './workspace.model';
import { BranchOperatorWMemberRole } from 'src/_config/workspace';

@Schema({ timestamps: true })
export class WorkspaceRole extends Document {
  @Prop({ required: true })
  roleType: BranchOperatorWMemberRole;

  @Prop({ required: true })
  roleName: string;

  @Prop()
  description?: string;

  @Prop()
  criticalRoleFeature?: string;

  @Prop({ required: true, default: [] })
  permissions: string[];

  // This property is only used with workspace-specific customizable roles
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' })
  workspace: Workspace;
}

export const WorkspaceRoleSchema = SchemaFactory.createForClass(WorkspaceRole);
