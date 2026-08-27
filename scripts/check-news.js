import axios from 'axios';
import * as cheerio from 'cheerio';
import { readFileSync } from 'fs';
import { loadState, saveState } from './state.js';
import { notify, notifyError } from './notify.js';

const CONFIG_PATH = new URL('../config.json', import.meta.url).pathname;
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));

const UA = 'ws-alert/1.0 (personal reservation monitor; contact: local use only)';

function extractMatchingLinks(html, baseUrl, keywords) {
  const $ = cheerio.load(html);
  const matches = [];
  $('a').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    const href = $(el).attr('href');
    if (!text || !href) return;
    if (keywords.some((kw) => text.includes(kw))) {
      const absoluteUrl = new URL(href, baseUrl).toString();
      matches.push({ text, url: absoluteUrl });
    }
  });
  return matches;
}

async function checkTarget(target, state) {
  const res = await axios.get(target.url, { headers: { 'User-Agent': UA }, timeout: 15000 });
  const matches = extractMatchingLinks(res.data, target.url, target.titleKeywords);

  state.news = state.news ?? {};
  const prevSeen = new Set(state.news[target.id] ?? []);
  const isFirstRun = state.news[target.id] === undefined;

  const newOnes = matches.filter((m) => !prevSeen.has(m.url));
  state.news[target.id] = [...new Set([...prevSeen, ...matches.map((m) => m.url)])];

  if (!isFirstRun) {
    for (const item of newOnes) {
      await notify({
        title: `📰 新着: ${target.label}`,
        message: `${item.text}\n${item.url}`,
        url: item.url,
      });
    }
  }

  console.log(`[news] ${target.id}: 検出${matches.length}件 / 新規${isFirstRun ? '(初回のため通知なし)' : newOnes.length}件`);
}

export async function runCheckNews() {
  const state = loadState();
  for (const target of config.newsWatch) {
    try {
      await checkTarget(target, state);
    } catch (e) {
      console.error(`[news] ${target.id} 取得失敗:`, e.message);
      await notifyError(`お知らせ監視(${target.label})`, e.message);
    }
  }
  saveState(state);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCheckNews();
}
