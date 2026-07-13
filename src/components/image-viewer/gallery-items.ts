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
    ...(isPrivate ? { private: true } : {}),
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
