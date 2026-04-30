/**
 * Global Application Constants
 * This file prevents hardcoded strings and magic numbers across the app.
 */

export const APP_CONFIG = {
  CLIENT_NAME: 'VinhPhatERP-Web',
  API_VERSION_HEADER: '2',
} as const;

export const HTTP_HEADERS = {
  CONTENT_TYPE_JSON: 'application/json',
  ACCEPT_PROFILE: 'Accept-Profile',
  ACCEPT_VERSION: 'Accept-Version',
  X_APP_CLIENT: 'X-App-Client',
  X_APP_VERSION: 'x-app-version',
} as const;
