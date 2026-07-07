# Profile Gallery Viewer Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current other-user profile gallery with an immersive full-screen viewer that supports swipe browsing, thumbnail navigation, photo counts, locked private-photo states, and polished loading/error/empty states.

**Architecture:** Extract gallery sequence composition into a small pure helper so public/private/locked photo ordering can be tested independently. Keep the route and API behavior in `src/components/ImageViewer.tsx`, but rebuild the presentation around normalized gallery items, per-image load/error maps, a top glass bar, a count pill, and a bottom thumbnail rail.

**Tech Stack:** React Native 0.82 + TypeScript + `react-native-swiper-flatlist` + existing `react-native-vector-icons`, `react-native-material-ripple`, `SafeAreaView`, `Colors`, `Fonts`, `Typography`, `wp`, and `hp`.

---

## File Structure

- Create `src/components/image-viewer/gallery-items.ts` - pure gallery item types and composition helper.
- Create `src/components/image-viewer/__tests__/gallery-items.test.ts` - unit coverage for public, private, locked, self, and granted-access sequencing.
- Modify `src/components/ImageViewer.tsx` - replace raw string/sentinel rendering with the redesigned full-screen gallery viewer.
- No API service files, route files, guardian/wali files, admin files, or language files should change.

---

### Task 1: Add Tested Gallery Item Composition

**Files:**

- Create: `src/components/image-viewer/gallery-items.ts`
- Create: `src/components/image-viewer/__tests__/gallery-items.test.ts`

- [ ] **Step 1: Create the pure helper test**

Create `src/components/image-viewer/__tests__/gallery-items.test.ts` with:

```ts
import { buildGalleryItems } from '../gallery-items';

describe('buildGalleryItems', () => {
  it('returns public images first', () => {
    expect(
      buildGalleryItems({
        media: {
          public_gallery: ['public-1.jpg', 'public-2.jpg'],
          private_photo_count: 0,
        },
        isCurrentUser: false,
        photoAccessAction: null,
      })
    ).toEqual([
      { id: 'public-0', type: 'image', uri: 'public-1.jpg' },
      { id: 'public-1', type: 'image', uri: 'public-2.jpg' },
    ]);
  });

  it('adds one locked-private item when another user has private photos without granted access', () => {
    expect(
      buildGalleryItems({
        media: {
          public_gallery: ['public-1.jpg'],
          private_photo_count: 3,
        },
        isCurrentUser: false,
        photoAccessAction: 0,
      })
    ).toEqual([
      { id: 'public-0', type: 'image', uri: 'public-1.jpg' },
      { id: 'locked-private', type: 'locked-private' },
    ]);
  });

  it('keeps locked-private item when access is already requested', () => {
    expect(
      buildGalleryItems({
        media: {
          public_gallery: [],
          private_photo_count: 2,
        },
        isCurrentUser: false,
        photoAccessAction: 1,
      })
    ).toEqual([{ id: 'locked-private', type: 'locked-private' }]);
  });

  it('includes own private gallery images for the current user', () => {
    expect(
      buildGalleryItems({
        media: {
          public_gallery: ['public-1.jpg'],
          private_gallery: ['private-1.jpg', 'private-2.jpg'],
          private_photo_count: 2,
        },
        isCurrentUser: true,
        photoAccessAction: null,
      })
    ).toEqual([
      { id: 'public-0', type: 'image', uri: 'public-1.jpg' },
      {
        id: 'private-0',
        private: true,
        type: 'image',
        uri: 'private-1.jpg',
      },
      {
        id: 'private-1',
        private: true,
        type: 'image',
        uri: 'private-2.jpg',
      },
    ]);
  });

  it('appends granted private images for another user without adding a locked item', () => {
    expect(
      buildGalleryItems({
        media: {
          public_gallery: ['public-1.jpg'],
          private_photo_count: 2,
        },
        grantedPrivateGallery: ['private-1.jpg'],
        isCurrentUser: false,
        photoAccessAction: 2,
      })
    ).toEqual([
      { id: 'public-0', type: 'image', uri: 'public-1.jpg' },
      {
        id: 'private-0',
        private: true,
        type: 'image',
        uri: 'private-1.jpg',
      },
    ]);
  });

  it('returns an empty list when media is missing', () => {
    expect(
      buildGalleryItems({
        media: undefined,
        isCurrentUser: false,
        photoAccessAction: null,
      })
    ).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```sh
npx jest src/components/image-viewer/__tests__/gallery-items.test.ts --runInBand
```

Expected: FAIL because `../gallery-items` does not exist.

- [ ] **Step 3: Create the helper implementation**

Create `src/components/image-viewer/gallery-items.ts` with:

```ts
export type GalleryMedia = {
  private_gallery?: string[] | null;
  private_photo_count?: number | null;
  public_gallery?: string[] | null;
};

export type PhotoAccessAction = 0 | 1 | 2 | null | undefined;

export type GalleryImageItem = {
  id: string;
  private?: boolean;
  type: 'image';
  uri: string;
};

export type GalleryLockedPrivateItem = {
  id: 'locked-private';
  type: 'locked-private';
};

export type GalleryItem = GalleryImageItem | GalleryLockedPrivateItem;

type BuildGalleryItemsOptions = {
  grantedPrivateGallery?: string[] | null;
  isCurrentUser: boolean;
  media?: GalleryMedia | null;
  photoAccessAction: PhotoAccessAction;
};

const toImageItems = (
  uris: string[] | null | undefined,
  idPrefix: 'public' | 'private',
  isPrivate = false
): GalleryImageItem[] => {
  if (!uris?.length) {
    return [];
  }

  return uris.filter(Boolean).map((uri, index) => ({
    id: `${idPrefix}-${index}`,
    private: isPrivate || undefined,
    type: 'image',
    uri,
  }));
};

export const buildGalleryItems = ({
  grantedPrivateGallery,
  isCurrentUser,
  media,
  photoAccessAction,
}: BuildGalleryItemsOptions): GalleryItem[] => {
  if (!media) {
    return [];
  }

  const items: GalleryItem[] = [
    ...toImageItems(media.public_gallery, 'public'),
  ];

  if (isCurrentUser) {
    return [...items, ...toImageItems(media.private_gallery, 'private', true)];
  }

  if (photoAccessAction === 2) {
    return [...items, ...toImageItems(grantedPrivateGallery, 'private', true)];
  }

  if ((media.private_photo_count ?? 0) > 0) {
    return [...items, { id: 'locked-private', type: 'locked-private' }];
  }

  return items;
};
```

- [ ] **Step 4: Run the helper test to verify it passes**

Run:

```sh
npx jest src/components/image-viewer/__tests__/gallery-items.test.ts --runInBand
```

Expected: PASS for all `buildGalleryItems` tests. If Jest fails before running tests because of the known `jest-setup.ts` matcher import issue, do not fix unrelated setup in this task; record the blocker and continue with `yarn type-check` after implementation.

- [ ] **Step 5: Commit**

```sh
git add src/components/image-viewer/gallery-items.ts src/components/image-viewer/__tests__/gallery-items.test.ts
git commit -m "test(app): cover profile gallery item composition"
```

---

### Task 2: Replace ImageViewer State And Data Loading With Normalized Items

**Files:**

- Modify: `src/components/ImageViewer.tsx`

- [ ] **Step 1: Update imports**

In `src/components/ImageViewer.tsx`, replace the import block with this shape:

```ts
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ripple from 'react-native-material-ripple';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SwiperFlatList } from 'react-native-swiper-flatlist';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {
  buildGalleryItems,
  type GalleryItem,
} from './image-viewer/gallery-items';
import { hp, Typography, wp } from '../global';
import { CheckRtl, LanguageKeys } from '../languages';
import { Colors, Fonts } from '../res';
import { ApiServices, useGlobalContext } from '../services';
import { PrivacyProtectedAlert, RequestSentAlert } from './alerts';
import ModalLoader from './loaders/ModalLoader';
import Text from './Text';
```

Remove the old `Dimensions`, `FlatList` dot animation dependencies, and `Animation` import. Keep `FlatList` because it will render the thumbnail rail.

- [ ] **Step 2: Replace top-level state**

Inside `ImageViewer`, replace `images`, `dotsRef`, `imageLoader`, and object-shaped `activeIndex` state with:

```ts
const { currentUser } = useGlobalContext();
const [userData, setUserData] = useState(props?.route?.params?.userData);
const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
const [loader, setLoader] = useState({
  visible: true,
  message: LanguageKeys.loading,
});
const [privacyProtectedAlertVisible, setPrivacyProtectedAlertVisible] =
  useState(false);
const [requestSentAlertVisible, setRequestSentAlertVisible] = useState(false);
const [activeIndex, setActiveIndex] = useState(0);
const [loadingImageIds, setLoadingImageIds] = useState<Record<string, boolean>>(
  {}
);
const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>(
  {}
);

const sliderRef = useRef<any>(null);
const thumbnailRef = useRef<FlatList<GalleryItem>>(null);
const rtl = CheckRtl();
```

- [ ] **Step 3: Add derived labels and safe helpers**

Add these helpers below the alert close handlers:

```ts
const imageItems = useMemo(
  () => galleryItems.filter((item) => item.type === 'image'),
  [galleryItems]
);

const activeItem = galleryItems[activeIndex];
const currentPosition = galleryItems.length === 0 ? 0 : activeIndex + 1;

const userFirstName =
  userData?.first_name || userData?.full_name?.split(' ')?.[0] || '';
const galleryTitle = userFirstName
  ? `${userFirstName}'s photos`
  : LanguageKeys.photosAndVideos;
const galleryContext =
  activeItem?.type === 'locked-private'
    ? LanguageKeys.privatePhotoDes
    : LanguageKeys.photosAndVideos;

const hideLoader = useCallback(() => {
  setLoader({
    visible: false,
    message: LanguageKeys.loading,
  });
}, []);

const scrollThumbnailsToIndex = useCallback(
  (index: number) => {
    if (index < 0 || index >= galleryItems.length) {
      return;
    }

    thumbnailRef.current?.scrollToIndex({
      animated: true,
      index,
      viewPosition: 0.5,
    });
  },
  [galleryItems.length]
);
```

This reuses existing language keys. The possessive English title is acceptable because the old screen had no title and this exact file currently already contains local UI strings only through `LanguageKeys`; if localization is required later, add a key in a separate translation pass.

- [ ] **Step 4: Replace `getPhotos`**

Replace the old `getPhotos` function with:

```ts
const getPhotos = useCallback(async () => {
  const media = userData?.media;
  const photoAccessAction = userData?.photo_access_action;
  const isCurrentUser = userData?.id === currentUser?.id;

  if (!media) {
    setGalleryItems([]);
    hideLoader();
    return;
  }

  if (photoAccessAction === 2 && !isCurrentUser) {
    try {
      const res: any = await ApiServices.viewPrivateMedia(userData?.id);
      setGalleryItems(
        buildGalleryItems({
          grantedPrivateGallery: res?.private_gallery,
          isCurrentUser,
          media,
          photoAccessAction,
        })
      );
    } catch {
      setGalleryItems(
        buildGalleryItems({
          isCurrentUser,
          media,
          photoAccessAction,
        })
      );
    } finally {
      hideLoader();
    }
    return;
  }

  setGalleryItems(
    buildGalleryItems({
      isCurrentUser,
      media,
      photoAccessAction,
    })
  );
  hideLoader();
}, [currentUser?.id, hideLoader, userData]);
```

- [ ] **Step 5: Replace load effect**

Replace the existing `useEffect` with:

```ts
useEffect(() => {
  const timer = setTimeout(() => {
    getPhotos();
  }, 0);

  return () => clearTimeout(timer);
}, [getPhotos]);
```

- [ ] **Step 6: Type-check this intermediate state**

Run:

```sh
yarn type-check
```

Expected: PASS, or only errors directly caused by incomplete render replacement in the next task. If render errors appear because old JSX still references `images`, `imageLoader`, `dotsRef`, or object-shaped `activeIndex`, proceed immediately to Task 3 before committing.

---

### Task 3: Build The Redesigned Viewer UI

**Files:**

- Modify: `src/components/ImageViewer.tsx`

- [ ] **Step 1: Add image load and navigation handlers**

Add these handlers before the render helpers:

```ts
const setImageLoading = useCallback((id: string, isLoading: boolean) => {
  setLoadingImageIds((previous) => ({
    ...previous,
    [id]: isLoading,
  }));
}, []);

const setImageFailed = useCallback(
  (id: string) => {
    setFailedImageIds((previous) => ({
      ...previous,
      [id]: true,
    }));
    setImageLoading(id, false);
  },
  [setImageLoading]
);

const onSliderIndexChange = useCallback(
  ({ index }: { index: number; prevIndex: number }) => {
    setActiveIndex(index);
    scrollThumbnailsToIndex(index);
  },
  [scrollThumbnailsToIndex]
);

const onThumbnailPress = useCallback(
  (index: number) => {
    if (index < 0 || index >= galleryItems.length) {
      return;
    }

    setActiveIndex(index);
    sliderRef.current?.scrollToIndex({ animated: true, index });
  },
  [galleryItems.length]
);
```

- [ ] **Step 2: Keep request-access behavior**

Replace `onPPAlertRequestAccessPress` with:

```ts
const onPPAlertRequestAccessPress = useCallback(() => {
  setPrivacyProtectedAlertVisible(false);
  setLoader({
    visible: true,
    message: LanguageKeys.sendingRequest,
  });

  ApiServices.privatePhotoAccessRequest(userData?.id)
    .then(() => {
      setRequestSentAlertVisible(true);
      setUserData((previous: any) => ({
        ...previous,
        photo_access_action: 1,
      }));
      hideLoader();
    })
    .catch(hideLoader);
}, [hideLoader, userData?.id]);
```

Use `photo_access_action: 1` for "already requested". The old code set it to `0`, which made the disabled/requested state unreliable after a successful request.

- [ ] **Step 3: Add render helpers**

Add these render helpers:

```tsx
const renderImageFallback = () => (
  <View style={Styles.imageFallback}>
    <Ionicons name="image-outline" color={Colors.whiteRGBA90} size={wp(13)} />
    <Text style={Styles.imageFallbackText}>{LanguageKeys.tryAgain}</Text>
  </View>
);

const renderLockedPrivatePanel = () => {
  const alreadyRequested = userData?.photo_access_action === 1;

  return (
    <View style={Styles.lockedSlide}>
      <View style={Styles.lockedIconWrap}>
        <Ionicons
          name="lock-closed-outline"
          color={Colors.color2}
          size={wp(10)}
        />
      </View>
      <Text style={Styles.lockedTitle}>{LanguageKeys.privacyProtected}</Text>
      <Text style={Styles.lockedDescription}>
        {LanguageKeys.privatePhotoDesTwo}
      </Text>
      <Ripple
        style={[
          Styles.requestAccessButton,
          alreadyRequested && Styles.requestAccessButtonDisabled,
        ]}
        onPress={openPrivacyProtectedAlert}
        disabled={alreadyRequested}
        rippleColor={Colors.primaryLite}
      >
        <Text
          style={[
            Styles.requestAccessText,
            alreadyRequested && Styles.requestAccessTextDisabled,
          ]}
          numberOfLines={1}
        >
          {alreadyRequested
            ? LanguageKeys.privatePhotoAlreadyRequested
            : LanguageKeys.requestAccess}
        </Text>
      </Ripple>
    </View>
  );
};

const renderSlide = ({ item }: { item: GalleryItem }) => {
  if (item.type === 'locked-private') {
    return (
      <View style={Styles.slide}>
        <LinearGradient
          colors={[Colors.ink, Colors.theme, Colors.color1]}
          style={StyleSheet.absoluteFill}
        />
        {renderLockedPrivatePanel()}
      </View>
    );
  }

  const isLoading = loadingImageIds[item.id];
  const hasFailed = failedImageIds[item.id];

  return (
    <View style={Styles.slide}>
      {hasFailed ? (
        renderImageFallback()
      ) : (
        <Image
          resizeMode="cover"
          source={{ uri: item.uri }}
          style={Styles.slideImage}
          onLoadEnd={() => setImageLoading(item.id, false)}
          onLoadStart={() => setImageLoading(item.id, true)}
          onError={() => setImageFailed(item.id)}
        />
      )}
      <LinearGradient
        colors={[
          Colors.blackRGBA70,
          Colors.blackRGBA0,
          Colors.blackRGBA25,
          Colors.blackRGBA80,
        ]}
        locations={[0, 0.32, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />
      {isLoading && !hasFailed && (
        <View style={Styles.imageLoaderCon}>
          <ActivityIndicator color={Colors.color2} size={wp(8)} />
        </View>
      )}
    </View>
  );
};

const renderTopBar = () => (
  <View style={Styles.topOverlay}>
    <Ripple
      style={Styles.iconButton}
      onPress={onBackPress}
      hitSlop={12}
      rippleColor={Colors.whiteRGBA30}
    >
      <AntDesign
        name={rtl ? 'arrowright' : 'arrowleft'}
        color={Colors.color2}
        size={wp(6)}
      />
    </Ripple>
    <View style={Styles.titleWrap}>
      <Text style={Styles.viewerTitle} numberOfLines={1}>
        {galleryTitle}
      </Text>
      <Text style={Styles.viewerSubtitle} numberOfLines={1}>
        {galleryContext}
      </Text>
    </View>
    <View style={Styles.countPill}>
      <Text style={Styles.countText}>
        {galleryItems.length
          ? `${currentPosition} / ${galleryItems.length}`
          : '0 / 0'}
      </Text>
    </View>
  </View>
);

const renderThumbnail = ({
  index,
  item,
}: {
  index: number;
  item: GalleryItem;
}) => {
  const isActive = index === activeIndex;
  const thumbnailStyle = [
    Styles.thumbnailButton,
    isActive && Styles.thumbnailButtonActive,
  ];

  return (
    <Ripple
      style={thumbnailStyle}
      onPress={() => onThumbnailPress(index)}
      rippleColor={Colors.whiteRGBA30}
    >
      {item.type === 'locked-private' ? (
        <View style={Styles.lockedThumbnail}>
          <Ionicons
            name="lock-closed-outline"
            color={Colors.color2}
            size={wp(4.8)}
          />
        </View>
      ) : failedImageIds[item.id] ? (
        <View style={Styles.lockedThumbnail}>
          <Ionicons
            name="image-outline"
            color={Colors.whiteRGBA90}
            size={wp(4.8)}
          />
        </View>
      ) : (
        <Image
          resizeMode="cover"
          source={{ uri: item.uri }}
          style={Styles.thumbnailImage}
        />
      )}
    </Ripple>
  );
};

const renderThumbnailRail = () => {
  if (!galleryItems.length) {
    return null;
  }

  return (
    <View style={Styles.bottomOverlay}>
      <FlatList
        ref={thumbnailRef}
        data={galleryItems}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={renderThumbnail}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={Styles.thumbnailList}
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => scrollThumbnailsToIndex(index), 100);
        }}
      />
    </View>
  );
};

const renderEmptyList = () => (
  <View style={Styles.emptyListCon}>
    <Ripple
      style={[Styles.iconButton, Styles.emptyBackButton]}
      onPress={onBackPress}
      rippleColor={Colors.whiteRGBA30}
    >
      <AntDesign
        name={rtl ? 'arrowright' : 'arrowleft'}
        color={Colors.color2}
        size={wp(6)}
      />
    </Ripple>
    <View style={Styles.emptyIconWrap}>
      <Ionicons
        name="images-outline"
        color={Colors.primaryLite}
        size={wp(16)}
      />
    </View>
    <Text style={Styles.emptyListText}>{LanguageKeys.noImagesFound}</Text>
  </View>
);
```

- [ ] **Step 4: Replace returned JSX**

Replace the component `return` block with:

```tsx
return (
  <SafeAreaView edges={['top', 'bottom']} style={Styles.container}>
    <StatusBar barStyle="light-content" backgroundColor={Colors.color1} />
    <ModalLoader visible={loader.visible} message={loader.message} />
    {galleryItems.length ? (
      <>
        <SwiperFlatList
          index={0}
          data={galleryItems}
          renderItem={renderSlide}
          ref={sliderRef}
          contentContainerStyle={Styles.sliderContainer}
          showPagination={false}
          onChangeIndex={onSliderIndexChange}
        />
        {renderTopBar()}
        {renderThumbnailRail()}
      </>
    ) : (
      renderEmptyList()
    )}
    <PrivacyProtectedAlert
      visible={privacyProtectedAlertVisible}
      onClose={closePrivacyProtectedAlert}
      onPress={onPPAlertRequestAccessPress}
    />
    <RequestSentAlert
      visible={requestSentAlertVisible}
      onClose={closeRequestSentAlert}
      onPress={closeRequestSentAlert}
    />
  </SafeAreaView>
);
```

- [ ] **Step 5: Run type-check**

Run:

```sh
yarn type-check
```

Expected: PASS, or actionable TypeScript errors only in `ImageViewer.tsx` that must be fixed before Task 4.

---

### Task 4: Replace ImageViewer Styles With The New Visual System

**Files:**

- Modify: `src/components/ImageViewer.tsx`

- [ ] **Step 1: Replace the style object**

Remove `const { width } = Dimensions.get('window');` and replace the entire `Styles` object with:

```ts
const Styles = StyleSheet.create({
  bottomOverlay: {
    backgroundColor: Colors.blackRGBA50,
    borderColor: Colors.whiteRGBA18,
    borderRadius: wp(6),
    borderWidth: 1,
    bottom: hp(2),
    left: wp(3),
    paddingVertical: hp(1.2),
    position: 'absolute',
    right: wp(3),
  },
  container: {
    backgroundColor: Colors.color1,
    flex: 1,
  },
  countPill: {
    alignItems: 'center',
    backgroundColor: Colors.blackRGBA50,
    borderColor: Colors.whiteRGBA18,
    borderRadius: wp(5),
    borderWidth: 1,
    height: wp(10.5),
    justifyContent: 'center',
    minWidth: wp(15),
    paddingHorizontal: wp(3),
  },
  countText: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small,
  },
  emptyBackButton: {
    left: wp(4),
    position: 'absolute',
    top: hp(2),
  },
  emptyIconWrap: {
    alignItems: 'center',
    backgroundColor: Colors.whiteRGBA10,
    borderColor: Colors.whiteRGBA18,
    borderRadius: wp(12),
    borderWidth: 1,
    height: wp(24),
    justifyContent: 'center',
    marginBottom: hp(2),
    width: wp(24),
  },
  emptyListCon: {
    alignItems: 'center',
    backgroundColor: Colors.color1,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(10),
  },
  emptyListText: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium,
    textAlign: 'center',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: Colors.whiteRGBA18,
    borderColor: Colors.whiteRGBA18,
    borderRadius: wp(5.5),
    borderWidth: 1,
    height: wp(11),
    justifyContent: 'center',
    overflow: 'hidden',
    width: wp(11),
  },
  imageFallback: {
    alignItems: 'center',
    backgroundColor: Colors.ink,
    flex: 1,
    justifyContent: 'center',
    width: wp(100),
  },
  imageFallbackText: {
    color: Colors.whiteRGBA90,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small2,
    marginTop: hp(1),
  },
  imageLoaderCon: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedDescription: {
    color: Colors.whiteRGBA90,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small2,
    lineHeight: wp(5),
    marginTop: hp(1.2),
    paddingHorizontal: wp(8),
    textAlign: 'center',
  },
  lockedIconWrap: {
    alignItems: 'center',
    backgroundColor: Colors.whiteRGBA18,
    borderColor: Colors.whiteRGBA30,
    borderRadius: wp(13),
    borderWidth: 1,
    height: wp(26),
    justifyContent: 'center',
    width: wp(26),
  },
  lockedSlide: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: wp(8),
    width: wp(100),
  },
  lockedThumbnail: {
    alignItems: 'center',
    backgroundColor: Colors.themeRGBA50,
    flex: 1,
    justifyContent: 'center',
  },
  lockedTitle: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium,
    marginTop: hp(2),
    textAlign: 'center',
  },
  requestAccessButton: {
    alignItems: 'center',
    backgroundColor: Colors.color2,
    borderRadius: wp(6),
    justifyContent: 'center',
    marginTop: hp(2.4),
    minHeight: hp(5.4),
    paddingHorizontal: wp(6),
  },
  requestAccessButtonDisabled: {
    backgroundColor: Colors.whiteRGBA18,
    borderColor: Colors.whiteRGBA30,
    borderWidth: 1,
  },
  requestAccessText: {
    color: Colors.primary,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.small2,
    maxWidth: wp(68),
  },
  requestAccessTextDisabled: {
    color: Colors.color2,
  },
  slide: {
    backgroundColor: Colors.color1,
    flex: 1,
    height: '100%',
    width: wp(100),
  },
  slideImage: {
    height: '100%',
    width: wp(100),
  },
  sliderContainer: {
    flexGrow: 1,
  },
  thumbnailButton: {
    backgroundColor: Colors.blackRGBA50,
    borderColor: Colors.whiteRGBA18,
    borderRadius: wp(3.5),
    borderWidth: 1,
    height: hp(8),
    marginRight: wp(2),
    overflow: 'hidden',
    width: wp(14),
  },
  thumbnailButtonActive: {
    borderColor: Colors.color2,
    borderWidth: 2,
  },
  thumbnailImage: {
    height: '100%',
    width: '100%',
  },
  thumbnailList: {
    paddingHorizontal: wp(3),
  },
  titleWrap: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: wp(3),
    minWidth: 0,
  },
  topOverlay: {
    alignItems: 'center',
    flexDirection: 'row',
    left: wp(4),
    position: 'absolute',
    right: wp(4),
    top: hp(2),
  },
  viewerSubtitle: {
    color: Colors.whiteRGBA90,
    fontFamily: Fonts.APPFONT_R,
    fontSize: Typography.small,
    marginTop: hp(0.4),
    textAlign: 'center',
  },
  viewerTitle: {
    color: Colors.color2,
    fontFamily: Fonts.APPFONT_B,
    fontSize: Typography.medium,
    textAlign: 'center',
  },
});
```

- [ ] **Step 2: Run focused lint**

Run:

```sh
npx eslint src/components/ImageViewer.tsx src/components/image-viewer/gallery-items.ts src/components/image-viewer/__tests__/gallery-items.test.ts
```

Expected: PASS. If `react-hooks/exhaustive-deps`, import sorting, or type-only import errors appear, apply the lint-suggested fixes without changing behavior.

- [ ] **Step 3: Run type-check**

Run:

```sh
yarn type-check
```

Expected: PASS.

- [ ] **Step 4: Commit**

```sh
git add src/components/ImageViewer.tsx src/components/image-viewer/gallery-items.ts src/components/image-viewer/__tests__/gallery-items.test.ts
git commit -m "feat(app): redesign profile gallery viewer"
```

---

### Task 5: Manual State Review And Final Verification

**Files:**

- Modify only if Task 4 reveals a small visual or type issue: `src/components/ImageViewer.tsx`

- [ ] **Step 1: Review gallery states from code paths**

Check the following states by inspecting `buildGalleryItems` test coverage and the `ImageViewer` branches:

```txt
Public-only gallery:
  media.public_gallery has images
  media.private_photo_count is 0
  Expected: image slides + thumbnails + count

Public plus locked private:
  media.public_gallery has images
  media.private_photo_count is greater than 0
  photo_access_action is 0
  Expected: image slides plus one locked-private slide and thumbnail

Request already sent:
  photo_access_action is 1
  Expected: locked-private slide remains, CTA is disabled/status-style

Granted private access:
  photo_access_action is 2
  Expected: viewPrivateMedia loads private_gallery and appends image slides

Current user's own gallery:
  currentUser.id equals userData.id
  Expected: media.private_gallery is appended directly

Empty gallery:
  media missing or no galleries/no private count
  Expected: branded empty state with back button

Image load failure:
  Image onError fires for one image id
  Expected: that slide and thumbnail show image fallback
```

- [ ] **Step 2: Run final verification commands**

Run:

```sh
npx eslint src/components/ImageViewer.tsx src/components/image-viewer/gallery-items.ts src/components/image-viewer/__tests__/gallery-items.test.ts
yarn type-check
npx jest src/components/image-viewer/__tests__/gallery-items.test.ts --runInBand
```

Expected:

- ESLint passes for touched files.
- TypeScript passes.
- Jest passes, unless blocked by the existing repo-level Jest setup issue documented in `CLAUDE.md`. If blocked, record the exact setup error in the final response.

- [ ] **Step 3: Final status check**

Run:

```sh
git status --short
```

Expected: no uncommitted changes from this implementation. Existing unrelated untracked files may remain; do not add or delete them.

- [ ] **Step 4: Final response**

Report:

```txt
Implemented the profile gallery viewer redesign.

Changed:
- Normalized gallery item composition with tests.
- Rebuilt ImageViewer with full-screen photo slides, top context, count pill, thumbnail navigation, locked private access panel, and improved empty/error/loading states.

Verified:
- npx eslint src/components/ImageViewer.tsx src/components/image-viewer/gallery-items.ts src/components/image-viewer/__tests__/gallery-items.test.ts
- yarn type-check
- npx jest src/components/image-viewer/__tests__/gallery-items.test.ts --runInBand
```

If any verification command could not pass because of pre-existing repository setup, name that command and the exact blocker.
