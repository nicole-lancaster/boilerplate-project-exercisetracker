export interface UserDetails {
  email: string;
  password: string;
  _id?: string;
}

export interface UserWithToken extends UserDetails {
  user: UserDetails;
  token: string;
}

export interface User {
  _id: string;
  email: string;
  password: string;
  token?: string;
  description?: string | undefined;
  duration?: number | undefined;
  date?: string | undefined;
}
