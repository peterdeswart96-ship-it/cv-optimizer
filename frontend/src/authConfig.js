export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_ENTRA_CLIENT_ID,
    authority: 'https://cvoptimizer.ciamlogin.com/5399f876-4a61-48dc-b623-5dde6806ce3c',
    knownAuthorities: ['cvoptimizer.ciamlogin.com'],
    redirectUri: window.location.origin + '/auth/callback',
    postLogoutRedirectUri: window.location.origin
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false
  }
}

export const loginRequest = {
  scopes: ['openid', 'profile', 'email', `${import.meta.env.VITE_ENTRA_CLIENT_ID}/.default`]
}
