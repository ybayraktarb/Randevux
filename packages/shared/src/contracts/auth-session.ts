export interface AuthSessionAdapter<Session = unknown, User = unknown> {
  getSession(): Promise<Session | null>
  getUser(): Promise<User | null>
  signOut(): Promise<void>
}
