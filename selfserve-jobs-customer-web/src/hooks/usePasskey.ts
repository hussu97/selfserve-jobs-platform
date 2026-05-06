'use client';

import { useEffect, useState } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { passkeyAuthBegin, passkeyAuthComplete, passkeyRegisterBegin, passkeyRegisterComplete } from '@/lib/api';
import type { PasskeyAuthCompleteResponse } from '@/lib/types';

export function usePasskeySupport() {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    import('@simplewebauthn/browser').then(({ platformAuthenticatorIsAvailable }) => {
      platformAuthenticatorIsAvailable().then(setSupported);
    });
  }, []);

  return supported;
}

export async function registerPasskey(sessionToken: string, label?: string): Promise<void> {
  const beginRes = await passkeyRegisterBegin(sessionToken);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const credential = await startRegistration({ optionsJSON: beginRes.options as any });
  await passkeyRegisterComplete(sessionToken, beginRes.session_key, credential, label);
}

export async function authenticatePasskey(
  email: string,
  adminOnly = false
): Promise<PasskeyAuthCompleteResponse> {
  const beginRes = await passkeyAuthBegin(email, adminOnly);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const credential = await startAuthentication({ optionsJSON: beginRes.options as any });
  return passkeyAuthComplete(beginRes.session_key, credential, adminOnly);
}
