'use client';

import React, { useMemo, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FirebaseProvider, useAuth, useFirestore, useUser } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { handleGoogleRedirectResult } from '@/lib/auth/auth-service';
import { useToast } from '@/hooks/use-toast';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

function GlobalAuthHandler() {
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // Process Google OAuth redirect result on initial load across any route
  useEffect(() => {
    if (!auth || !db) return;
    handleGoogleRedirectResult(auth, db)
      .then((res) => {
        if (res?.user) {
          toast({
            title: "Signed In with Google",
            description: "Welcome to Recovery Engine.",
          });
          if (pathname === '/' || pathname === '/login') {
            router.replace('/dashboard');
          }
        }
      })
      .catch((err) => {
        console.error('Google redirect result error:', err);
      });
  }, [auth, db]); // eslint-disable-line react-hooks/exhaustive-deps

  // Automatically forward authenticated users away from the login page
  useEffect(() => {
    if (!isUserLoading && user && pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, pathname, router]);

  return null;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      <GlobalAuthHandler />
      {children}
    </FirebaseProvider>
  );
}