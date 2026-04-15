import { useState, useCallback } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { authService } from '@/api/services/auth.service';
import { userService } from '@/api/services/user.service';
import { useAuthStore } from '@/store/authStore';

interface UseAppleAuthReturn {
  signIn: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  isAvailable: boolean;
}

export function useAppleAuth(): UseAppleAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth } = useAuthStore();

  // Apple Sign-In is only available on iOS 13+
  const isAvailable = Platform.OS === 'ios';

  const signIn = useCallback(async () => {
    if (!isAvailable) {
      setError('Apple Sign-In is only available on iOS devices.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request Apple credentials
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const identityToken = credential.identityToken;
      if (!identityToken) {
        throw new Error('No identity token returned from Apple.');
      }

      // Exchange Apple identity token with backend → POST /auth/apple
      const authResponse = await authService.loginWithApple({
        token: identityToken,
      });

      // Fetch the user profile after login
      // We set tokens first so the auth interceptor can attach them
      await setAuth(
        // Temporarily use a minimal user object — overwritten after getMe()
        { id: '', email: credential.email ?? null, appleSub: credential.user },
        authResponse.accessToken,
        authResponse.refreshToken,
      );

      // Fetch real user profile now that we have a valid token
      const user = await userService.getMe();
      useAuthStore.getState().setUser(user);
    } catch (err) {
      const appleError = err as { code?: string; message?: string };

      if (appleError.code === 'ERR_REQUEST_CANCELED') {
        // User dismissed the Apple dialog — not an error
        setError(null);
      } else {
        setError(appleError.message ?? 'Apple Sign-In failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, setAuth]);

  return { signIn, isLoading, error, isAvailable };
}
