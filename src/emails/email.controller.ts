import {
  Body,
  Controller,
  UseGuards,
  Post,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { VerifyWithJwtDto } from 'src/auth/dto/verifyWithJwt.dto';
import { Response } from 'express';

@Controller({
  path: 'emails',
  version: '1',
})
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  async registerEmail(@Body() body: VerifyWithJwtDto): Promise<boolean> {
    return this.emailService.handleNewEmailReceived(body.token);
  }

  @Get('confirm-download-inv')
  async confirmDownload(
    @Res() res: Response,
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    const [success, msg] =
      await this.emailService.downloadInvoicesToGoogleDrive(code, state);

    res.redirect(
      `${process.env.NEXT_PUBLIC_CLIENT_URL}/workspace?download-success=${success}&message=${msg}`,
    );
  }
}
