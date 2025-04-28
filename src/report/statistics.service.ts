import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import {
  Period,
  getLastWeekPeriod,
  getMonthName,
} from 'src/_helpers/date.helper';
import { Email } from 'src/emails/model/email.model';
import { Workspace } from 'src/workspaces/models/workspace.model';

export interface WeeklyStatictics {
  workspaceName: string;
  newMembers: number;
  emailsReceived: number;
  invoicesHandled: number;
  emailsTotal: number;
  invoicesTotal: number;
}

export interface InvoiceStatistics {
  emails: number;
  attachments: number;
}

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Workspace.name)
    private readonly workspaceModel,
    @InjectModel(Email.name) private emailModel,
  ) {}

  async getWeeklyStatistics(workspaceId): Promise<WeeklyStatictics> {
    const workspace = await this.workspaceModel.findOne({ _id: workspaceId });
    const period = getLastWeekPeriod();

    const newMembers = await this.getNewMembersCountForPeriod(
      workspaceId,
      period,
    );

    const emailsStatisticsWeek = await this.getEmailsStatisticsForPeriod(
      workspace.email,
      period,
    );

    const emailsStatisticsTotal = await this.getEmailsStatisticsForPeriod(
      workspace.email,
    );

    return {
      workspaceName: workspace.name,
      newMembers: newMembers,
      emailsReceived: emailsStatisticsWeek.emails,
      invoicesHandled: emailsStatisticsWeek.attachments,
      emailsTotal: emailsStatisticsTotal.emails,
      invoicesTotal: emailsStatisticsTotal.attachments,
    };
  }

  async getEmailsStatisticsForPeriod(
    to: string,
    period?: Period,
  ): Promise<InvoiceStatistics> {
    const matchStage: any = { to, isActive: true };

    if (period) {
      matchStage.date = { $gte: period[0], $lte: period[1] };
    }

    const result = await this.emailModel.aggregate([
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: null,
          emails: { $sum: 1 },
          attachments: { $sum: { $size: '$attachmentKeys' } },
        },
      },
    ]);

    const { emails = 0, attachments = 0 } = result[0] || {};

    return { emails, attachments };
  }

  private async getNewMembersCountForPeriod(
    workspaceId: string,
    period: Period,
  ): Promise<number> {
    const newMembersCount = await this.workspaceModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(workspaceId),
        },
      },
      {
        $lookup: {
          from: 'workspacemembers',
          localField: 'members',
          foreignField: '_id',
          as: 'membersData',
        },
      },
      {
        $unwind: '$membersData',
      },
      {
        $match: {
          'membersData.createdAt': { $gte: period[0], $lte: period[1] },
        },
      },
      {
        $count: 'count',
      },
    ]);
    return newMembersCount.length > 0 ? newMembersCount[0].count : 0;
  }

  async getYearStatistics(
    to: string,
  ): Promise<{ month: string; invoices: number; emails: number }[]> {
    const startDate = new Date(new Date().getFullYear(), 0, 1);
    const endDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

    const result = await this.emailModel.aggregate([
      {
        $match: {
          to,
          date: { $gte: startDate, $lte: endDate },
          isActive: true,
        },
      },
      {
        $group: {
          _id: { month: { $month: '$date' }, emailId: '$_id' },
          count: { $sum: 1 },
          attachmentCount: { $sum: { $size: '$attachmentKeys' } },
        },
      },
      {
        $group: {
          _id: '$_id.month',
          emailCount: { $sum: 1 },
          attachmentCount: { $sum: '$attachmentCount' },
        },
      },
      {
        $project: {
          _id: 0,
          month: '$_id',
          emailCount: 1,
          attachmentCount: 1,
        },
      },
    ]);

    const statistics: { month: string; invoices: number; emails: number }[] =
      [];
    for (let i = 1; i <= 12; i++) {
      const monthData = result.find((item) => item.month === i);
      statistics.push({
        month: getMonthName(i),
        emails: monthData ? monthData.emailCount : 0,
        invoices: monthData ? monthData.attachmentCount : 0,
      });
    }

    return statistics;
  }
}
