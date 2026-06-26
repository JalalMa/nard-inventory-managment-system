/**
 * Production environment. Paths are relative so the nginx container can proxy
 * `/api` and `/socket.io` to the backend service.
 */
export const environment = {
  production: true,
  apiUrl: '/api',
  socketUrl: '',
};
