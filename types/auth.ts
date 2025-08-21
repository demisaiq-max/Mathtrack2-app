export interface User {
  id: string;
  email: string;
  fullName: string;
  accountType: 'student' | 'admin';
  gradeLevel?: string;
  profileImage?: string;
  createdAt: Date;
}

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpData {
  accountType: 'student' | 'admin';
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  gradeLevel?: string;
}