// // progressDataInterface.ts
// export interface ProgressData {
//     rateLimiter: {
//       bucketSize: number;
//     };
//     chatId: number; // Update chatId to be a string
// }

export interface ProgressBarSettings{ 
  maxLengthOfBar: number;
  bucketSize: number, 
  chatId: number 
}