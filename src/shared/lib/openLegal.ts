import { Linking } from 'react-native';

export const TERMS_URL   = 'https://deeplyocean.com/terms';
export const PRIVACY_URL = 'https://deeplyocean.com/privacy';

export async function openTerms(): Promise<void> {
  const canOpen = await Linking.canOpenURL(TERMS_URL);
  if (canOpen) await Linking.openURL(TERMS_URL);
}

export async function openPrivacy(): Promise<void> {
  const canOpen = await Linking.canOpenURL(PRIVACY_URL);
  if (canOpen) await Linking.openURL(PRIVACY_URL);
}
