import { STAGE1 } from './stage1.js';

export const STAGE_SCRIPTS = {
  1: STAGE1,
};

export function stageScript(stageId) {
  return STAGE_SCRIPTS[stageId] || null;
}
