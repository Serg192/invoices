import { IsNotEmpty } from 'class-validator';

export class DownloadInvoicesDto {
  @IsNotEmpty()
  invoicesUrls: string[];
}
