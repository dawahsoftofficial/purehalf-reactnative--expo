import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { type PurchasesPackage } from 'react-native-purchases';

import { Fonts } from '@/res';

type PlanUI = {
  badge: string;
  badgeVariant: 'neutral' | 'recommended';
  tagline: string;
  bullets: string[];
  emphasize: boolean;
  compareAtMultiplier?: number;
};

type PackageCardProps = {
  item: PurchasesPackage;
  index: number;
  isSelected: boolean;
  plan: PlanUI | undefined;
  price: string;
  perDay: string;
  weekly: string;
  compareAtString: string;
  savePct: number;
  cardWidth: number;
  cardGap: number;
  isLast: boolean;
  onSelect: (index: number) => void;
  onSubscribe: (item: PurchasesPackage) => void;
};

export function PackageCard({
  item,
  index,
  isSelected,
  plan,
  price,
  perDay,
  weekly,
  compareAtString,
  savePct,
  cardWidth,
  cardGap,
  isLast,
  onSelect,
  onSubscribe,
}: PackageCardProps) {
  const isProEmphasis = !!plan?.emphasize;

  const getButtonText = () => {
    const identifier = item.identifier?.toLowerCase() || '';
    const productTitle = item.product?.title?.toLowerCase() || '';
    const productId = item.product?.identifier?.toLowerCase() || '';
    const searchText = `${identifier} ${productTitle} ${productId}`;

    if (searchText.includes('plus') || searchText.includes('starter')) {
      return 'Get Plus';
    }
    if (searchText.includes('pro') || searchText.includes('recommended')) {
      return 'Start Pro';
    }
    if (
      searchText.includes('elite') ||
      searchText.includes('highest') ||
      searchText.includes('visibility')
    ) {
      return 'Go Elite';
    }
    return 'Select Plan';
  };

  return (
    <Pressable
      onPress={() => onSelect(index)}
      style={[
        styles.card,
        {
          width: cardWidth,
          marginRight: isLast ? 0 : cardGap,
        },
        isProEmphasis && styles.cardEmphasis,
        isSelected && styles.cardSelected,
      ]}
    >
      {/* Pro card glow effect */}
      {isProEmphasis && <View style={styles.proGlow} pointerEvents="none" />}
      <LinearGradient
        colors={
          isProEmphasis
            ? ['rgba(167,139,250,0.16)', 'rgba(255,255,255,0.05)']
            : ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.04)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Badge Row */}
      <View style={styles.badgeRow}>
        <Text style={styles.planName}>
          {item.product.title || item.identifier}
        </Text>

        <View
          style={[
            styles.badge,
            plan?.badgeVariant === 'recommended'
              ? styles.badgeReco
              : styles.badgeNeutral,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              plan?.badgeVariant === 'recommended'
                ? styles.badgeTextReco
                : null,
            ]}
            numberOfLines={1}
          >
            {plan?.badge || 'Plan'}
          </Text>
        </View>
      </View>

      <Text style={styles.tagline}>
        {plan?.tagline || item.product.description || ''}
      </Text>

      {/* Price */}
      <View style={styles.priceRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.now}>{price}</Text>
          <Text style={styles.per}>
            per month {perDay ? `· ~${perDay}` : ''}{' '}
            {weekly ? `· ${weekly}/wk` : ''}
          </Text>

          {!!compareAtString && (
            <Text style={styles.was}>
              <Text style={styles.strike}>{compareAtString}</Text> original
            </Text>
          )}
        </View>

        {!!savePct && (
          <View style={styles.savePill}>
            <Text style={styles.saveText}>
              Save {savePct}%{'\n'}Launch Offer
            </Text>
          </View>
        )}
      </View>

      {/* Bullets */}
      <View style={styles.bullets}>
        {(plan?.bullets || []).map((b, bi) => (
          <View key={`${item.identifier}-${bi}`} style={styles.bulletRow}>
            <View style={styles.tick}>
              <Text style={styles.tickText}>✓</Text>
            </View>
            <Text style={styles.bulletText}>{b}</Text>
          </View>
        ))}
      </View>

      {/* In-card CTA button */}
      <Pressable
        onPress={() => {
          onSelect(index);
          onSubscribe(item);
        }}
        style={[styles.cardCta, isProEmphasis ? styles.cardCtaPro : null]}
      >
        {isProEmphasis ? (
          <LinearGradient
            colors={['rgba(167,139,250,0.42)', 'rgba(45,212,191,0.20)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        <Text style={styles.cardCtaText}>{getButtonText()}</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    marginBottom: 14,
    minHeight: 345,
  },
  cardEmphasis: {
    borderColor: 'rgba(167,139,250,0.55)',
    transform: [{ translateY: -2 }],
  },
  proGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    right: -140,
    top: -120,
    borderRadius: 140,
    backgroundColor: 'rgba(167,139,250,0.35)',
    transform: [{ rotate: '20deg' }],
  },
  cardSelected: {
    borderColor: 'rgba(255,255,255,0.22)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },
  planName: {
    color: 'rgba(255,255,255,0.95)',
    fontFamily: Fonts.APPFONT_B,
    fontSize: 18,
    letterSpacing: -0.36,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeNeutral: {
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  badgeReco: {
    borderColor: 'rgba(251,191,36,0.35)',
    backgroundColor: 'rgba(251,191,36,0.12)',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: Fonts.APPFONT_B,
    color: 'rgba(255,255,255,0.82)',
  },
  badgeTextReco: { color: 'rgba(255,239,190,0.95)' },
  tagline: {
    marginTop: 0,
    marginBottom: 12,
    color: 'rgba(255,255,255,0.84)',
    fontFamily: Fonts.APPFONT_R,
    fontSize: 13.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  now: {
    color: 'rgba(255,255,255,0.95)',
    fontFamily: Fonts.APPFONT_B,
    fontSize: 26,
    letterSpacing: -0.78,
  },
  per: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.68)',
    fontFamily: Fonts.APPFONT_B,
    fontSize: 12,
  },
  was: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.55)',
    fontFamily: Fonts.APPFONT_B,
    fontSize: 12,
  },
  strike: {
    textDecorationLine: 'line-through',
    color: 'rgba(255,255,255,0.45)',
  },
  savePill: {
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.28)',
    backgroundColor: 'rgba(45,212,191,0.10)',
  },
  saveText: {
    color: 'rgba(186,255,245,0.95)',
    fontFamily: Fonts.APPFONT_B,
    fontSize: 12,
    textAlign: 'right',
  },
  bullets: { marginTop: 10, marginBottom: 14, gap: 9 },
  bulletRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  tick: {
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginTop: 1,
    flex: 0,
  },
  tickText: {
    color: 'rgba(255,255,255,0.90)',
    fontSize: 12,
    fontFamily: Fonts.APPFONT_B,
  },
  bulletText: {
    flex: 1,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontFamily: Fonts.APPFONT_R,
  },
  cardCta: {
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  cardCtaPro: {
    borderColor: 'rgba(167,139,250,0.45)',
  },
  cardCtaText: {
    color: 'rgba(255,255,255,0.92)',
    fontFamily: Fonts.APPFONT_B,
    fontSize: 14,
    zIndex: 1,
  },
});
