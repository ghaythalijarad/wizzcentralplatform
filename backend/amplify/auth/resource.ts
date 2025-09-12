import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
    loginWith: {
        email: true,
    },
    userAttributes: {
        email: {
            required: true,
            mutable: false,
        },
    },
    // Optional: Configure password requirements
    passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSymbols: false,
    },
    // Optional: Configure sign-up/sign-in options
    signUpConfig: {
        // Require email verification
        emailEnabled: true,
        autoSignIn: true,
    },
});
