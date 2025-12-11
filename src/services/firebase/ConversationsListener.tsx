import database from '@react-native-firebase/database';

const conversationsRef: any = database().ref('conversations');

export const startConversationsListener = (
  userId: any,
  onChildAdded: any,
  onChildChanged: any,
  onChildRemoved: any
) => {
  const conversationsRef = database().ref('conversations');

  conversationsRef
    .orderByChild(`convDetails/participantsDeleteFlag/${userId}/deleteStatus`)
    .equalTo(false)
    .on('child_added', (snapshot) => {
      const conversationId = snapshot.key;
      const conversationData = snapshot.val();
      onChildAdded(conversationId, conversationData);
    });

  conversationsRef
    .orderByChild(`convDetails/participantsDeleteFlag/${userId}/deleteStatus`)
    .equalTo(false)
    .on('child_changed', (snapshot) => {
      const conversationId = snapshot.key;
      const conversationData = snapshot.val();
      onChildChanged(conversationId, conversationData);
    });

  conversationsRef.on('child_removed', (snapshot) => {
    const conversationId = snapshot.key;
    onChildRemoved(conversationId);
  });
};

export const stopConversationsListener = () => {
  if (conversationsRef) {
    conversationsRef.off();
  }
};

export const getConversationsOnce = (userId: any, onValue: any) => {
  conversationsRef
    .orderByChild(`convDetails/participantsDeleteFlag/${userId}/deleteStatus`)
    .equalTo(false)
    .once('value', onValue);
};
