import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { Firestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export type UserRole = 'teacher' | 'professor' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Ensures a user profile exists in Firestore.
 * If creating for the first time, sets the provided role (default 'student' if unspecified).
 */
export async function syncUserProfile(
  db: Firestore,
  user: User,
  selectedRole?: UserRole
): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  const profile: UserProfile = {
    id: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
    role: selectedRole || 'student',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, profile);
  return profile;
}

/**
 * Check for a pending Google redirect result (call on app init).
 * After signInWithRedirect, Firebase redirects back to the app
 * and getRedirectResult() retrieves the credential.
 */
export async function handleGoogleRedirectResult(
  auth: Auth,
  db: Firestore,
  rolePreference?: UserRole
): Promise<{ user: User; profile: UserProfile } | null> {
  try {
    let effectiveRole: UserRole = rolePreference || 'student';
    if (typeof window !== 'undefined') {
      try {
        const storedRole = sessionStorage.getItem('recovery_auth_pending_role');
        if (storedRole && (storedRole === 'teacher' || storedRole === 'professor' || storedRole === 'student')) {
          effectiveRole = storedRole as UserRole;
        }
        sessionStorage.removeItem('recovery_auth_pending_role');
      } catch {}
    }

    const result = await getRedirectResult(auth);
    if (result?.user) {
      try {
        const profile = await syncUserProfile(db, result.user, effectiveRole);
        return { user: result.user, profile };
      } catch (dbErr) {
        console.warn('Could not sync profile to Firestore, using fallback profile:', dbErr);
        return {
          user: result.user,
          profile: {
            id: result.user.uid,
            email: result.user.email || '',
            displayName: result.user.displayName || result.user.email?.split('@')[0] || 'User',
            role: effectiveRole,
          },
        };
      }
    }
  } catch (err) {
    console.warn('getRedirectResult error:', err);
  }
  return null;
}

/**
 * Sign in or sign up with Google OAuth.
 * Tries popup first; if it fails with auth/invalid-continue-uri or
 * auth/popup-blocked, falls back to redirect-based sign-in.
 */
export async function loginWithGoogle(
  auth: Auth,
  db: Firestore,
  rolePreference: UserRole = 'student'
): Promise<{ user: User; profile: UserProfile } | { redirected: true }> {
  const provider = new GoogleAuthProvider();

  try {
    const credential = await signInWithPopup(auth, provider);
    const profile = await syncUserProfile(db, credential.user, rolePreference);
    return { user: credential.user, profile };
  } catch (err: any) {
    // If popup fails due to domain/URI issues or being blocked, fall back to redirect
    const fallbackCodes = [
      'auth/invalid-continue-uri',
      'auth/unauthorized-domain',
      'auth/popup-blocked',
    ];

    if (fallbackCodes.includes(err.code)) {
      console.warn(
        `Google popup sign-in failed (${err.code}). Falling back to redirect flow.` +
        '\nTo fix popups permanently, add your domain (including localhost) to:' +
        '\n  1. Firebase Console → Authentication → Settings → Authorized domains' +
        '\n  2. Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 → Authorized redirect URIs'
      );
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('recovery_auth_pending_role', rolePreference);
        } catch {}
      }
      await signInWithRedirect(auth, provider);
      return { redirected: true };
    }

    // Re-throw any other error (wrong credentials, network, popup closed, etc.)
    throw err;
  }
}

/**
 * Sign in with email and password
 */
export async function loginWithEmail(
  auth: Auth,
  db: Firestore,
  email: string,
  pass: string
): Promise<{ user: User; profile: UserProfile }> {
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  const profile = await syncUserProfile(db, credential.user);
  return { user: credential.user, profile };
}

/**
 * Register with email and password and store explicit role
 */
export async function registerWithEmail(
  auth: Auth,
  db: Firestore,
  email: string,
  pass: string,
  displayName: string,
  role: UserRole
): Promise<{ user: User; profile: UserProfile }> {
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  const userRef = doc(db, 'users', credential.user.uid);

  const profile: UserProfile = {
    id: credential.user.uid,
    email,
    displayName,
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, profile);
  return { user: credential.user, profile };
}

/**
 * Sign out
 */
export async function logoutUser(auth: Auth): Promise<void> {
  await signOut(auth);
}
