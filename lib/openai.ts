import { MoodTag } from '@/types';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

if (!OPENAI_API_KEY) {
  console.warn('[OpenAI] EXPO_PUBLIC_OPENAI_API_KEY が .env に設定されていません');
}

const MOOD_TAG_LABELS: Record<MoodTag, string> = {
  happy: '幸せ・嬉しい',
  sad: '悲しい・寂しい',
  excited: 'ワクワク・興奮',
  tired: '疲れた・ぐったり',
  peaceful: '穏やか・落ち着いた',
  anxious: '不安・心配',
  grateful: '感謝・ありがたい',
  nostalgic: '懐かしい・センチメンタル',
};

export async function generateWatercolorImage(
  text: string,
  moodTags: MoodTag[],
  photoDescription?: string
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。.env ファイルに EXPO_PUBLIC_OPENAI_API_KEY を設定してください。');
  }
  const moodDescription = moodTags.map((t) => MOOD_TAG_LABELS[t]).join('、');
  const photoContext = photoDescription
    ? `参考写真の要素を取り入れて、`
    : '';

  const prompt = `
    温かみのある絵本風・日本のマンガ日記スタイルの水彩イラスト。
    日記の内容: 「${text}」
    気分: ${moodDescription}
    ${photoContext}
    描写の要件:
    - 登場人物の顔をはっきり描き、目・表情・笑顔をわかりやすく表現すること
    - オレンジ・黄色・淡い赤・温かみのある青など、彩度の高い暖色系カラー
    - 水彩の柔らかい色面に、ペン風の輪郭線を加えたスタイル
    - 日記の場面に合った背景（室内外・季節・時間帯）を描くこと
    - 人物はちびキャラまたは絵本のような丸みのある体型
    - 温かいゴールドや柔らかい光の雰囲気
    - 画像内にテキスト・文字・記号は一切含めないこと
    - 縦向き（portrait）の構図
  `.trim();

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1792',
      quality: 'hd',
      style: 'vivid',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    const message = error.error?.message ?? '画像生成に失敗しました';
    const code = error.error?.code ?? response.status;
    console.error('[OpenAI] Error:', code, message);
    throw new Error(`[OpenAI ${code}] ${message}`);
  }

  const data = await response.json();
  return data.data[0].url as string;
}
