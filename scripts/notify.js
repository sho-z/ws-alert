import axios from 'axios';
import 'dotenv/config';

const NTFY_TOPIC = process.env.NTFY_TOPIC;
const NTFY_BASE = process.env.NTFY_SERVER || 'https://ntfy.sh';

export async function notify({ title, message, url, priority = 'urgent', tags = ['rotating_light'] }) {
  if (!NTFY_TOPIC) {
    console.error('NTFY_TOPIC が未設定です。.env を確認してください。');
    return;
  }

  const headers = {
    Title: Buffer.from(title, 'utf-8').toString(),
    Priority: priority,
    Tags: tags.join(','),
  };
  if (url) headers.Click = url;

  try {
    await axios.post(`${NTFY_BASE}/${NTFY_TOPIC}`, message, {
      headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' },
    });
    console.log(`通知送信: ${title}`);
  } catch (e) {
    console.error('通知送信失敗:', e.message);
  }
}

export async function notifyError(source, message) {
  await notify({
    title: `⚠️ ws-alert エラー: ${source}`,
    message,
    priority: 'default',
    tags: ['warning'],
  });
}
