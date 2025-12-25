import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  type FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewToken,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  type PurchasesPackage,
  type PurchasesStoreProduct,
} from 'react-native-purchases';
import Purchases from 'react-native-purchases';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';

import { wp } from '@/global';
import { Colors, Fonts } from '@/res';

import { ModalLoader } from '../../components';
import { LanguageKeys } from '../../languages';
import {
  flashErrorMessage,
  flashSuccessMessage,
  StorageManager,
  useGlobalContext,
} from '../../services';
import {
  Chip,
  Footer,
  PackageCard,
  PaginationDots,
  TermsAndConditions,
} from './components';

type Props = {
  navigation?: any;
  route?: any;
  onClose?: () => void;
};

type PlanUI = {
  badge: string;
  badgeVariant: 'neutral' | 'recommended';
  tagline: string;
  bullets: string[];
  emphasize: boolean; // highlight card
  compareAtMultiplier?: number; // for "cut price" (presentation-only)
};

const DEFAULT_PLAN_UI: Record<string, PlanUI> = {
  plus_starter: {
    badge: 'Starter',
    badgeVariant: 'neutral',
    tagline: 'Start strong — see interest and begin meaningful chats today.',
    bullets: [
      '10 bonus chats instantly on purchase',
      '3 chats every day',
      'See who liked you',
      'Who visited you: last 7 days',
      'Basic chat filters',
      'Search priority: low',
    ],
    emphasize: false,
    compareAtMultiplier: 1.28,
  },
  pro_recommended: {
    badge: 'Recommended • Best Value',
    badgeVariant: 'recommended',
    tagline:
      'Most chosen — better filters + priority visibility for faster replies.',
    bullets: [
      '15 bonus chats instantly on purchase',
      '6 chats every day',
      'See & sort who liked you',
      'Who visited you: last 30 days',
      'Advanced chat filters',
      'Search priority: medium',
    ],
    emphasize: true,
    compareAtMultiplier: 1.5,
  },
  elite_highest_visibility: {
    badge: 'Maximum Visibility',
    badgeVariant: 'neutral',
    tagline: 'Go all in — maximum reach, full insights, and more daily chats.',
    bullets: [
      '30 bonus chats instantly on purchase',
      '12 chats every day',
      'Full likes & views access',
      'Advanced chat filters',
      'Search priority: high',
      'Maximum visibility',
    ],
    emphasize: false,
    compareAtMultiplier: 1.4,
  },
};

function findRecommendedIndex(packages: PurchasesPackage[]) {
  const byId = packages.findIndex(
    (p) =>
      p?.product?.identifier === 'pro_recommended' ||
      (p?.identifier || '').toLowerCase().includes('recommended') ||
      (p?.product?.title || '').toLowerCase().includes('recommended')
  );
  return byId >= 0 ? byId : 0;
}

function normalizeProductId(id?: string) {
  if (!id) return '';
  // handle typos like "Elite (Highest Visbility)" in package.identifier — product.identifier is better
  return id.trim();
}

function formatMoneyFromProduct(product: PurchasesStoreProduct) {
  // Prefer pricePerMonthString / priceString
  return (
    product.pricePerMonthString ||
    product.priceString ||
    (typeof product.pricePerMonth === 'number'
      ? `$${product.pricePerMonth.toFixed(2)}`
      : typeof product.price === 'number'
        ? `$${product.price.toFixed(2)}`
        : '')
  );
}

function calcCompareAt(product: PurchasesStoreProduct, multiplier: number) {
  const base = product.pricePerMonth ?? product.price ?? 0;
  if (!base || !multiplier) return { compareAtString: '', savePct: 0 };

  // Presentation-only compare-at
  const compareAt = Math.round(base * multiplier * 100) / 100;
  const savePct = Math.max(
    0,
    Math.round(((compareAt - base) / compareAt) * 100)
  );

  // Build a string that matches the currency format roughly:
  const currency = product.currencyCode || 'USD';
  const symbol = currency === 'USD' ? '$' : '';
  const compareAtString = symbol
    ? `${symbol}${compareAt.toFixed(2)}`
    : compareAt.toFixed(2);

  return { compareAtString, savePct };
}

export default function PremiumPaywallScreen({
  navigation,
  route,
  onClose,
}: Props) {
  const { width } = useWindowDimensions();
  const { currentUser, updateCurrentUser } = useGlobalContext();
  const { setData, storageKeys } = StorageManager;

  const [loaderModal, setLoaderModal] = useState({
    visible: false,
    message: '',
  });

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const CARD_GAP = 12;
  const CARD_WIDTH = Math.min(width * 0.86, 420);
  const SIDE = (width - CARD_WIDTH) / 2;

  const scrollX = useMemo(() => new Animated.Value(0), []);
  const listRef = useRef<FlatList<PurchasesPackage>>(null);

  // Fetch packages from RevenueCat on mount if not provided
  useEffect(() => {
    // Fetch packages from RevenueCat
    const fetchPackages = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings?.current?.availablePackages) {
          setPackages(offerings.current.availablePackages);
        }
      } catch (error) {
        console.error('Error fetching packages from RevenueCat:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const recommendedIndex = useMemo(
    () => findRecommendedIndex(packages),
    [packages]
  );
  const [index, setIndex] = useState(0);

  // Update index when packages are loaded or recommendedIndex changes
  useEffect(() => {
    if (packages.length > 0 && recommendedIndex >= 0) {
      requestAnimationFrame(() => {
        setIndex(recommendedIndex);
        try {
          listRef.current?.scrollToIndex({
            index: recommendedIndex,
            animated: false,
          });
        } catch {}
      });
    }
  }, [recommendedIndex, packages.length]);

  const mergedPlanUI = useMemo(() => {
    return { ...DEFAULT_PLAN_UI };
  }, []);

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 50 }),
    []
  );
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems?.[0];
      if (first?.index != null) {
        setIndex(first.index);
      }
    },
    []
  );

  const onMomentumScrollEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / (CARD_WIDTH + CARD_GAP));
      if (newIndex >= 0 && newIndex < packages.length) {
        setIndex(newIndex);
      }
    },
    [packages.length, CARD_WIDTH, CARD_GAP]
  );

  const onScrollEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / (CARD_WIDTH + CARD_GAP));
      if (newIndex >= 0 && newIndex < packages.length) {
        setIndex(newIndex);
      }
    },
    [packages.length, CARD_WIDTH, CARD_GAP]
  );

  const selected = packages[index];

  const handleSelect = (i: number) => {
    setIndex(i);
    listRef.current?.scrollToIndex({ index: i, animated: true });
  };

  const hideLoaderModal = () =>
    setLoaderModal({
      visible: false,
      message: '',
    });

  const handleSubscribe = async (pkg?: PurchasesPackage) => {
    const packageToPurchase = pkg || selected;
    if (!packageToPurchase) return;

    setLoaderModal({
      visible: true,
      message: LanguageKeys.loading,
    });

    try {
      const customerInfo: any =
        await Purchases.purchasePackage(packageToPurchase);

      if (
        customerInfo?.activeSubscriptions?.length !== 0 &&
        (customerInfo?.latestExpirationDate ||
          customerInfo?.customerInfo?.latestExpirationDate)
      ) {
        const updatedUser = {
          ...currentUser,
          membership_expiry:
            customerInfo?.latestExpirationDate ||
            customerInfo?.customerInfo?.latestExpirationDate,
          membership_status: 1,
        };
        updateCurrentUser(updatedUser);
        await setData(storageKeys.USER, updatedUser);
        hideLoaderModal();
        flashSuccessMessage(LanguageKeys.upgradedSuccessfully);
        const navigateTo = route?.params?.navigateTo;
        if (navigateTo && navigateTo === 'goBack') {
          navigation?.goBack();
        } else {
          navigation?.reset({
            index: 0,
            routes: [
              {
                name: 'MembershipCongrats',
                params: {
                  amount: packageToPurchase?.product?.price,
                  title: packageToPurchase?.product?.title,
                },
              },
            ],
          });
        }
      } else {
        hideLoaderModal();
      }
    } catch {
      hideLoaderModal();
    }
  };

  const handleRestore = async () => {
    setLoaderModal({
      visible: true,
      message: LanguageKeys.loading,
    });

    try {
      const customerInfo: any = await Purchases.restorePurchases();

      if (
        customerInfo?.activeSubscriptions?.length !== 0 &&
        (customerInfo?.latestExpirationDate ||
          customerInfo?.customerInfo?.latestExpirationDate)
      ) {
        const updatedUser = {
          ...currentUser,
          membership_expiry:
            customerInfo?.latestExpirationDate ||
            customerInfo?.customerInfo?.latestExpirationDate,
          membership_status: 1,
        };
        updateCurrentUser(updatedUser);
        await setData(storageKeys.USER, updatedUser);
        hideLoaderModal();
        flashSuccessMessage(LanguageKeys.upgradedSuccessfully);
        const navigateTo = route?.params?.navigateTo;
        if (navigateTo && navigateTo === 'goBack') {
          navigation?.goBack();
        } else {
          navigation?.reset({
            index: 0,
            routes: [
              {
                name: 'MembershipCongrats',
                params: {
                  amount: 0,
                  title: 'Restored',
                },
              },
            ],
          });
        }
      } else {
        hideLoaderModal();
        flashErrorMessage('restoreSubscriptionErrorMessage');
      }
    } catch {
      hideLoaderModal();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    if (route?.params?.from === 'SignUp') {
      navigation?.reset({
        index: 0,
        routes: [{ name: 'BottomTab' }],
      });
    } else {
      navigation?.goBack();
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <StatusBar
        barStyle={'light-content'}
        backgroundColor={'rgba(167,139,250,0.22)'}
      />
      <ModalLoader
        visible={loaderModal.visible}
        message={loaderModal.message}
      />
      {/* Background with radial gradients matching HTML */}
      <View style={styles.bg} />
      <LinearGradient
        colors={['rgba(167,139,250,0.22)', 'transparent']}
        start={{ x: 0.2, y: 0.1 }}
        end={{ x: 0.2, y: 0.6 }}
        style={[StyleSheet.absoluteFill, styles.gradient1]}
      />
      <LinearGradient
        colors={['rgba(45,212,191,0.18)', 'transparent']}
        start={{ x: 0.8, y: 0 }}
        end={{ x: 0.8, y: 0.55 }}
        style={[StyleSheet.absoluteFill, styles.gradient2]}
      />
      <LinearGradient
        colors={['rgba(251,191,36,0.12)', 'transparent']}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0.45 }}
        style={[StyleSheet.absoluteFill, styles.gradient3]}
      />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>Find the Right Match Faster</Text>
            <Text style={styles.sub}>
              See who likes you, filter for serious matches, and get priority
              visibility.
            </Text>
          </View>

          {handleClose && (
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              {/* <Text style={styles.closeText}>Close</Text> */}
              <AntDesign name="close" size={wp(5)} color={Colors.color2} />
            </Pressable>
          )}
        </View>

        {/* Chips */}
        <View style={styles.chips}>
          <Chip label="Bonus chats instantly" dot="pro" />
          <Chip label="Daily chats included" dot="success" />
          <Chip label="See Likes & Visits" dot="neutral" />
          <Chip label="Premium filters" dot="warn" />
          <Chip label="Priority in search" dot="neutral" />
        </View>

        {/* Swipe Cards */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading packages...</Text>
          </View>
        ) : packages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No packages available</Text>
          </View>
        ) : (
          <Animated.FlatList
            ref={listRef as any}
            data={packages}
            keyExtractor={(item) => item.product.identifier}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + CARD_GAP}
            snapToAlignment="center"
            decelerationRate="fast"
            bounces={false}
            contentContainerStyle={{ paddingHorizontal: 0 }}
            getItemLayout={(_, i) => ({
              length: CARD_WIDTH + CARD_GAP,
              offset: (CARD_WIDTH + CARD_GAP) * i,
              index: i,
            })}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onScrollEndDrag={onScrollEnd}
            onMomentumScrollEnd={onMomentumScrollEnd}
            scrollEventThrottle={16}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={onViewableItemsChanged}
            renderItem={({ item, index: i }) => {
              const pid = normalizeProductId(item.product.identifier);
              const plan = mergedPlanUI[pid];

              const isSelected = i === index;
              const price = formatMoneyFromProduct(item.product);
              const weekly = item.product.pricePerWeekString || '';
              const perDay =
                typeof item.product.pricePerMonth === 'number'
                  ? `$${(item.product.pricePerMonth / 30).toFixed(2)}/day`
                  : '';

              const { compareAtString, savePct } = calcCompareAt(
                item.product,
                plan?.compareAtMultiplier || 0
              );

              return (
                <View
                  style={{
                    width: CARD_WIDTH,
                    marginRight: i === packages.length - 1 ? 0 : CARD_GAP,
                    // backgroundColor: 'red',
                    justifyContent: 'center',
                  }}
                >
                  <PackageCard
                    item={item}
                    index={i}
                    isSelected={isSelected}
                    plan={plan}
                    price={price}
                    perDay={perDay}
                    weekly={weekly}
                    compareAtString={compareAtString}
                    savePct={savePct}
                    cardWidth={CARD_WIDTH}
                    cardGap={CARD_GAP}
                    isLast={i === packages.length - 1}
                    onSelect={handleSelect}
                    onSubscribe={handleSubscribe}
                  />
                </View>
              );
            }}
          />
        )}

        {/* Dots */}
        {!loading && packages.length > 0 && (
          <PaginationDots
            packages={packages}
            currentIndex={index}
            scrollX={scrollX}
            cardWidth={CARD_WIDTH}
            cardGap={CARD_GAP}
            onSelect={handleSelect}
          />
        )}

        {/* Fine Print */}
        {/* {!loading && packages.length > 0 && <FinePrint />} */}

        {/* Terms and Conditions */}
        {!loading && packages.length > 0 && <TermsAndConditions />}

        {/* Footer actions */}
        {!loading && <Footer onRestore={handleRestore} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0b10' },
  bg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0b0b10',
  },
  gradient1: {
    opacity: 1,
  },
  gradient2: {
    opacity: 1,
  },
  gradient3: {
    opacity: 1,
  },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  h1: {
    fontFamily: Fonts.APPFONT_B,
    fontSize: 22,
    letterSpacing: -0.3,
    color: 'rgba(255,255,255,0.95)',
  },
  sub: {
    marginTop: 6,
    fontFamily: Fonts.APPFONT_R,
    fontSize: 13,
    color: 'rgba(255,255,255,0.70)',
  },

  closeBtn: {
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  closeText: {
    color: 'rgba(255,255,255,0.90)',
    fontFamily: Fonts.APPFONT_B,
    fontSize: 12,
  },

  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    marginBottom: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.70)',
    fontFamily: Fonts.APPFONT_R,
    fontSize: 14,
    marginTop: 12,
  },
});
