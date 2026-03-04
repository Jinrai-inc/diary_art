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
  photoDescription?: string,
  imageInstruction?: string
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。.env ファイルに EXPO_PUBLIC_OPENAI_API_KEY を設定してください。');
  }
  const moodDescription = moodTags.map((t) => MOOD_TAG_LABELS[t]).join('、');
  const photoContext = photoDescription
    ? `参考写真の要素を取り入れて、`
    : '';
  const userInstruction = imageInstruction
    ? `User's specific request for this image (highest priority): ${imageInstruction}`
    : '';

  const prompt = `
    A heartwarming couple's diary illustration in a cute Japanese storybook watercolor style.
    Today's diary entry (Japanese): 「${text}」
    Mood: ${moodDescription}
    ${photoContext}
    ${userInstruction}
    Art style: soft watercolor washes with clean ink outlines, warm and cozy atmosphere, vibrant but gentle colors.
    Characters: cute chibi-proportioned figures with clearly drawn expressive faces — visible eyes, smiles, and emotions matching the diary mood.
    Color palette: warm oranges, golden yellows, soft reds, and warm blues. Rich saturation, not pale or washed-out.
    Scene: detailed background that reflects the diary content (location, season, time of day, activities described).
    Lighting: warm golden hour or soft indoor light.
    Composition: portrait (vertical) orientation.
    Strict rules: NO text, letters, words, numbers, or symbols anywhere in the image.
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
