import { Injectable } from '@nestjs/common';
import { openai } from '../_config';

@Injectable()
export class GptService {
  #jobSystemMessage = `you are an expert copywriter`;
  #maxTokens = 3000;
  #model = 'gpt-3.5-turbo';

  async generateDemoContent() {
    const response = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: this.#jobSystemMessage,
        },
        {
          role: 'user',
          content: `Generate a random bio for the user from 150 to 300 characters`,
        },
      ],
      model: this.#model,
      max_tokens: this.#maxTokens,
    });

    return response.choices[0].message.content;
  }
}
