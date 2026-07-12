export const environment = {
  production: true,
  apiUrl: '/api',
  // Google OAuth Web client id. Empty by default → the "Continue with Google"
  // button is hidden so the UI never shows a broken control. Set the real id to
  // enable social login (must match the backend's app.oauth.google.client-id).
  googleClientId: '',
};
