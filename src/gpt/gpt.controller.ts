import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../_guards';
import { GptService } from './gpt.service';

@Controller({
  path: 'gpt',
  version: '1',
})
export class GptController {
  constructor(private readonly gptService: GptService) {}

  @Post('generate-bio')
  @UseGuards(JwtAuthGuard)
  async generateBio() {
    const userBio = await this.gptService.generateDemoContent();
    return {
      bio: userBio,
    };
  }
}
