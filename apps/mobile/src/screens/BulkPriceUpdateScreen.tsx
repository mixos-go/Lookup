// src/screens/BulkPriceUpdateScreen.tsx — Redesigned bulk price update
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { EmptyState } from '@/components/molecules/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useBulkStore } from '@/stores/bulkStore';
import { useShopStore } from '@/stores/shopStore';
import { bulkApi } from '@/api/index';
import { formatCurrency } from '@/utils/format';
import type { RootStackParamList, BulkPriceItem } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
interface PriceEntry { salePrice: number; originalPrice: number }

export function BulkPriceUpdateScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
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
          originalPrice: entry?.originalPrice && entry.originalPrice > (entry?.salePrice ?? product.priceRange.min)
            ? entry.originalPrice : undefined,
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
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
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
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <View style={[styles.headerIcon, { backgroundColor: `${colors.warning}18` }]}>
          <Feather name="tag" size={22} color={colors.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.heading }]}>Update Harga Massal</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {selectedProducts.length} produk dipilih
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={[styles.infoBanner, { backgroundColor: `${colors.warning}12`, borderColor: `${colors.warning}30` }]}>
        <Feather name="info" size={14} color={colors.warning} />
        <Text style={[styles.infoText, { color: colors.warning }]}>
          Harga coret harus lebih tinggi dari harga jual agar diskon tampil di marketplace.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {selectedProducts.map((product) => {
          const entry = priceMap[product.platformProductId];
          const salePrice = entry?.salePrice ?? product.priceRange.min;
          const originalPrice = entry?.originalPrice ?? product.priceRange.max;
          const currency = product.priceRange.currency;
          const hasDiscount = originalPrice > salePrice;

          return (
            <View
              key={product.platformProductId}
              style={[styles.productCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            >
              {/* Product name */}
              <View style={styles.productHeader}>
                <Text style={[styles.productName, { color: colors.heading }]} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={[styles.currentPrice, { color: colors.textSecondary }]}>
                  Saat ini: {formatCurrency(product.priceRange.min, currency)}
                </Text>
              </View>

              {/* Harga Jual */}
              <View style={styles.priceField}>
                <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Harga Jual</Text>
                <View style={[styles.priceInput, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Text style={[styles.priceCurrency, { color: colors.placeholder }]}>
                    {currency}
                  </Text>
                  <TextInput
                    style={[styles.priceTextInput, { color: colors.heading }]}
                    value={String(salePrice)}
                    keyboardType="numeric"
                    onChangeText={(t) => {
                      const n = parseInt(t.replace(/\D/g, ''), 10);
                      if (!isNaN(n)) {
                        setPriceMap((prev) => ({
                          ...prev,
                          [product.platformProductId]: {
                            ...prev[product.platformProductId],
                            salePrice: n,
                            originalPrice: prev[product.platformProductId]?.originalPrice ?? product.priceRange.max,
                          },
                        }));
                      }
                    }}
                  />
                </View>
              </View>

              {/* Harga Coret */}
              <View style={styles.priceField}>
                <View style={styles.priceLabelRow}>
                  <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Harga Coret (opsional)</Text>
                  {hasDiscount && (
                    <View style={[styles.discountPill, { backgroundColor: `${colors.primary}18` }]}>
                      <Text style={[styles.discountText, { color: colors.primary }]}>
                        Diskon {Math.round((1 - salePrice / originalPrice) * 100)}%
                      </Text>
                    </View>
                  )}
                </View>
                <View style={[styles.priceInput, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Text style={[styles.priceCurrency, { color: colors.placeholder }]}>
                    {currency}
                  </Text>
                  <TextInput
                    style={[styles.priceTextInput, { color: colors.heading }]}
                    value={String(originalPrice)}
                    keyboardType="numeric"
                    onChangeText={(t) => {
                      const n = parseInt(t.replace(/\D/g, ''), 10);
                      if (!isNaN(n)) {
                        setPriceMap((prev) => ({
                          ...prev,
                          [product.platformProductId]: {
                            ...prev[product.platformProductId],
                            originalPrice: n,
                            salePrice: prev[product.platformProductId]?.salePrice ?? product.priceRange.min,
                          },
                        }));
                      }
                    }}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.cardBg, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          onPress={() => createJobMutation.mutate()}
          disabled={createJobMutation.isPending}
          activeOpacity={0.85}
        >
          <Feather name="upload-cloud" size={18} color="#fff" />
          <Text style={styles.submitBtnText}>
            {createJobMutation.isPending ? 'Membuat Job...' : `Update ${selectedProducts.length} Produk`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1 },
  headerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  list: { padding: 12, gap: 12, paddingBottom: 20 },
  productCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 14 },
  productHeader: { gap: 3 },
  productName: { fontSize: 14, fontWeight: '700' },
  currentPrice: { fontSize: 12 },
  priceField: { gap: 8 },
  priceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceLabel: { fontSize: 12, fontWeight: '600' },
  discountPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  discountText: { fontSize: 11, fontWeight: '700' },
  priceInput: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, gap: 8 },
  priceCurrency: { fontSize: 13, fontWeight: '600' },
  priceTextInput: { flex: 1, fontSize: 16, fontWeight: '700' },
  footer: { padding: 16, paddingBottom: 28, borderTopWidth: 1 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
