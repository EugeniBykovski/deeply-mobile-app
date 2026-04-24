import { useState, useCallback } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { authService } from '@/api/services/auth.service';
import { userService } from '@/api/services/user.service';
import { useAuthStore } from '@/store/authStore';

interface UseAppleAuthReturn {
  signIn: () => Promise<void>;
  isLoading: boolean;
  /** null until sign-in completes; true = brand-new account; false = existing account */
  isNewUser: boolean | null;
  error: string | null;
  isAvailable: boolean;
}

export function useAppleAuth(): UseAppleAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const { setAuth } = useAuthStore();

  const isAvailable = Platform.OS === 'ios';

  const signIn = useCallback(async () => {
    if (!isAvailable) {
      setError('Apple Sign-In is only available on iOS devices.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsNewUser(null);

    try {
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
      // Backend returns isNewUser: true if this Apple sub didn't exist before.
      const authResponse = await authService.loginWithApple({
        token: identityToken,
      });

      setIsNewUser(authResponse.isNewUser);

      await setAuth(
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
        setError(null);
      } else {
        setError(appleError.message ?? 'Apple Sign-In failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable, setAuth]);

  return { signIn, isLoading, isNewUser, error, isAvailable };
}
