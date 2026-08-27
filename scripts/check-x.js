import { TwitterApi } from 'twitter-api-v2';
import 'dotenv/config';
import { readFileSync } from 'fs';
import { loadState, saveState } from './state.js';
import { notify, notifyError } from './notify.js';

const CONFIG_PATH = new URL('../config.json', import.meta.url).pathname;
const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));

const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_SECRET,
});

async function checkAccount(account, state) {
  state.x = state.x ?? {};
  const saved = state.x[account.id] ?? {};

  let userId = saved.userId;
  if (!userId) {
    const user = await client.v2.userByUsername(account.username);
    userId = user.data.id;
  }

  // v2 timelineはsince_id指定時もmax_results>=5が必要
  const params = { max_results: 5, 'tweet.fields': ['created_at'] };
  if (saved.lastTweetId) params.since_id = saved.lastTweetId;

  const timeline = await client.v2.userTimeline(userId, params);
  const tweets = timeline.data?.data ?? [];

  const isFirstRun = !saved.lastTweetId;
  const newestId = tweets[0]?.id ?? saved.lastTweetId;

  state.x[account.id] = { userId, lastTweetId: newestId ?? saved.lastTweetId };

  if (!isFirstRun) {
    const matched = tweets.filter((t) => account.keywords.some((kw) => t.text.includes(kw)));
    for (const t of matched.reverse()) {
      await notify({
        title: `🐦 新着ツイート: ${account.label}`,
        message: t.text,
        url: `https://x.com/${account.username}/status/${t.id}`,
      });
    }
    console.log(`[x] ${account.id}: 新着${tweets.length}件中${matched.length}件が該当`);
  } else {
    console.log(`[x] ${account.id}: 初回のためベースラインのみ保存`);
  }
}

export async function runCheckX() {
  const state = loadState();
  for (const account of config.xAccounts) {
    try {
      await checkAccount(account, state);
    } catch (e) {
      console.error(`[x] ${account.id} 取得失敗:`, e.message);
      await notifyError(`X監視(${account.label})`, e.message);
    }
  }
  saveState(state);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCheckX();
}
