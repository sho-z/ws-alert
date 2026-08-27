import { runCheckPages } from './check-pages.js';
import { runCheckNews } from './check-news.js';
import { runCheckX } from './check-x.js';

function isQuietHours() {
  const hourJST = Number(
    new Intl.DateTimeFormat('ja-JP', { hour: 'numeric', hour12: false, timeZone: 'Asia/Tokyo' }).format(new Date())
  );
  return hourJST >= 0 && hourJST < 7;
}

async function main() {
  if (isQuietHours()) {
    console.log('0:00-7:00は監視を停止中のためスキップします。');
    return;
  }

  await runCheckPages();
  await runCheckNews();
  await runCheckX();
}

main().catch((e) => {
  console.error('main.js 実行エラー:', e);
  process.exit(1);
});
