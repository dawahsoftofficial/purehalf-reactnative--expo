import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Container, Header } from '../../components';
import { Colors } from '../../res';
import { flashErrorMessage, TesterApi } from '../../services';

const labels: Record<string, string> = {
  blocks: 'Block list',
  recommendations: 'Recommendations',
  likes: 'Likes',
  visits: 'Visits',
  chat_credits: 'Chat credits',
  profile_completion: 'Profile completion',
};

export default function TesterInsights({ navigation, route }: any) {
  const { userId, type } = route.params;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    TesterApi.insights(userId, type)
      .then(setData)
      .catch((error) =>
        flashErrorMessage(
          error?.response?.data?.message || 'Could not load tester insight.'
        )
      )
      .finally(() => setLoading(false));
  }, [type, userId]);

  if (loading) {
    return (
      <Container>
        <Header navigation={navigation} title={labels[type]} />
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      </Container>
    );
  }

  if (type === 'profile_completion') {
    return (
      <Container>
        <Header navigation={navigation} title={labels[type]} />
        <View style={styles.center}>
          <Text style={styles.percent}>
            {data?.profile_completion_percent ?? 0}%
          </Text>
          <Text style={styles.muted}>Server-calculated profile completion</Text>
        </View>
      </Container>
    );
  }

  if (type === 'chat_credits') {
    return (
      <Container>
        <Header navigation={navigation} title={labels[type]} />
        <View style={styles.balance}>
          <Text style={styles.balanceValue}>{data?.balance ?? 0}</Text>
          <Text style={styles.muted}>Current raw credit balance</Text>
        </View>
        <FlatList
          data={data?.history || []}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No credit history.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>
                {item.type}: {item.credit}
              </Text>
              <Text style={styles.muted}>
                {item.description || 'No description'}
              </Text>
              <Text style={styles.date}>{item.created_at}</Text>
            </View>
          )}
        />
      </Container>
    );
  }

  const users = Array.isArray(data) ? data : [];
  return (
    <Container>
      <Header navigation={navigation} title={labels[type]} />
      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No users found.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.user}
            onPress={() =>
              navigation.navigate('UserProfile', { userData: item })
            }
          >
            {item.primary_image_to_show ? (
              <Image
                source={{ uri: item.primary_image_to_show }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatar} />
            )}
            <View style={styles.userCopy}>
              <Text style={styles.name}>
                {item.full_name || `User #${item.id}`}
              </Text>
              <Text style={styles.muted}>
                #{item.id} · {item.gender || '—'} · {item.age || '—'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1 },
  list: { padding: 16, gap: 10 },
  empty: { textAlign: 'center', color: Colors.muted, padding: 30 },
  card: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: '#fff',
  },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.hairline,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.lavender,
  },
  userCopy: { flex: 1 },
  name: { color: Colors.ink, fontWeight: '700' },
  muted: { color: Colors.muted, marginTop: 3 },
  date: { color: Colors.muted, fontSize: 11, marginTop: 6 },
  chevron: { color: Colors.primary, fontSize: 30 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  percent: { color: Colors.primary, fontSize: 68, fontWeight: '800' },
  balance: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  balanceValue: { color: Colors.primary, fontSize: 42, fontWeight: '800' },
});
