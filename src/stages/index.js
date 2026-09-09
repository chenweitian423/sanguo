import { STAGE1 } from './stage1.js';
import { STAGE2 } from './stage2.js';
import { STAGE3 } from './stage3.js';
import { STAGE4 } from './stage4.js';
import { STAGE5 } from './stage5.js';
import { STAGE6 } from './stage6.js';
import { STAGE7 } from './stage7.js';

export const STAGE_SCRIPTS = {
  1: STAGE1,
  2: STAGE2,
  3: STAGE3,
  4: STAGE4,
  5: STAGE5,
  6: STAGE6,
  7: STAGE7,
};

export function stageScript(stageId) {
  return STAGE_SCRIPTS[stageId] || null;
}
