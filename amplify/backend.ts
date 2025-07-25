import { defineBackend } from '@aws-amplify/backend';

/**
 * Backend with hosting for static website
 */
export const backend = defineBackend({
  // Static hosting will be handled by the build configuration
});
