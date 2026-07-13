import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Container, Header } from '../../components';
import { Colors } from '../../res';
import { TesterDiagnostics } from '../../services/tester';

export default function TesterScreenInfo({ navigation, route }: any) {
  const screenName = route.params?.screenName || 'Unknown';
  const calls = TesterDiagnostics.forScreen(screenName);
  return (
    <Container>
      <Header navigation={navigation} title="Screen info" />
      <View style={styles.summary}>
        <Text style={styles.title}>{screenName}</Text>
        <Text style={styles.subtitle}>
          {calls.length} captured API calls (tokens and payloads are never
          recorded)
        </Text>
      </View>
      <FlatList
        data={[...calls].reverse()}
        keyExtractor={(_, index) => String(index)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No API calls captured for this screen.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.method}>{item.method}</Text>
              <Text
                style={[
                  styles.status,
                  (item.status || 0) >= 400 && styles.error,
                ]}
              >
                {item.status || 'ERR'}
              </Text>
              <Text style={styles.duration}>{item.duration_ms} ms</Text>
            </View>
            <Text selectable style={styles.url}>
              {item.url}
            </Text>
            <Text style={styles.time}>{item.timestamp}</Text>
          </View>
        )}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  summary: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  title: { color: Colors.ink, fontWeight: '800', fontSize: 18 },
  subtitle: { color: Colors.muted, marginTop: 3 },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: 10,
  },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  method: { color: Colors.primary, fontWeight: '800' },
  status: { color: Colors.verified, fontWeight: '700' },
  error: { color: Colors.attention },
  duration: { color: Colors.muted, marginLeft: 'auto' },
  url: { color: Colors.ink, marginTop: 8 },
  time: { color: Colors.muted, fontSize: 11, marginTop: 6 },
  empty: { color: Colors.muted, textAlign: 'center', padding: 30 },
});
