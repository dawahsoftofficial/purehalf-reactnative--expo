import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Container, Header } from '../../components';
import { Colors } from '../../res';
import { flashErrorMessage, TesterApi } from '../../services';

export default function TesterDirectory({ navigation }: any) {
  const [testers, setTesters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      setTesters((await TesterApi.testers()) || []);
    } catch (error: any) {
      flashErrorMessage(
        error?.response?.data?.message || 'Could not load testers.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <Container>
      <Header navigation={navigation} title="App testers" />
      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <FlatList
          data={testers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void load(true)}
            />
          }
          ListHeaderComponent={
            <Text style={styles.summary}>
              {testers.length} tester{testers.length === 1 ? '' : 's'} found
            </Text>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No other tester accounts found.</Text>
          }
          renderItem={({ item }) => {
            const image =
              item.primary_image_to_show || item.media?.primary_image_to_show;
            return (
              <TouchableOpacity
                style={styles.user}
                onPress={() =>
                  navigation.navigate('UserProfile', { userData: item })
                }
              >
                {image ? (
                  <Image source={{ uri: image }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.placeholder]}>
                    <Text style={styles.initial}>
                      {(item.first_name || 'T').slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.copy}>
                  <Text style={styles.name}>
                    {item.full_name || `Tester #${item.id}`}
                  </Text>
                  <Text style={styles.meta}>
                    #{item.id} · {item.gender || 'Unknown'} · {item.age || '—'}
                  </Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>TESTER</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1 },
  list: { padding: 16, paddingBottom: 80, gap: 10 },
  summary: { color: Colors.muted, marginBottom: 4 },
  empty: { color: Colors.muted, textAlign: 'center', paddingVertical: 40 },
  user: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 14,
    padding: 10,
    backgroundColor: '#fff',
  },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.lavender,
  },
  initial: { color: Colors.primary, fontSize: 20, fontWeight: '800' },
  copy: { flex: 1 },
  name: { color: Colors.ink, fontWeight: '800', fontSize: 15 },
  meta: { color: Colors.muted, marginTop: 3, fontSize: 12 },
  tag: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: '#FFF3CD',
  },
  tagText: { color: '#6B5500', fontSize: 9, fontWeight: '900' },
  chevron: { color: Colors.primary, fontSize: 26 },
});
