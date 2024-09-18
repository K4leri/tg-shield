// config.ts
import configJson from '../../config.json' assert { type: 'json' };
import { Config } from '../types/config.js';

const config: Config = configJson;
export {config}