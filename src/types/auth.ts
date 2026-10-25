export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  dob?: string;
  pushNotifications: boolean;
  createdAt: string;
  bio?: string;
  unlockedPrompts?: string[];
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
}
