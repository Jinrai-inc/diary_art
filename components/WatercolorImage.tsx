import { Image, ImageStyle, StyleProp, StyleSheet } from 'react-native';

type Props = {
  uri: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
};

/**
 * 写真を水彩画風フィルターで表示するコンポーネント。
 * React Native の filter スタイルと blurRadius を組み合わせて
 * 水彩絵具の柔らかさ・温かみを表現します。
 */
export function WatercolorImage({ uri, style, resizeMode = 'cover' }: Props) {
  return (
    <Image
      source={{ uri }}
      style={[style, styles.watercolor]}
      resizeMode={resizeMode}
      blurRadius={1.2}
    />
  );
}

const styles = StyleSheet.create({
  watercolor: {
    // 彩度を高め、コントラストを柔らかく、暖色のセピアをわずかにのせる
    filter: [
      { saturate: 1.35 },
      { brightness: 1.08 },
      { contrast: 0.80 },
      { sepia: 0.15 },
    ],
  } as any,
});
