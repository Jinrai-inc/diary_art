import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { useEntryStore } from '@/store/entryStore';
import { Entry } from '@/types';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');
const DAY_SIZE = (width - 40) / 7;

export default function GalleryScreen() {
  const { entries, fetchEntries, isLoading } = useEntryStore();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchEntries();
  }, []);

  const markedDates = entries.reduce<Record<string, any>>((acc, entry) => {
    const date = entry.created_at.split('T')[0];
    acc[date] = {
      marked: true,
      dotColor: Colors.primary,
      customStyles: {
        container: {
          backgroundColor: entry.generated_image_url
            ? Colors.calendarHasEntry
            : Colors.calendarToday,
          borderRadius: 8,
        },
        text: { color: '#FFFFFF', fontWeight: '600' },
      },
    };
    return acc;
  }, {});

  const today = new Date().toISOString().split('T')[0];
  if (!markedDates[today]) {
    markedDates[today] = {
      customStyles: {
        container: {
          borderWidth: 2,
          borderColor: Colors.primary,
          borderRadius: 8,
        },
        text: { color: Colors.primary, fontWeight: '600' },
      },
    };
  }

  const selectedEntry = selectedDate
    ? entries.find((e) => e.created_at.startsWith(selectedDate))
    : null;

  const monthEntries = entries.filter((e) => {
    const d = new Date(e.created_at);
    return (
      d.getMonth() === currentMonth.getMonth() &&
      d.getFullYear() === currentMonth.getFullYear()
    );
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Calendar
        markingType="custom"
        markedDates={markedDates}
        onDayPress={(day: { dateString: string }) =>
          setSelectedDate(day.dateString)
        }
        onMonthChange={(month: { year: number; month: number }) => {
          setCurrentMonth(new Date(month.year, month.month - 1));
        }}
        theme={{
          backgroundColor: Colors.background,
          calendarBackground: Colors.background,
          textSectionTitleColor: Colors.textSecondary,
          selectedDayBackgroundColor: Colors.primary,
          selectedDayTextColor: '#FFFFFF',
          todayTextColor: Colors.primary,
          dayTextColor: Colors.text,
          textDisabledColor: Colors.textLight,
          arrowColor: Colors.primary,
          monthTextColor: Colors.text,
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
        style={styles.calendar}
      />

      {/* Selected day entry preview */}
      {selectedDate && (
        <View style={styles.selectedSection}>
          <Text style={styles.selectedDate}>
            {new Date(selectedDate).toLocaleDateString('ja-JP', {
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            })}
          </Text>
          {selectedEntry ? (
            <TouchableOpacity
              style={styles.selectedEntry}
              onPress={() => router.push(`/entry/${selectedEntry.id}`)}
            >
              {selectedEntry.generated_image_url ? (
                <Image
                  source={{ uri: selectedEntry.generated_image_url }}
                  style={styles.selectedImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.selectedImage, styles.selectedImagePlaceholder]}>
                  <Text style={styles.placeholderEmoji}>🎨</Text>
                  <Text style={styles.placeholderText}>画像なし</Text>
                </View>
              )}
              <View style={styles.selectedContent}>
                <Text style={styles.selectedText} numberOfLines={3}>
                  {selectedEntry.text}
                </Text>
                <View style={styles.tagRow}>
                  {selectedEntry.mood_tags.map((tag) => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.noEntry}
              onPress={() => router.push('/entry/create')}
            >
              <Text style={styles.noEntryText}>この日の記録はありません</Text>
              {selectedDate === today && (
                <Text style={styles.noEntryAction}>+ 今日の記録を追加</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Month stats */}
      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>
          {currentMonth.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
          })} の記録
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{monthEntries.length}</Text>
            <Text style={styles.statLabel}>記録</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {monthEntries.filter((e) => e.is_shared).length}
            </Text>
            <Text style={styles.statLabel}>共有済み</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {monthEntries.filter((e) => e.generated_image_url).length}
            </Text>
            <Text style={styles.statLabel}>作品</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  calendar: {
    paddingBottom: 8,
  },
  selectedSection: {
    marginHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  selectedDate: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  selectedEntry: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  selectedImage: {
    width: '100%',
    height: 200,
  },
  selectedImagePlaceholder: {
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  selectedContent: {
    padding: 16,
    gap: 10,
  },
  selectedText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  noEntry: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  noEntryText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  noEntryAction: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  statsSection: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
});
