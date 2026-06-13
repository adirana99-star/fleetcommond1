export const environment = {
  name: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || '',
  isProduction: process.env.EXPO_PUBLIC_ENVIRONMENT === 'production'
};
