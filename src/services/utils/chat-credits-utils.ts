import moment from 'moment';

/**
 * Checks if chat credits can be collected based on 24-hour cooldown
 * Premium check should be done at the call site using premium-store
 * @param lastCollectedAt - The timestamp of last collection (can be null or ISO string)
 * @returns true if credits can be collected (more than 24 hours passed or never collected), false otherwise
 */
export function canCollectChatCredits(
  lastCollectedAt: string | null | undefined
): boolean {
  console.log('[canCollectChatCredits] lastCollectedAt:', lastCollectedAt);

  // If never collected, allow collection
  if (!lastCollectedAt) {
    console.log(
      '[canCollectChatCredits] Never collected before, allowing collection'
    );
    return true;
  }

  // Parse the last collection timestamp
  const lastCollectionTime = moment(lastCollectedAt);
  const now = moment();

  // Check if more than 24 hours have passed
  const hoursSinceLastCollection = now.diff(lastCollectionTime, 'hours');
  console.log(
    '[canCollectChatCredits] hoursSinceLastCollection:',
    hoursSinceLastCollection
  );

  const canCollect = hoursSinceLastCollection >= 24;
  console.log('[canCollectChatCredits] Can collect:', canCollect);

  return canCollect;
}
