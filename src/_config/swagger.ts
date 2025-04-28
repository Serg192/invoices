import { DocumentBuilder } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('SDA Backend')
  .setVersion('1.0')
  .build();
