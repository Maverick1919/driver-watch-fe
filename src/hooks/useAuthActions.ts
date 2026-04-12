import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { LoginFormValues } from '@/components/auth/LoginForm';
import { RegisterFormValues } from '@/components/auth/RegisterForm';
import { login, logout } from '@/api/driverRegistry';
import { clearAuthToken, setAuthToken } from '@/lib/auth';

export const useAuthActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (values: LoginFormValues) => {
    setIsLoading(true);

    try {
      const response = await login({
        identifier: values.email,
        password: values.password,
      });

      if (response.data?.token) {
        setAuthToken(response.data.token);
        toast({
          title: "Login Successful",
          description: "Logged in successfully.",
        });
        navigate('/moderator-dashboard', { replace: true });
        return;
      }

      toast({
        title: "Login Failed",
        description: "The server did not return an authentication token.",
        variant: "destructive",
      });
    } catch (error: any) {
      console.error("Azure login failed:", error);
      toast({
        title: "Login Failed",
        description:
          error?.response?.data?.message ||
          error?.response?.data?.title ||
          error?.message ||
          "Invalid credentials or server unreachable.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (_values: RegisterFormValues) => {
    toast({
      title: "Registration Unavailable",
      description: "Self-service registration is not configured for the current backend yet.",
      variant: "destructive",
    });
  };

  const handleGoogleLogin = async () => {
    toast({
      title: "Google Login Unavailable",
      description: "Google sign-in is not configured for the current backend yet.",
      variant: "destructive",
    });
  };

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      await logout();
    } catch (error: any) {
      console.error("Logout request failed:", error);
    } finally {
      clearAuthToken();
      setIsLoading(false);
    }

    toast({
      title: "Logout Successful",
      description: "You have been logged out.",
    });
    navigate('/auth');
  };

  return {
    isLoading,
    handleLogin,
    handleRegister,
    handleGoogleLogin,
    handleLogout,
  };
};
