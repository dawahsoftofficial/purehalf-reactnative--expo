/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiServices, StorageManager } from '../../services';
import { buildIntroSummary } from './build-summary';

// Flush any locally-held primer answers to the account after auth. The backend
// stores the JSON, resolves fact labels → columns, and generates the profile
// summary. Non-blocking and idempotent: on failure the answers stay in MMKV for
// a later retry; on success they're cleared.
export const flushPrimerAnswers = async (): Promise<void> => {
  const { getData, setData, storageKeys } = StorageManager;
  try {
    const stored: any = await getData(storageKeys.PRIMER_ANSWERS);
    if (!stored?.answers || !stored?.gender) return;
    await ApiServices.commitIntroAnswers({
      gender: stored.gender,
      intro_answers: stored.answers,
      intro_summary: buildIntroSummary(stored.answers, stored.gender),
    });
    await setData(storageKeys.PRIMER_ANSWERS, null);
  } catch {
    // keep the answers for a retry on next auth / app open
  }
};
