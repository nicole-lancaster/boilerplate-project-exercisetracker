export interface User {
  _id: string;
  email: string;
  password: string;
  token?: string;
  description?: string | undefined;
  duration?: number | undefined;
  date?: string | undefined;
}
