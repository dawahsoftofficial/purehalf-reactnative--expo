const EndPoints = {
  authenticate: '/authenticate',
  socialAuthenticate: '/socialite/authenticate',
  updateInfo: '/auth/update/info',
  updateDetails: '/auth/update/detail',
  getLanguageList: '/auth/list/language',
  getNationalityList: '/auth/list/nationality',
  getUsers: '/auth/user/index',
  getUserDetail: '/auth/user',
  recommendedUsers: '/auth/user/exclusive?page=1&type=-1',
  getCurrentUserDetail: '/auth/my/detail',
  messagePushNotification:
    'https://fcm.googleapis.com/v1/projects/purehalf-19603/messages:send',
  getAttribute: '/auth/list/attribute',
  logout: '/auth/logout',
  deleteMedia: '/auth/media/delete',
  moveMedia: '/auth/media/move',
  mediaUpload: '/auth/media/upload',
  interactionAction: '/auth/interaction/action',
  topPicks: '/auth/reviewed_top_picks',
  privatePhotoAccessRequest: '/auth/interaction/photo/access',
  privatePhotoAcceptRequest: '/auth/interaction/photo/access/approve',
  privatePhotoRejectRequest: '/auth/interaction/photo/access/reject',
  privatePhotoRemoveRequest: '/auth/interaction/photo/access/remove',
  counter: '/auth/counter',
  searchFilterApply: '/auth/filter/apply',
  saveSearchFilter: '/auth/filter/store',
  searchFilter: '/auth/filter',
  getSearchFilter: '/auth/filter/index',
  deleteAccountOtp: '/auth/otp/email/send',
  verifyOtp: '/auth/otp/email/verify',
  deleteAccount: '/auth/delete/account',
  user: '/auth/user',
  privateMedia: '/private/media',
  createGuardian: '/auth/guardian/create',
  removeGuardian: '/auth/guardian/remove',
  resendOtp: '/auth/guardian/resend-otp',
  authenticateGuardian: '/guardian/authenticate',
  verifyGuardian: '/auth/guardian/verify',
  changeGuardianPassword: '/guardian/auth/change-password',
  guardianAuthUser: '/guardian/auth/user',
  guardianLogout: 'guardian/auth/logout',
  storeQuerySupport: '/auth/query/store',
  getButtonsActiveStatus: '/settings',
  paymentInfo: '/auth/list/paymentinfo',
  snedMessageNotification: '/auth/send/message/notification',

  // Message/Conversation endpoints
  startConversation: '/auth/conversations/start',
  getConversationsList: '/auth/conversations/list',
  getConversationMessages: (conversationId: number) =>
    `/auth/conversations/${conversationId}/messages`,
  sendConversationMessage: (conversationId: number) =>
    `/auth/conversations/${conversationId}/messages`,
  clearConversation: (conversationId: number) =>
    `/auth/conversations/${conversationId}/clear`,
  deleteConversation: (conversationId: number) =>
    `/auth/conversations/${conversationId}`,
  blockConversationParticipant: (
    conversationId: number,
    participantId: number
  ) => `/auth/conversations/${conversationId}/block/${participantId}`,
  reportMessage: (messageId: number) =>
    `/auth/conversations/messages/${messageId}/report`,
  markMessageAsRead: (messageId: number) =>
    `/auth/conversations/messages/${messageId}/read`,
  markAllMessagesAsRead: (conversationId: number) =>
    `/auth/conversations/${conversationId}/mark-all-read`,
};

export default EndPoints;
