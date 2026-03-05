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
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setDraft({ photoUri: result.assets[0].uri });
    }
  };

  const canSave = draft.text.trim().length > 0 && draft.moodTags.length > 0;
  const hasPhoto = !!draft.photoUri;

  const handleSubmit = async () => {
    if (!canSave) return;
    const entry = await createAndGenerateEntry();
    if (entry) {
      router.replace('/entry/result');
    } else {
      const { lastError } = useEntryStore.getState();
      Alert.alert(
        'エラー',
        lastError ?? '保存に失敗しました。もう一度お試しください。'
      );
    }
  };

  const loadingText = hasPhoto ? '水彩フィルターを適用中...' : '保存中...';
  const buttonLabel = hasPhoto ? '🎨 水彩フィルターをかける' : '💾 保存する';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: Photo */}
        <View style={styles.step}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <Text style={styles.stepTitle}>写真を選ぶ</Text>
            <Text style={styles.stepSubtitle}>（水彩フィルター用）</Text>
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
              <Ionicons name="camera-outline" size={36} color={Colors.primary} />
              <Text style={styles.photoButtonText}>写真を選ぶ</Text>
              <Text style={styles.photoButtonSub}>選んだ写真に水彩フィルターがかかります</Text>
            </TouchableOpacity>
          )}
          {draft.photoUri && (
            <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
              <Ionicons name="swap-horizontal-outline" size={16} color={Colors.textSecondary} />
              <Text style={styles.changePhotoText}>写真を変更</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Step 2: Text */}
        <View style={styles.step}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>2</Text>
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

        {/* Step 3: Mood tags */}
        <View style={styles.step}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepNumber}>3</Text>
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

        {/* Submit button */}
        {canSave && (
          <TouchableOpacity
            style={[styles.submitButton, isGenerating && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.submitButtonText}>{loadingText}</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>{buttonLabel}</Text>
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
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
  photoButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: Colors.primary + '66',
    borderStyle: 'dashed',
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  photoButtonSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  photoPreview: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 280,
  },
  removePhoto: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  changePhotoText: {
    fontSize: 14,
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
  submitButton: {
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
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
