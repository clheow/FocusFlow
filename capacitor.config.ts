import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.naylah.focusflow',
  appName: 'FocusFlow',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;