import { BadRequestException, PipeTransform, Injectable } from '@nestjs/common';
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_B = MAX_FILE_SIZE_MB * 1024 * 1024;

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  transform(value: any) {
    // "value" is an object containing the file's attributes and metadata
    if (value?.size > MAX_FILE_SIZE_B) {
      throw new BadRequestException(
        `Validation error! Maximum file size is ${MAX_FILE_SIZE_MB}MB`,
      );
    }

    return value;
  }
}
