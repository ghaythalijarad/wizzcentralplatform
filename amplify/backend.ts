import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * Backend with hosting for static website
 */
export const backend = defineBackend({
  auth,
  data,
});
