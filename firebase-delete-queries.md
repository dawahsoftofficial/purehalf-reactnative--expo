# Firebase Delete Queries for Staging and Production

## Method 1: Using Firebase SDK (Code)

### Delete All Conversations (Staging)

```typescript
import { getDatabase, ref, remove } from '@react-native-firebase/database';

const database = getDatabase();
const stagingRef = ref(database, 'conversations-staging');
remove(stagingRef)
  .then(() => console.log('All staging conversations deleted'))
  .catch((error) => console.error('Error deleting:', error));
```

### Delete All Conversations (Production)

```typescript
import { getDatabase, ref, remove } from '@react-native-firebase/database';

const database = getDatabase();
const productionRef = ref(database, 'conversations');
remove(productionRef)
  .then(() => console.log('All production conversations deleted'))
  .catch((error) => console.error('Error deleting:', error));
```

### Delete Specific Conversation (Staging)

```typescript
import { getDatabase, ref, remove } from '@react-native-firebase/database';

const database = getDatabase();
const conversationId = 'YOUR_CONVERSATION_ID';
const conversationRef = ref(
  database,
  `conversations-staging/${conversationId}`
);
remove(conversationRef)
  .then(() => console.log('Conversation deleted'))
  .catch((error) => console.error('Error deleting:', error));
```

### Delete Specific Conversation (Production)

```typescript
import { getDatabase, ref, remove } from '@react-native-firebase/database';

const database = getDatabase();
const conversationId = 'YOUR_CONVERSATION_ID';
const conversationRef = ref(database, `conversations/${conversationId}`);
remove(conversationRef)
  .then(() => console.log('Conversation deleted'))
  .catch((error) => console.error('Error deleting:', error));
```

### Delete All Messages from a Conversation (Staging)

```typescript
import { getDatabase, ref, remove } from '@react-native-firebase/database';

const database = getDatabase();
const conversationId = 'YOUR_CONVERSATION_ID';
const messagesRef = ref(
  database,
  `conversations-staging/${conversationId}/messages`
);
remove(messagesRef)
  .then(() => console.log('All messages deleted'))
  .catch((error) => console.error('Error deleting:', error));
```

### Delete All Messages from a Conversation (Production)

```typescript
import { getDatabase, ref, remove } from '@react-native-firebase/database';

const database = getDatabase();
const conversationId = 'YOUR_CONVERSATION_ID';
const messagesRef = ref(database, `conversations/${conversationId}/messages`);
remove(messagesRef)
  .then(() => console.log('All messages deleted'))
  .catch((error) => console.error('Error deleting:', error));
```

## Method 2: Using Firebase CLI

### Delete All Conversations (Staging)

```bash
firebase database:remove /conversations-staging --project YOUR_PROJECT_ID --force
```

### Delete All Conversations (Production)

```bash
firebase database:remove /conversations --project YOUR_PROJECT_ID --force
```

### Delete Specific Conversation (Staging)

```bash
firebase database:remove /conversations-staging/CONVERSATION_ID --project YOUR_PROJECT_ID --force
```

### Delete Specific Conversation (Production)

```bash
firebase database:remove /conversations/CONVERSATION_ID --project YOUR_PROJECT_ID --force
```

## Method 3: Using Firebase Console

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to Realtime Database
4. Navigate to the path:
   - **Staging**: `conversations-staging`
   - **Production**: `conversations`
5. Click on the path and delete

## Method 4: Using REST API

### Delete All Conversations (Staging)

```bash
curl -X DELETE "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com/conversations-staging.json?auth=YOUR_AUTH_TOKEN"
```

### Delete All Conversations (Production)

```bash
curl -X DELETE "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com/conversations.json?auth=YOUR_AUTH_TOKEN"
```

## Method 5: Batch Delete Script (Node.js)

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com',
});

const db = admin.database();

// Delete all staging conversations
async function deleteStagingConversations() {
  const stagingRef = db.ref('conversations-staging');
  await stagingRef.remove();
  console.log('All staging conversations deleted');
}

// Delete all production conversations
async function deleteProductionConversations() {
  const productionRef = db.ref('conversations');
  await productionRef.remove();
  console.log('All production conversations deleted');
}

// Delete conversations by user ID
async function deleteConversationsByUserId(userId, isStaging = false) {
  const path = isStaging ? 'conversations-staging' : 'conversations';
  const ref = db.ref(path);
  const snapshot = await ref
    .orderByChild(`convDetails/participantsData/${userId}/id`)
    .equalTo(userId)
    .once('value');

  const updates = {};
  snapshot.forEach((child) => {
    updates[child.key] = null;
  });

  await ref.update(updates);
  console.log(`Deleted ${Object.keys(updates).length} conversations`);
}

// Usage
// deleteStagingConversations();
// deleteProductionConversations();
// deleteConversationsByUserId('USER_ID', true); // true for staging, false for production
```

## Important Notes:

⚠️ **WARNING**: These operations are **irreversible**. Make sure to:

1. Backup your data before deleting
2. Test on staging first
3. Double-check the paths before executing
4. Use proper authentication/authorization

## Safe Delete (Recommended Approach)

Instead of deleting everything, consider:

1. **Soft delete**: Mark conversations as deleted instead of removing them
2. **Archive**: Move to an archive path before deleting
3. **Backup first**: Export data before deletion
