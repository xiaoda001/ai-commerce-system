import 'express-session';

export type AuthenticatedAccount = {
  id: string;
  email: string;
  kind: 'customer' | 'admin';
};

declare module 'express-session' {
  interface SessionData {
    account?: AuthenticatedAccount;
    csrfToken?: string;
  }
}
