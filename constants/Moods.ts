import { MoodTag } from '@/types';
import { Colors } from './Colors';

export interface MoodOption {
  tag: MoodTag;
  label: string;
  emoji: string;
  color: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { tag: 'happy', label: 'うれしい', emoji: '😊', color: Colors.moodHappy },
  { tag: 'sad', label: 'かなしい', emoji: '😢', color: Colors.moodSad },
  { tag: 'excited', label: 'わくわく', emoji: '✨', color: Colors.moodExcited },
  { tag: 'tired', label: 'つかれた', emoji: '😴', color: Colors.moodTired },
  { tag: 'peaceful', label: 'おだやか', emoji: '🌿', color: Colors.moodPeaceful },
  { tag: 'anxious', label: 'ふあん', emoji: '😰', color: Colors.moodAnxious },
  { tag: 'grateful', label: 'かんしゃ', emoji: '🙏', color: Colors.moodGrateful },
  { tag: 'nostalgic', label: 'なつかしい', emoji: '🌸', color: Colors.moodNostalgic },
];
