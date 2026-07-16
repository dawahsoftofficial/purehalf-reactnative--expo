type UserData = {
  media?: {
    cover_image?: string | null;
  } | null;
  primary_image_to_show?: string;
  detail?: {
    tagline?: string;
    family_plan_id?: number;
    marriage_plan_id?: number;
    relocation_plan_id?: number;
    personality_id?: number[];
    interest_id?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

/**
 * Checks if a user's profile is completed based on all required fields.
 * Validates primary image, tagline, appearance, family background, lifestyle,
 * Islamic values, personality, future plans, and interests/hobbies.
 *
 * @param userData - The user data object containing media and detail information
 * @param profileDetailLocal - Local storage data containing profile detail categories
 * @returns true if all profile completion requirements are met, false otherwise
 */
export function checkProfileCompleted(
  userData: UserData | null | undefined,
  profileDetailLocal: unknown
): boolean {
  if (!userData) return false;

  const keysData: Record<string, boolean> = {
    primary_image_to_show: Boolean(userData?.primary_image_to_show),
    tagline: Boolean(userData.detail?.tagline),
    'appearance-0': true,
    'familybg-0': true,
    'life-0': true,
    'islamicval-0': true,
    'personality-0': true,
    'futurePlans-0': Boolean(
      userData.detail?.family_plan_id &&
      userData.detail?.marriage_plan_id &&
      userData.detail?.relocation_plan_id
    ),
    'myInterestAndHobbies-0': Boolean(userData.detail?.interest_id?.length),
  };

  if (profileDetailLocal && typeof profileDetailLocal === 'object') {
    let islamicCount = 0;
    Object.keys(profileDetailLocal).forEach((childKey) => {
      const childData = (profileDetailLocal as Record<string, unknown[]>)[
        childKey
      ];
      if (Array.isArray(childData)) {
        childData.forEach((element) => {
          if (
            typeof element === 'object' &&
            element !== null &&
            'apiKey' in element &&
            'category' in element
          ) {
            const apiKey = element.apiKey as string;
            const category = element.category as string;

            if (userData.detail && Object.keys(userData.detail).length) {
              const value =
                userData.detail[apiKey as keyof typeof userData.detail];
              if (value === null || value === undefined) {
                keysData[category] = false;
              }
              if (
                category === 'islamicval-0' &&
                (value !== null || value !== undefined)
              ) {
                islamicCount += 1;
              }
              // Match Welcome.tsx logic exactly: during iteration, if islamicCount < 4, keep as true
              if (islamicCount < 4) {
                keysData['islamicval-0'] = true;
              }
            } else {
              keysData[category] = false;
            }
          }
        });
      }
    });
    // Final validation: we need at least 4 islamic values to be complete
    // This ensures the badge only shows when all requirements are met
    if (islamicCount < 4) {
      keysData['islamicval-0'] = false;
    }
  }

  return Object.values(keysData).every((value) => value === true);
}

/**
 * Strips a leading emoji (and any following whitespace) from a label, e.g.
 * turning "🚀 Entrepreneurial Visionary" into "Entrepreneurial Visionary".
 * Personality/interest choice labels come from the server with an emoji
 * prefix baked into the value; this is a display-only cleanup.
 */
const LEADING_EMOJI = new RegExp(
  '^[\\p{Extended_Pictographic}\\u200D\\uFE0F]+\\s*',
  'u'
);

export function stripLeadingEmoji(value: string): string {
  return value.replace(LEADING_EMOJI, '');
}
