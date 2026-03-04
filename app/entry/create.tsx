import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEntryStore } from '@/store/entryStore';
import { MoodTag } from '@/types';
import { MOOD_OPTIONS } from '@/constants/Moods';
import { Colors } from '@/constants/Colors';

export default function CreateEntryScreen() {
  const { draft, setDraft, createAndGenerateEntry, isGenerating } = useEntryStore();
  const [charCount, setCharCount] = useState(draft.text.length);

  const handleTextChange = (text: string) => {
    setDraft({ text });
    setCharCount(text.length);
  };

  const toggleMoodTag = (tag: MoodTag) => {
    const current = draft.moodTags;
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    setDraft({ moodTags: next });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限が必要です', 'フォトライブラリへのアクセスを許可してください');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setDraft({ photoUri: result.assets[0].uri });
    }
  };

  const canGenerate = draft.text.trim().length > 0 && draft.moodTags.length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    const entry = await createAndGenerateEntry();
    if (entry) {
      router.replace('/entry/result');
    } else {
      const { lastError } = useEntryStore.getState();
      Alert.alert(
        '生成エラー',
        lastError ?? '生成に失敗しました。もう一度お試しください。'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Text */}
        <View style={styles.step}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <Text style={styles.stepTitle}>今日のひとこと</Text>
          </View>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={draft.text}
              onChangeText={handleTextChange}
              placeholder="今日あったこと、感じたことを書いてね"
              placeholderTextColor={Colors.textLight}
              multiline
              maxLength={140}
              textAlignVertical="top"
            />
            <Text
              style={[
                styles.charCount,
                charCount > 120 && styles.charCountWarning,
              ]}
            >
              {charCount}/140
            </Text>
          </View>
        </View>

        {/* Step 2: Mood tags */}
        <View style={styles.step}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <Text style={styles.stepTitle}>今日の気分</Text>
            <Text style={styles.stepSubtitle}>（複数選択可）</Text>
          </View>
          <View style={styles.moodGrid}>
            {MOOD_OPTIONS.map((mood) => {
              const isSelected = draft.moodTags.includes(mood.tag);
              return (
                <TouchableOpacity
                  key={mood.tag}
                  style={[
                    styles.moodChip,
                    { backgroundColor: mood.color + '33' },
                    isSelected && {
                      backgroundColor: mood.color,
                      borderColor: mood.color,
                    },
                  ]}
                  onPress={() => toggleMoodTag(mood.tag)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      isSelected && { color: Colors.text, fontWeight: '600' },
                    ]}
                  >
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Step 3: Photo (optional) */}
        <View style={styles.step}>
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, styles.stepBadgeOptional]}>
              <Text style={[styles.stepNumber, styles.stepNumberOptional]}>3</Text>
            </View>
            <Text style={styles.stepTitle}>写真を追加</Text>
            <Text style={styles.stepSubtitle}>（任意）</Text>
          </View>
          {draft.photoUri ? (
            <View style={styles.photoPreview}>
              <Image
                source={{ uri: draft.photoUri }}
                style={styles.photo}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removePhoto}
                onPress={() => setDraft({ photoUri: null })}
              >
                <Ionicons name="close-circle" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
              <Ionicons name="camera-outline" size={32} color={Colors.textLight} />
              <Text style={styles.photoButtonText}>写真を選ぶ</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Generate button */}
        {canGenerate && (
          <TouchableOpacity
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <View style={styles.generatingContent}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.generateButtonText}>水彩画を生成中...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.generateButtonText}>✨ 生成する</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 28,
  },
  step: {
    gap: 14,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeOptional: {
    backgroundColor: Colors.border,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepNumberOptional: {
    color: Colors.textSecondary,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  stepSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  textInputContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  textInput: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'right',
  },
  charCountWarning: {
    color: Colors.warning,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  photoButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  photoButtonText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  photoPreview: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 240,
  },
  removePhoto: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  generateButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 50,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  generatingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
