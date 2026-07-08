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
