/** Full player (signed-in users). */
export const PLAYER_PATH = '/app';

/** After sign-up or sign-in, always land on the player. */
export const AUTH_REDIRECT_PROPS = {
  forceRedirectUrl: PLAYER_PATH,
  signUpForceRedirectUrl: PLAYER_PATH,
  signInForceRedirectUrl: PLAYER_PATH,
} as const;
