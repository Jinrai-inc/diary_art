import * as FileSystem from 'expo-file-system';
import { MoodTag } from '@/types';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

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

export async function analyzePhoto(photoUri: string): Promise<string> {
  if (!OPENAI_API_KEY) return '';
  try {
    const base64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const res = await fetch(OPENAI_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                  detail: 'low',
                },
              },
              {
                type: 'text',
                text: 'Describe this photo in 1-2 sentences in English: focus on the main scene, location, key objects, people, time of day, weather, and overall atmosphere. Be specific and concrete.',
              },
            ],
          },
        ],
        max_tokens: 120,
      }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.choices[0]?.message?.content ?? '';
  } catch {
    return '';
  }
}

export async function generateWatercolorImage(
  text: string,
  moodTags: MoodTag[],
  photoDescription?: string
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。.env ファイルに EXPO_PUBLIC_OPENAI_API_KEY を設定してください。');
  }
  const moodDescription = moodTags.map((t) => MOOD_TAG_LABELS[t]).join('、');

  const sceneContext = photoDescription
    ? `Photo reference (use this as the primary basis for the scene): ${photoDescription}`
    : `Scene: create a scene directly based on the diary entry content — illustrate the specific location, activity, and atmosphere described.`;

  const prompt = `
    A warm couple's diary illustration in a cute Japanese storybook watercolor style.

    Diary entry (Japanese, this determines the scene): 「${text}」
    Mood: ${moodDescription}
    ${sceneContext}

    CRITICAL scene rule: The background and setting MUST closely match what is described in the diary and the photo reference. If the diary mentions the sea, draw the sea. If it mentions a city, draw a city. Stay true to the actual location and atmosphere.

    Art style: soft watercolor washes with clean ink outlines, warm and cozy atmosphere, vibrant but gentle colors.
    Characters: cute chibi-proportioned couple with clearly drawn expressive faces — visible eyes, smiles, emotions matching the mood.
    Color palette: warm and rich colors that suit the scene (ocean blues and sunny yellows for sea scenes, warm greens for nature, etc.). Rich saturation, not pale or washed-out.
    Lighting: natural light matching the scene (golden sunlight for outdoors, warm glow for indoors).
    Composition: wide landscape (horizontal) format — the scene extends broadly to the sides, panoramic view.
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
      size: '1792x1024',
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
