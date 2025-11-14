import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";
import { AccountType, CreatorProfile } from "@shared/api";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string, name?: string, accountType?: AccountType) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: (accountType?: AccountType) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  creatorProfile: CreatorProfile | null;
  creatorLoading: boolean;
  refreshCreatorProfile: (email?: string) => Promise<CreatorProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [creatorLoading, setCreatorLoading] = useState(false);
  const [hasTriedFetchingCreator, setHasTriedFetchingCreator] = useState(false);

  const syncUserRecord = useCallback(
    async ({
      email,
      name,
      firebaseUid,
      emailVerified,
      accountType,
    }: {
      email: string;
      name?: string | null;
      firebaseUid?: string;
      emailVerified?: boolean;
      accountType?: AccountType;
    }) => {
      if (!email) return;
      try {
        await apiFetch("/api/users/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            name: name || email,
            firebaseUid,
            emailVerified: emailVerified ?? false,
            ...(accountType ? { accountType } : {}),
          }),
        });
      } catch (error) {
        console.error("Failed to sync platform user:", error);
      }
    },
    []
  );

  const signup = async (email: string, password: string, name?: string, accountType: AccountType = "user") => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (name && userCredential.user) {
      await updateProfile(userCredential.user, { displayName: name });
    }
    await syncUserRecord({
      email,
      name,
      firebaseUid: userCredential.user.uid,
      emailVerified: userCredential.user.emailVerified,
      accountType,
    });
    await sendEmailVerification(userCredential.user);
    await signOut(auth);
  };

  const login = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    if (!credential.user.emailVerified) {
      await sendEmailVerification(credential.user);
      await signOut(auth);
      throw new Error("Please verify your email before signing in. We just sent another verification link.");
    }
    await syncUserRecord({
      email: credential.user.email || email,
      name: credential.user.displayName || credential.user.email || email,
      firebaseUid: credential.user.uid,
      emailVerified: true,
    });
  };

  const logout = async () => {
    await signOut(auth);
    setCreatorProfile(null);
    setHasTriedFetchingCreator(false);
  };

  const loginWithGoogle = async (accountType?: AccountType) => {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    await syncUserRecord({
      email: credential.user.email || "",
      name: credential.user.displayName || credential.user.email || "",
      firebaseUid: credential.user.uid,
      emailVerified: credential.user.emailVerified,
      accountType,
    });
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const refreshCreatorProfile = useCallback(
    async (email?: string) => {
      const targetEmail = email || currentUser?.email;
      if (!targetEmail) {
        setCreatorProfile(null);
        return null;
      }

      try {
        setCreatorLoading(true);
        const response = await apiFetch(`/api/creators/status?email=${encodeURIComponent(targetEmail)}`);
        if (!response.ok) {
          throw new Error("Failed to fetch creator profile");
        }
        const profile = await response.json();
        setCreatorProfile(profile);
        setHasTriedFetchingCreator(true);
        return profile;
      } catch (error) {
        console.error("Creator profile fetch error:", error);
        setHasTriedFetchingCreator(true);
        setCreatorProfile(null);
        return null;
      } finally {
        setCreatorLoading(false);
      }
    },
    [currentUser?.email]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      if (!user) {
        setCreatorProfile(null);
        setHasTriedFetchingCreator(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (currentUser?.email && !hasTriedFetchingCreator) {
      refreshCreatorProfile(currentUser.email);
    }
  }, [currentUser?.email, hasTriedFetchingCreator, refreshCreatorProfile]);

  const value: AuthContextType = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    loginWithGoogle,
    resetPassword,
    creatorProfile,
    creatorLoading,
    refreshCreatorProfile,
  };

  // Always render children, even during loading
  // This prevents white screen issues
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

