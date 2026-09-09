import { STAGE1 } from './stage1.js';
import { STAGE2 } from './stage2.js';

export const STAGE_SCRIPTS = {
  1: STAGE1,
  2: STAGE2,
};

export function stageScript(stageId) {
  return STAGE_SCRIPTS[stageId] || null;
}
