import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/atoms/Button';
import { Skeleton } from '@/components/atoms/Skeleton';
import { ErrorState } from '@/components/molecules/ErrorState';
import { useTheme } from '@/hooks/useTheme';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { productsApi } from '@/api/index';
import { imageApi } from '@/api/image.api';
import type { RootStackParamList, ProductDetail, ProductImage } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'EditImage'>;

export function EditImageScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const { productId, shopId } = route.params;
  const queryClient = useQueryClient();
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: product, isLoading, error, refetch } = useQuery<ProductDetail>({
    queryKey: QUERY_KEYS.productDetail(productId, shopId),
    queryFn: () => productsApi.detail(productId, shopId),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (product?.images) {
      setImages([...product.images]);
    }
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: () =>
      imageApi.updateProductImages(productId, {
        shopId,
        images: images.map((img, i) => ({ imageId: img.imageId, order: i })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productDetail(productId, shopId) });
      Alert.alert('Berhasil', 'Gambar berhasil diperbarui.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: () => Alert.alert('Gagal', 'Gagal memperbarui gambar. Coba lagi.'),
  });

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin Ditolak', 'Izinkan akses galeri untuk mengunggah gambar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: false,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    if (images.length >= 9) {
      Alert.alert('Batas Gambar', 'Maksimal 9 gambar per produk.');
      return;
    }

    setUploading(true);
    try {
      const uploaded = await imageApi.uploadImage(shopId, asset.uri, asset.mimeType ?? 'image/jpeg');
      setImages((prev) => [
        ...prev,
        { imageId: uploaded.imageId, url: uploaded.imageUrl, order: prev.length },
      ]);
    } catch {
      Alert.alert('Gagal', 'Gagal mengunggah gambar. Coba lagi.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.imageId !== imageId));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width={104} height={104} borderRadius={10} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ErrorState message="Gagal memuat data produk." onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Gambar pertama akan jadi cover produk. Maks. 9 gambar.
        </Text>

        <View style={styles.grid}>
          {images.map((img, idx) => (
            <View key={img.imageId} style={styles.imageWrapper}>
              <Image source={{ uri: img.url }} style={styles.image} contentFit="cover" />
              {idx === 0 && (
                <View style={[styles.coverBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.coverText, { color: colors.white }]}>Cover</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.removeBtn, { backgroundColor: colors.danger }]}
                onPress={() => handleRemove(img.imageId)}
              >
                <Feather name="x" size={12} color={colors.white} />
              </TouchableOpacity>
            </View>
          ))}

          {images.length < 9 && (
            <TouchableOpacity
              style={[styles.addImageBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
              onPress={handlePickImage}
              disabled={uploading}
            >
              {uploading ? (
                <Feather name="loader" size={24} color={colors.placeholder} />
              ) : (
                <>
                  <Feather name="plus" size={24} color={colors.placeholder} />
                  <Text style={[styles.addImageLabel, { color: colors.placeholder }]}>Tambah</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.cardBg, borderTopColor: colors.border }]}>
        <Button
          label={saveMutation.isPending ? 'Menyimpan...' : 'Simpan Urutan Gambar'}
          onPress={() => saveMutation.mutate()}
          variant="primary"
          loading={saveMutation.isPending}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, gap: 16 },
  hint: { fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imageWrapper: { width: 104, height: 104, position: 'relative' },
  image: { width: '100%', height: '100%', borderRadius: 10 },
  coverBadge: {
    position: 'absolute', bottom: 4, left: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4,
  },
  coverText: { fontSize: 10, fontWeight: '700' },
  removeBtn: {
    position: 'absolute', top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  addImageBtn: {
    width: 104, height: 104, borderRadius: 10,
    borderWidth: 1.5, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addImageLabel: { fontSize: 12 },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 },
  footer: {
    padding: 16, paddingBottom: 28,
    borderTopWidth: 1,
  },
});
