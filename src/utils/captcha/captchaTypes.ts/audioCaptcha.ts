import { EdgeSpeechTTS } from '@lobehub/tts';
import { Buffer } from 'buffer';
import { audioCaptchaOptions } from '../../../types/captcha.js';


class AudioCaptcha {
  private tts: EdgeSpeechTTS;
  private num1: number;
  private num2: number;
  private operator: string;
  private options: audioCaptchaOptions;
  correctAnswer: number;

  constructor(options: audioCaptchaOptions) {
    this.options = options;
    this.tts = new EdgeSpeechTTS();
    this.num1 = 0;
    this.num2 = 0;
    this.operator = '';
    this.correctAnswer = 0;
  }

  generateCaptcha(): void {
    this.num1 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '*', '/'];
    this.operator = operators[Math.floor(Math.random() * operators.length)];

    if (this.operator === '/') {
      this.num2 = Math.floor(Math.random() * this.num1) + 1;
      while (this.num1 % this.num2 !== 0) {
        this.num2 = Math.floor(Math.random() * this.num1) + 1;
      }
    } else {
      this.num2 = Math.floor(Math.random() * 10) + 1;
    }

    this.correctAnswer = eval(`${this.num1} ${this.operator} ${this.num2}`);
  }

  public async getAudio(options: audioCaptchaOptions = this.options): Promise<Buffer> {
    this.generateCaptcha()

    const operatorTranslations: { [key in typeof this.operator]: string } = {
      '+': 'плюс',
      '-': 'минус',
      '*': 'умножить на',
      '/': 'поделить на',
    };

    const numberTranslations: { [key: number]: string } = {
      1: 'один',
      2: 'два',
      3: 'три',
      4: 'четыре',
      5: 'пять',
      6: 'шесть',
      7: 'семь',
      8: 'восемь',
      9: 'девять',
      10: 'десять',
    };

    const payload = {
      input: `${numberTranslations[this.num1]} ${operatorTranslations[this.operator]} ${numberTranslations[this.num2]} равно`,
      options: {
        voice: options.voice,
      },
    };

    // const startTime = performance.now();
    const response = await this.tts.create(payload);
    // const endTime = performance.now();
    // const executionTime = endTime - startTime;
    // console.log(`Execution time: ${executionTime} ms`);

    return Buffer.from(await response.arrayBuffer());
  }

  public verifyAnswer(answer: number): boolean {
    return answer === this.correctAnswer;
  }
}


export default AudioCaptcha;
