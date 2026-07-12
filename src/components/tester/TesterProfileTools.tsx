import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Colors } from '../../res';
import {
  flashErrorMessage,
  flashSuccessMessage,
  TesterApi,
  useGlobalContext,
} from '../../services';

const insights = [
  ['blocks', 'Blocks'],
  ['recommendations', 'Recommendations'],
  ['likes', 'Likes'],
  ['visits', 'Visits'],
  ['chat_credits', 'Credits'],
  ['profile_completion', 'Completion %'],
] as const;

export default function TesterProfileTools({ navigation, userId }: any) {
  const { currentUser } = useGlobalContext();
  if (!currentUser?.is_tester || !userId) return null;

  const makeActive = async () => {
    try {
      const result = await TesterApi.makeUserActive(userId);
      flashSuccessMessage('Member marked active now.');
      navigation.replace('UserProfile', {
        userData: { id: result.id, last_online_at: result.last_online_at },
      });
    } catch (error: any) {
      flashErrorMessage(
        error?.response?.data?.message || 'Could not update last seen time.'
      );
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.bar}
    >
      <TouchableOpacity
        style={[styles.chip, styles.active]}
        onPress={makeActive}
      >
        <Text style={styles.text}>Make active now</Text>
      </TouchableOpacity>
      {currentUser?.tester_can_view_private_media && (
        <TouchableOpacity
          style={[styles.chip, styles.gallery]}
          onPress={() => navigation.navigate('TesterGallery', { userId })}
        >
          <Text style={styles.text}>All galleries</Text>
        </TouchableOpacity>
      )}
      {insights.map(([type, label]) => (
        <TouchableOpacity
          key={type}
          style={styles.chip}
          onPress={() =>
            navigation.navigate('TesterInsights', { userId, type })
          }
        >
          <Text style={styles.text}>{label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 7,
    backgroundColor: '#FFF3CD',
  },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.primary,
  },
  gallery: { backgroundColor: Colors.attention },
  active: { backgroundColor: Colors.verified },
  text: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
