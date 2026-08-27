import axios from 'axios';
import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { loadState, saveState } from './state.js';
import { notify, notifyError } from './notify.js';

const CONFIG_PATH = new URL('../config.json', import.meta.url).pathname;
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));

const UA = 'ws-alert/1.0 (personal reservation monitor; contact: local use only)';

function determineStatus(pageText, openKeywords, closedKeywords) {
  if (openKeywords.some((kw) => pageText.includes(kw))) return 'open';
  if (closedKeywords.some((kw) => pageText.includes(kw))) return 'closed';
  return 'unknown';
}

async function checkTarget(target, state) {
  const res = await axios.get(target.url, {
    headers: { 'User-Agent': UA },
    timeout: 15000,
  });
  const $ = cheerio.load(res.data);
  const pageText = $('body').text().replace(/\s+/g, '');

  const status = determineStatus(pageText, target.openKeywords, target.closedKeywords);
  const prev = state.pages?.[target.id];

  state.pages = state.pages ?? {};
  state.pages[target.id] = { status, checkedAt: new Date().toISOString() };

  const isFirstRun = prev === undefined;
  const becameOpen = !isFirstRun && prev.status !== 'open' && status === 'open';

  if (becameOpen) {
    await notify({
      title: `🎉 予約受付開始: ${target.label}`,
      message: `${target.label} の予約受付が始まった可能性があります。\n${target.url}`,
      url: target.url,
    });
  }

  console.log(`[pages] ${target.id}: ${prev?.status ?? '(初回)'} -> ${status}`);
}

export async function runCheckPages() {
  const state = loadState();
  for (const target of config.directPages) {
    try {
      await checkTarget(target, state);
    } catch (e) {
      console.error(`[pages] ${target.id} 取得失敗:`, e.message);
      await notifyError(`ページ監視(${target.label})`, e.message);
    }
  }
  saveState(state);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCheckPages();
}
