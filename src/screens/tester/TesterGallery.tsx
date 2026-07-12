import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
} from 'react-native';

import { Container, Header } from '../../components';
import { Colors } from '../../res';
import { flashErrorMessage, TesterApi } from '../../services';

export default function TesterGallery({ navigation, route }: any) {
  const [media, setMedia] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    TesterApi.media(route.params.userId)
      .then(setMedia)
      .catch((error) =>
        flashErrorMessage(
          error?.response?.data?.message || 'Could not open gallery.'
        )
      )
      .finally(() => setLoading(false));
  }, [route.params.userId]);
  const images = useMemo(
    () =>
      [
        media?.un_blur_primary_image || media?.primary_image,
        ...(media?.public_gallery || []),
        ...(media?.private_gallery || []),
      ].filter(Boolean),
    [media]
  );
  return (
    <Container>
      <Header navigation={navigation} title="Tester gallery" />
      {loading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <FlatList
          data={images}
          numColumns={2}
          keyExtractor={(item, index) => `${item}-${index}`}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          ListEmptyComponent={
            <Text style={styles.empty}>No images found.</Text>
          }
          renderItem={({ item }) => (
            <Image
              source={{ uri: item }}
              resizeMode="cover"
              style={styles.image}
            />
          )}
        />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1 },
  list: { padding: 12 },
  row: { gap: 10, marginBottom: 10 },
  image: {
    flex: 1,
    aspectRatio: 0.78,
    borderRadius: 10,
    backgroundColor: Colors.lavender,
  },
  empty: { color: Colors.muted, textAlign: 'center', padding: 30, flex: 1 },
});
