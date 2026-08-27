import { readFileSync, writeFileSync, existsSync } from 'fs';

const STATE_PATH = new URL('../state.json', import.meta.url).pathname;

export function loadState() {
  if (!existsSync(STATE_PATH)) return {};
  return JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
}

export function saveState(state) {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}
