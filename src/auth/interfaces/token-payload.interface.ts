export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  exp?: number;
}