import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
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
 * Sign in or sign up with Google OAuth
 */
export async function loginWithGoogle(
  auth: Auth,
  db: Firestore,
  rolePreference: UserRole = 'student'
): Promise<{ user: User; profile: UserProfile }> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const profile = await syncUserProfile(db, credential.user, rolePreference);
  return { user: credential.user, profile };
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
