import { canViewIntroMedia, ownerIntroAction } from './profile-intro-media';

describe('profile intro media', () => {
  it('only exposes approved media while the feature is enabled', () => {
    expect(
      canViewIntroMedia({ enabled: true, url: 'video.mp4', status: 'approved' })
    ).toBe(true);
    expect(
      canViewIntroMedia({ enabled: true, url: 'video.mp4', status: 'pending' })
    ).toBe(false);
    expect(
      canViewIntroMedia({
        enabled: false,
        url: 'video.mp4',
        status: 'approved',
      })
    ).toBe(false);
    expect(
      canViewIntroMedia({ enabled: true, url: null, status: 'approved' })
    ).toBe(false);
  });

  it('keeps replacement available after a submission', () => {
    expect(ownerIntroAction('video', false)).toBe('recordVideoIntro');
    expect(ownerIntroAction('video', true)).toBe('changeVideoIntro');
    expect(ownerIntroAction('voice', true)).toBe('changeVoiceIntro');
  });
});
