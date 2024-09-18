import * as canvas from 'canvas';
import path from 'path';
import { CaptchaOptions } from '../../../types/captcha.js';


class MathCaptcha {
  private canvas: canvas.Canvas;
  private ctx: canvas.CanvasRenderingContext2D;
  private num1: number;
  private num2: number;
  private operator: string;
  private options: CaptchaOptions
  correctAnswer: number;

  constructor(options: CaptchaOptions) {
    this.options = options
    this.canvas = canvas.createCanvas(options.width, options.height);
    this.ctx = this.canvas.getContext('2d');

    // Register the font
    const fontPath = path.join('./src/utils/captcha/fonts', 'Comismsh.ttf');
    const fontName = 'Comismsh';
    canvas.registerFont(fontPath, { family: fontName });

    // Set the font
    this.ctx.font = `${options.fontSize}px Comismsh`;

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.num1 = 0;
    this.num2 = 0;
    this.operator = '';
    this.correctAnswer = 0;

    this.generateCaptcha();
  }

  generateCaptcha(): void {
    this.num1 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '*', '/'];
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
  

  public getImage(options: CaptchaOptions = this.options): Buffer {
    this.ctx.fillStyle = '#FFFFFF'; // White background
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  
    if (options.addNoise) {
      // Add noise
      for (let i = 0; i < 500; i++) {
        const x = Math.floor(Math.random() * this.canvas.width);
        const y = Math.floor(Math.random() * this.canvas.height);
        this.ctx.fillStyle = `#${Math.floor(Math.random() * 16777215).toString(16)}`; // Random color
        this.ctx.fillRect(x, y, 2, 2);
      }

      
      // // Add curved lines
      // const numLines = Math.floor(Math.random() * 10) + 5; // Random number of lines between 5 and 15
      // for (let i = 0; i < numLines; i++) {
      //   this.ctx.beginPath();
      //   this.ctx.strokeStyle = `#${Math.floor(Math.random() * 16777215).toString(16)}`; // Random color
      //   this.ctx.lineWidth = Math.floor(Math.random() * 3) + 1; // Random line width between 1 and 4
      //   const x1 = Math.floor(Math.random() * this.canvas.width);
      //   const y1 = Math.floor(Math.random() * this.canvas.height);
      //   const x2 = Math.floor(Math.random() * this.canvas.width);
      //   const y2 = Math.floor(Math.random() * this.canvas.height);
      //   const cp1x = Math.floor(Math.random() * this.canvas.width);
      //   const cp1y = Math.floor(Math.random() * this.canvas.height);
      //   const cp2x = Math.floor(Math.random() * this.canvas.width);
      //   const cp2y = Math.floor(Math.random() * this.canvas.height);
      //   this.ctx.moveTo(x1, y1);
      //   this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2);
      //   this.ctx.stroke();
      // }
    }
  
    // Draw text
    const symbols = [this.num1.toString(), this.operator, this.num2.toString(), '=', '?'];
    let x = this.canvas.width / 2 - (symbols.length * 40) / 2 + 20;
 
    for (const symbol of symbols) {
      this.ctx.save(); // Save the current state of the canvas
      this.ctx.translate(x, this.canvas.height / 2); // Move the origin to the center of the symbol
      let angle;
      if (['+', '*', '/', '='].includes(symbol)) {
        angle = Math.random() * Math.PI / 180 * 30 - Math.PI / 180 * 15; // Random angle between -15 and 15 degrees
      } else {
        angle = Math.random() * Math.PI / 180 * 60 - Math.PI / 180 * 30; // Random angle between -30 and 30 degrees
      }
      this.ctx.rotate(angle); // Rotate the canvas
      let color;
      do {
        color = `#${Math.floor(Math.random() * 16777215).toString(16)}`; // Random color
      } while (this.isColorTooLight(color)); // Ensure the color is not too light
      this.ctx.fillStyle = color;
      this.ctx.fillText(symbol, 0, 5); // Draw the symbol at the origin
      this.ctx.restore(); // Restore the previous state of the canvas
      x += 40; // Increase the spacing between each number
    }

  
    return this.canvas.toBuffer();
  }
  
  private isColorTooLight(color: string): boolean {
    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);
    const lightness = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
    return lightness > 0.8; // If the lightness is greater than 0.8, the color is too light
  }
  

  public verifyAnswer(answer: number): boolean {
    return answer === this.correctAnswer;
  }
}

// Example usage:
export const captchaOptions: CaptchaOptions = {
  width: 240,
  height: 135,
  fontSize: 200,
  fontFamily: 'Comismsh',
  addNoise: true,
};

export default MathCaptcha

