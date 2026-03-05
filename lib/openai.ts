import * as FileSystem from 'expo-file-system';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_EDITS_URL = 'https://api.openai.com/v1/images/edits';

if (!OPENAI_API_KEY) {
  console.warn('[OpenAI] EXPO_PUBLIC_OPENAI_API_KEY が .env に設定されていません');
}

export async function applyWatercolorFilter(photoUri: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI APIキーが設定されていません。.env ファイルに EXPO_PUBLIC_OPENAI_API_KEY を設定してください。');
  }

  const formData = new FormData();
  formData.append('model', 'gpt-image-1');
  formData.append('image', {
    uri: photoUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);
  formData.append(
    'prompt',
    'Transform this photo into a beautiful soft watercolor painting. ' +
    'Preserve the original composition, subjects, and colors faithfully. ' +
    'Apply transparent watercolor washes, soft edges, gentle color bleeding, ' +
    'and delicate painterly brushstrokes. Keep the mood and atmosphere of the original photo.'
  );
  formData.append('size', '1024x1024');
  formData.append('quality', 'high');

  const response = await fetch(OPENAI_EDITS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    const message = error.error?.message ?? '水彩フィルターの適用に失敗しました';
    const code = error.error?.code ?? response.status;
    console.error('[OpenAI] Error:', code, message);
    throw new Error(`[OpenAI ${code}] ${message}`);
  }

  const data = await response.json();
  const base64 = data.data[0].b64_json as string;

  // base64 をキャッシュファイルに書き出してURIとして返す
  const tmpUri = `${FileSystem.cacheDirectory}watercolor_${Date.now()}.png`;
  await FileSystem.writeAsStringAsync(tmpUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return tmpUri;
}
