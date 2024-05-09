import os from 'os';
import { OsName } from './types';

export function getOsName(): OsName {
  return os.platform();
}
