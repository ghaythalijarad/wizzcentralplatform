import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any user authenticated via an API key can "create", "read",
"update", and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Business: a
    .model({
      name: a.string(),
      email: a.email(),
      phone: a.phone(),
      category: a.string(),
      status: a.enum(['pending', 'approved', 'rejected', 'under_review', 'pending_verification', 'unknown', 'suspended']),
      owner: a.string(),
      address: a.string(),
      joinDate: a.date(),
      avatar: a.url(),
    })
    .authorization((allow) => [
      allow.authenticated('identityPool').to(['read', 'create', 'update', 'delete']),
      allow.unauthenticated('identityPool').to(['read']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'iam',
  },
});
