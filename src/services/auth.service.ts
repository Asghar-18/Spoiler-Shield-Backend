import { supabaseClient } from '../lib/supabase';
import type { ApiResponse } from '../types/database.type';

export const authService = {
  // Sign up new user
  signUp: async (email: string, password: string, name?: string): Promise<ApiResponse> => {
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            full_name: name,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session
        },
        message: 'User created successfully'
      };
    } catch (error) {
      console.error('SignUp service error:', error);
      return { success: false, error: 'Failed to create user' };
    }
  },

  // Sign in user
  signIn: async (email: string, password: string): Promise<ApiResponse> => {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session
        },
        message: 'Signed in successfully'
      };
    } catch (error) {
      console.error('SignIn service error:', error);
      return { success: false, error: 'Failed to sign in' };
    }
  },

  // Sign out user
  signOut: async (accessToken: string): Promise<ApiResponse> => {
    try {
      // Set the session for this operation
      await supabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: '' // We only need access token for signOut
      });

      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Signed out successfully' };
    } catch (error) {
      console.error('SignOut service error:', error);
      return { success: false, error: 'Failed to sign out' };
    }
  },

  // Get current user (using token)
  getCurrentUser: async (accessToken: string): Promise<ApiResponse> => {
    try {
      const { data: { user }, error } = await supabaseClient.auth.getUser(accessToken);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: { user } };
    } catch (error) {
      console.error('GetCurrentUser service error:', error);
      return { success: false, error: 'Failed to get user' };
    }
  },

  // Reset password
  resetPassword: async (email: string): Promise<ApiResponse> => {
    try {
      const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data,
        message: 'Password reset email sent'
      };
    } catch (error) {
      console.error('ResetPassword service error:', error);
      return { success: false, error: 'Failed to send reset email' };
    }
  },

  // Update user profile
  updateProfile: async (accessToken: string, updates: { name?: string; email?: string }): Promise<ApiResponse> => {
    try {
      // Set the session for this operation
      await supabaseClient.auth.setSession({
        access_token: accessToken,
        refresh_token: ''
      });

      const { data, error } = await supabaseClient.auth.updateUser({
        email: updates.email,
        data: {
          name: updates.name,
          full_name: updates.name,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: { user: data.user },
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('UpdateProfile service error:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  },

  // Refresh session
  refreshSession: async (refreshToken: string): Promise<ApiResponse> => {
    try {
      const { data, error } = await supabaseClient.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session
        },
        message: 'Session refreshed successfully'
      };
    } catch (error) {
      console.error('RefreshSession service error:', error);
      return { success: false, error: 'Failed to refresh session' };
    }
  },

  // Verify user email
  verifyEmail: async (token: string, email: string): Promise<ApiResponse> => {
    try {
      const { data, error } = await supabaseClient.auth.verifyOtp({
        token_hash: token,
        type: 'email',
        email: email
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          user: data.user,
          session: data.session
        },
        message: 'Email verified successfully'
      };
    } catch (error) {
      console.error('VerifyEmail service error:', error);
      return { success: false, error: 'Failed to verify email' };
    }
  }
};