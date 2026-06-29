import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { PriceInput } from '@/components/molecules/PriceInput';
import { Button } from '@/components/atoms/Button';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Colors } from '@/constants';
import { useBulkStore } from '@/stores/bulkStore';
import { useShopStore } from '@/stores/shopStore';
import { bulkApi } from '@/api/index';
import type { RootStackParamList, BulkPriceItem } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface PriceEntry { salePrice: number; originalPrice: number }

export function BulkPriceUpdateScreen() {
  const navigation = useNavigation<Nav>();
  const { selectedProducts, clearSelection, setActiveJobId } = useBulkStore();
  const { activeShopId } = useShopStore();
  const [priceMap, setPriceMap] = useState<Record<string, PriceEntry>>({});

  const createJobMutation = useMutation({
    mutationFn: () => {
      const items: BulkPriceItem[] = selectedProducts.map((product) => {
        const entry = priceMap[product.platformProductId];
        return {
          productId: product.platformProductId,
          variantId: product.platformProductId,
          price: entry?.salePrice ?? product.priceRange.min,
          originalPrice: entry?.originalPrice ?? undefined,
          productName: product.name,
          variantName: 'Default',
        };
      });
      return bulkApi.createPriceJob(activeShopId!, items);
    },
    onSuccess: (data) => {
      setActiveJobId(data.jobId);
      clearSelection();
      navigation.replace('BulkProgress', { jobId: data.jobId, type: 'PRICE' });
    },
    onError: () => Alert.alert('Gagal', 'Gagal membuat job update harga.'),
  });

  if (selectedProducts.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          icon="tag"
          title="Tidak Ada Produk Dipilih"
          subtitle="Kembali ke daftar produk dan pilih produk yang ingin diupdate."
          actionLabel="Kembali"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Update Harga Massal</Text>
        <Text style={styles.subtitle}>{selectedProducts.length} produk dipilih</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {selectedProducts.map((product) => {
          const entry = priceMap[product.platformProductId];
          return (
            <View key={product.platformProductId} style={styles.productCard}>
              <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
              <PriceInput
                salePrice={entry?.salePrice ?? product.priceRange.min}
                originalPrice={entry?.originalPrice ?? product.priceRange.max}
                onChangeSale={(val) =>
                  setPriceMap((prev) => ({
                    ...prev,
                    [product.platformProductId]: {
                      ...prev[product.platformProductId],
                      salePrice: val,
                    },
                  }))
                }
                onChangeOriginal={(val) =>
                  setPriceMap((prev) => ({
                    ...prev,
                    [product.platformProductId]: {
                      ...prev[product.platformProductId],
                      originalPrice: val,
                    },
                  }))
                }
              />
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerInfo}>
          <Feather name="info" size={14} color={Colors.info} />
          <Text style={styles.footerHint}>
            Diproses secara bertahap. Maks. 200 produk per batch.
          </Text>
        </View>
        <Button
          label={createJobMutation.isPending ? 'Membuat Job...' : `Update ${selectedProducts.length} Produk`}
          onPress={() => createJobMutation.mutate()}
          variant="primary"
          loading={createJobMutation.isPending}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 18, fontWeight: '800', color: Colors.heading },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  content: { padding: 16, gap: 12 },
  productCard: {
    backgroundColor: Colors.cardBg, borderRadius: 12, padding: 14,
    gap: 12, borderWidth: 1, borderColor: Colors.border,
  },
  productName: { fontSize: 14, fontWeight: '600', color: Colors.heading },
  footer: {
    padding: 16, paddingBottom: 28,
    backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border, gap: 10,
  },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerHint: { flex: 1, fontSize: 12, color: Colors.info },
});
