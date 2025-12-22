const API_BASE_URL = '/api';

export interface SignUpData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignInData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: {
    email: string;
    id: string;
    role?: string;
    isNewsletterSubscribed?: boolean;
  };
  errors?: { [key: string]: string[] };
}

export interface AuthStatus {
  isAuthenticated: boolean;
  user?: {
    email: string;
    id: string;
    role?: string;
    isNewsletterSubscribed?: boolean;
  };
}

class AuthService {
  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/authapi/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('SignUp error:', error);
      return {
        success: false,
        message: 'Network error occurred during sign up'
      };
    }
  }

  async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/authapi/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('SignIn error:', error);
      return {
        success: false,
        message: 'Network error occurred during sign in'
      };
    }
  }

  async signOut(): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/authapi/signout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('SignOut error:', error);
      return {
        success: false,
        message: 'Network error occurred during sign out'
      };
    }
  }

  async getAuthStatus(): Promise<AuthStatus> {
    try {
      const response = await fetch(`${API_BASE_URL}/authapi/status`, {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
      });

      if (!response.ok) {
        return { isAuthenticated: false };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Auth status error:', error);
      return { isAuthenticated: false };
    }
  }
}

export const authService = new AuthService();