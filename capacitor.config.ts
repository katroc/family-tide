import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.familytide.app',
  appName: 'Family Tide',
  webDir: 'dist', // Still needed for initial/production builds
  server: {
    url: 'http://10.0.2.2:5173', // Special IP for host machine from Android emulator
    cleartext: true
  }
};

export default config;
