import { Api } from '../api/Middleware';

export type TesterState = {
  id: number;
  is_tester: boolean;
  tester_can_view_private_media: boolean;
  tester_is_invisible: boolean;
  tester_force_recommendations: boolean;
  gender: 'male' | 'female';
  date_of_birth: string;
  chat_credits: number;
  membership_status: number;
  membership_expiry?: string | null;
};

const result = <T>(response: { data?: { results?: T } }): T =>
  response.data?.results as T;

export const TesterApi = {
  async status() {
    return result<TesterState>(await Api.get('/auth/tester/status'));
  },
  async updateSelf(data: Partial<TesterState>) {
    return result<TesterState>(await Api.patch('/auth/tester/self', data));
  },
  async adjustCredits(operation: 'add' | 'remove', amount: number) {
    return result<TesterState>(
      await Api.post('/auth/tester/credits', { operation, amount })
    );
  },
  async submitNote(data: FormData) {
    return result(await Api.post('/auth/tester/notes', data));
  },
  async insights(userId: number, type: string) {
    return result<any>(
      await Api.get(`/auth/tester/users/${userId}/insights`, {
        params: { type },
      })
    );
  },
  async media(userId: number) {
    return result<any>(await Api.get(`/auth/tester/users/${userId}/media`));
  },
  async makeUserActive(userId: number) {
    return result<{ id: number; last_online_at: string }>(
      await Api.patch(`/auth/tester/users/${userId}/active`)
    );
  },
  async resetSelfData(
    type: 'daily_recommendations' | 'visits_to_me' | 'liked_by_me' | 'likes_me'
  ) {
    return result<{ type: string; cleared_count: number }>(
      await Api.post('/auth/tester/self/reset', { type })
    );
  },
  async deleteSelf() {
    return Api.delete('/auth/tester/self', {
      data: { confirmation: 'DELETE MY TEST ACCOUNT' },
    });
  },
};
