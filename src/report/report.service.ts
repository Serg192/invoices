import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Workspace } from 'src/workspaces/models/workspace.model';
import { WorkspaceRolesService } from 'src/workspaces/workspaceRoles.service';
import { StatisticsService } from './statistics.service';
import { EmailService } from 'src/emails/email.service';

import * as schedule from 'node-schedule';

interface ReportConfig {
  emails: string[];
  workspaceId: string;
}

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Workspace.name)
    private readonly workspaceModel,
    private readonly workspaceRolesService: WorkspaceRolesService,
    private readonly statisticsService: StatisticsService,
    private readonly emailService: EmailService,
  ) {
    this.scheduleWeeklyReportAction();
  }

  private scheduleWeeklyReportAction() {
    // Every Sunday 23:30
    schedule.scheduleJob('30 23 * * 0', async () => {
      await this.makeWeeklyReport();
    });
  }

  async makeWeeklyReport(): Promise<void> {
    const weeklyReportConfig = await this.prepareReportConfig();

    weeklyReportConfig.forEach(async (cnf) => {
      const weeklyStats = await this.statisticsService.getWeeklyStatistics(
        cnf.workspaceId,
      );

      cnf.emails.forEach(async (em) => {
        this.emailService.sendWeeklyReport(em, weeklyStats);
      });
    });
  }

  private async prepareReportConfig(): Promise<ReportConfig[]> {
    const ownerRole = await this.workspaceRolesService.getDefaultRole('owner');
    const adminRole = await this.workspaceRolesService.getDefaultRole('admin');
    const roleIds = [ownerRole._id, adminRole._id];

    const workspaces = await this.workspaceModel.aggregate([
      { $unwind: '$members' },
      {
        $lookup: {
          from: 'workspacemembers',
          localField: 'members',
          foreignField: '_id',
          as: 'memberData',
        },
      },
      { $unwind: '$memberData' },
      { $match: { 'memberData.role': { $in: roleIds } } },
      {
        $lookup: {
          from: 'users',
          localField: 'memberData.user',
          foreignField: '_id',
          as: 'userData',
        },
      },
      { $unwind: '$userData' },
      {
        $group: {
          _id: '$_id',
          workspaceId: { $first: '$_id' },
          emails: { $addToSet: '$userData.email' },
        },
      },
      { $project: { _id: 0, workspaceId: 1, emails: 1 } },
    ]);

    return workspaces.map((workspace) => ({
      workspaceId: workspace.workspaceId.toString(),
      emails: workspace.emails,
    }));
  }
}
