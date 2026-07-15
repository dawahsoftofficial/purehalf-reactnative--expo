export type IntroMediaKind = 'video' | 'voice';
export type IntroMediaStatus = 'pending' | 'approved' | 'rejected' | null;

export type IntroMedia = {
  intro_video?: string | null;
  intro_video_status?: IntroMediaStatus;
  intro_video_rejection_reason?: string | null;
  intro_voice?: string | null;
  intro_voice_status?: IntroMediaStatus;
  intro_voice_rejection_reason?: string | null;
};

export const introMediaFields = (kind: IntroMediaKind) => ({
  url: `intro_${kind}` as const,
  status: `intro_${kind}_status` as const,
  reason: `intro_${kind}_rejection_reason` as const,
});

export const canViewIntroMedia = ({
  enabled,
  url,
  status,
}: {
  enabled: boolean;
  url?: string | null;
  status?: IntroMediaStatus;
}): boolean => enabled && Boolean(url) && status === 'approved';

export const ownerIntroAction = (
  kind: IntroMediaKind,
  hasMedia: boolean
):
  | 'recordVideoIntro'
  | 'recordVoiceIntro'
  | 'changeVideoIntro'
  | 'changeVoiceIntro' => {
  if (kind === 'video') {
    return hasMedia ? 'changeVideoIntro' : 'recordVideoIntro';
  }

  return hasMedia ? 'changeVoiceIntro' : 'recordVoiceIntro';
};
