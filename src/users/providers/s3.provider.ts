import { Injectable } from '@nestjs/common';
import * as AWS from '@aws-sdk/client-s3';

@Injectable()
export class S3Provider {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile(
    userId,
    file,
    customKey,
    contentType?: string,
  ): Promise<string> {
    const extension = file.originalname.split('.').pop();
    const key = `${userId}/${customKey || 'avatar'}-${Date.now()}.${extension}`;
    return await this.putObject(key, file.buffer, contentType);
  }

  async getObject(key: string) {
    const args = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    return await this.s3.getObject(args);
  }

  async putObject(key: string, object, contentType?: string): Promise<string> {
    const args = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: object,
      ContentType: contentType,
    };
    await this.s3.putObject(args);
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
  }

  async deleteObject(key: string) {
    const args = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    await this.s3.deleteObject(args);
  }

  async deleteFile(fileURL: string) {
    const fileKey = fileURL.split('/').slice(3).join('/');
    this.deleteObject(fileKey);
  }
}
