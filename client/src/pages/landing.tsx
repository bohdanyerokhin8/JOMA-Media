import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Star,
  Briefcase,
  Loader2,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Extend window interface for Google auth timeout
declare global {
  interface Window {
    googleAuthTimeout?: NodeJS.Timeout | null;
  }
}

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const [showCheckboxError, setShowCheckboxError] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [verificationMessage, setVerificationMessage] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [showResendSection, setShowResendSection] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

  const { toast } = useToast();

  // Check URL parameters for verification status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verification = urlParams.get('verification');
    const message = urlParams.get('message');
    
    if (verification === 'error' && message) {
      setVerificationMessage({
        type: 'error',
        message: decodeURIComponent(message)
      });
      setShowResendSection(true);
    }
    
    // Clean up URL parameters
    if (verification) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Custom validation component
  const ValidationError = ({
    message,
    position = "right",
  }: {
    message: string;
    position?: "right" | "top";
  }) => (
    <div
      className={`absolute ${position === "right" ? "top-0 left-[30px]" : "bottom-full left-0 mb-2"} bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm shadow-lg z-10 whitespace-nowrap`}
    >
      <div className="flex items-center space-x-2">
        <span className="text-red-500">⚠️</span>
        <span>{message}</span>
      </div>
      <div
        className={`absolute ${position === "right" ? "-bottom-1 left-4" : "top-full left-4"} w-2 h-2 bg-red-50 border-b border-r border-red-200 transform rotate-45`}
      ></div>
    </div>
  );

  const validateField = (name: string, value: string) => {
    const errors: { [key: string]: string } = {};

    switch (name) {
      case "email":
        if (!value) {
          errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = "Please enter a valid email address";
        }
        break;
      case "password":
        if (!value) {
          errors.password = "Password is required";
        } else if (value.length < 8) {
          errors.password = "Password must be at least 8 characters";
        }
        break;
      case "firstName":
        if (!value) {
          errors.firstName = "First name is required";
        }
        break;
      case "lastName":
        if (!value) {
          errors.lastName = "Last name is required";
        }
        break;
    }

    setValidationErrors((prev) => ({ ...prev, [name]: errors[name] || "" }));
    return !errors[name];
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  // Clear loading state when user returns to the page (e.g., after navigating back from Google OAuth)
  useEffect(() => {
    const handleFocus = () => {
      // Clear loading state when user returns to the page
      setIsLoading(false);

      // Clear any pending Google auth timeout
      if (window.googleAuthTimeout) {
        clearTimeout(window.googleAuthTimeout);
        window.googleAuthTimeout = null;
      }
    };

    const handleVisibilityChange = () => {
      // Clear loading state when page becomes visible again
      if (document.visibilityState === "visible") {
        setIsLoading(false);

        // Clear any pending Google auth timeout
        if (window.googleAuthTimeout) {
          clearTimeout(window.googleAuthTimeout);
          window.googleAuthTimeout = null;
        }
      }
    };

    // Add event listeners for page focus and visibility changes
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Clear any pending Google auth timeout
      if (window.googleAuthTimeout) {
        clearTimeout(window.googleAuthTimeout);
        window.googleAuthTimeout = null;
      }
    };
  }, []);

  const handleGoogleAuth = () => {
    setIsLoading(true);

    // Set a timeout to clear loading state if user doesn't complete OAuth flow
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "⏰ Authentication timeout",
        description: "Please try signing in again.",
        variant: "destructive",
        duration: 4000,
      });
    }, 30000); // 30 seconds timeout

    // Store timeout ID so we can clear it if user returns
    window.googleAuthTimeout = loadingTimeout;

    // Try to open in new tab first to bypass iframe restrictions
    try {
      // Check if we're in an iframe
      const isInIframe = window.self !== window.top;

      if (isInIframe) {
        // Open in new tab to bypass iframe restrictions
        window.open("/auth/google", "_blank");
      } else {
        // Direct navigation
        window.location.href = "/auth/google";
      }
    } catch (error) {
      // Fallback to direct navigation
      window.location.href = "/auth/google";
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Custom validation
    const isEmailValid = validateField("email", email);
    const isPasswordValid = validateField("password", password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/auth/login", {
        email,
        password,
      });

      window.location.href = "/";
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again.";

      // Error notifications with red styling for visibility
      if (errorMessage.includes("No account found")) {
        toast({
          title: "❌ Account not found",
          description: "Please check your email or create a new account.",
          variant: "destructive",
          duration: 6000,
        });
      } else if (errorMessage.includes("Google sign-in")) {
        toast({
          title: "⚠️ Use Google sign-in",
          description:
            "This account was created with Google. Please use the Google sign-in button.",
          variant: "destructive",
          duration: 6000,
        });
      } else if (errorMessage.includes("Incorrect password")) {
        toast({
          title: "❌ Incorrect password",
          description: "Please check your password and try again.",
          variant: "destructive",
          duration: 6000,
        });
      } else if (errorMessage.includes("verify your email")) {
        toast({
          title: "📧 Email verification required",
          description: "Please check your email and click the verification link before signing in.",
          variant: "destructive",
          duration: 8000,
        });
        setShowResendSection(true);
        setResendEmail(email);
      } else {
        toast({
          title: "❌ Sign in failed",
          description:
            "Please try again or contact support if the problem persists.",
          variant: "destructive",
          duration: 6000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const termsCheckbox = form.querySelector("#terms") as HTMLInputElement;

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;

    // Custom validation
    const isEmailValid = validateField("email", email);
    const isPasswordValid = validateField("password", password);
    const isFirstNameValid = validateField("firstName", firstName);
    const isLastNameValid = validateField("lastName", lastName);

    // Custom validation for checkbox (Radix UI checkbox uses data-state attribute)
    if (!termsCheckbox || termsCheckbox.getAttribute('data-state') !== 'checked') {
      setShowCheckboxError(true);
      setTimeout(() => setShowCheckboxError(false), 4000);
      return;
    }

    if (
      !isEmailValid ||
      !isPasswordValid ||
      !isFirstNameValid ||
      !isLastNameValid
    ) {
      return;
    }

    setShowCheckboxError(false);
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/auth/register", {
        email,
        password,
        firstName,
        lastName,
      });

      toast({
        title: "✅ Account created successfully",
        description: "Please check your email to verify your account before signing in.",
        variant: "default",
      });
      
      // Show success message for verification
      setVerificationMessage({
        type: 'success',
        message: 'Account created successfully! Please check your email to verify your account before signing in.'
      });
      
      // Switch to login tab
      document.querySelector('[data-value="signin"]')?.click();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create account";

      // Error notifications with red styling for visibility
      if (
        errorMessage.includes("already exists") &&
        errorMessage.includes("Google sign-in")
      ) {
        toast({
          title: "⚠️ Account exists with Google",
          description:
            "Please use the Google sign-in button to access your account.",
          variant: "destructive",
          duration: 6000,
        });
      } else if (errorMessage.includes("already exists")) {
        toast({
          title: "⚠️ Account already exists",
          description:
            "Please sign in instead or use a different email address.",
          variant: "destructive",
          duration: 6000,
        });
      } else {
        toast({
          title: "❌ Registration failed",
          description:
            "Please try again or contact support if the problem persists.",
          variant: "destructive",
          duration: 6000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!resendEmail) return;

    setIsLoading(true);
    try {
      await apiRequest("POST", "/auth/resend-verification", {
        email: resendEmail,
      });
      
      toast({
        title: "✅ Verification email sent",
        description: "Please check your email for the verification link.",
        variant: "default",
      });
      
      setShowResendSection(false);
      setResendEmail('');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send verification email. Please try again.";
      
      toast({
        title: "❌ Failed to send verification email",
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Loading overlay component
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="p-8 shadow-lg">
        <CardContent className="flex flex-col items-center space-y-4 pt-6">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
          <span className="text-gray-700 font-medium">Processing...</span>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {isLoading && <LoadingOverlay />}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="text-white h-8 w-8" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              JOMA Media
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Influencer Management Platform
            </p>
            <p className="text-sm text-gray-500">
              Connect with brands and manage your influencer career
            </p>
          </div>

          {/* Verification Messages */}
          {verificationMessage.type && (
            <Alert className={`${verificationMessage.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-center">
                {verificationMessage.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                )}
                <AlertDescription className={`${verificationMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                  {verificationMessage.message}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Resend Verification Section */}
          {showResendSection && (
            <Alert className="border-blue-200 bg-blue-50">
              <Mail className="h-4 w-4 text-blue-600 mr-2" />
              <AlertDescription className="text-blue-800">
                <div className="flex items-center justify-between">
                  <span>Need to resend the verification email?</span>
                  <Button
                    onClick={handleResendVerification}
                    variant="outline"
                    size="sm"
                    className="ml-2 text-blue-600 border-blue-600 hover:bg-blue-100"
                  >
                    Resend Email
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Authentication Card */}
          <Card className="shadow-2xl rounded-2xl border-0">
            <CardContent className="p-8">
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 rounded-lg p-1">
                  <TabsTrigger value="signin" className="rounded-md">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-md">
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                {/* Sign In Form */}
                <TabsContent value="signin" className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      Welcome Back
                    </h2>
                    <p className="text-gray-600">
                      Access your JOMA Media dashboard
                    </p>
                  </div>

                  <Button
                    onClick={handleGoogleAuth}
                    className="w-full flex items-center justify-center py-3 px-4 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all duration-200"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">
                        Or continue with email
                      </span>
                    </div>
                  </div>

                  <form
                    className="space-y-4"
                    onSubmit={handleEmailAuth}
                    noValidate
                  >
                    <div className="relative">
                      <Label
                        htmlFor="email"
                        className="text-sm font-medium text-gray-700"
                      >
                        Email address
                      </Label>
                      <div className="mt-1 relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          className="pl-10 py-3 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter your email"
                          onChange={handleFieldChange}
                          onBlur={handleFieldChange}
                        />
                      </div>
                      {validationErrors.email && (
                        <ValidationError
                          message={validationErrors.email}
                          position="right"
                        />
                      )}
                    </div>

                    <div className="relative">
                      <Label
                        htmlFor="password"
                        className="text-sm font-medium text-gray-700"
                      >
                        Password
                      </Label>
                      <div className="mt-1 relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          className="pl-10 py-3 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter your password"
                          onChange={handleFieldChange}
                          onBlur={handleFieldChange}
                        />
                      </div>
                      {validationErrors.password && (
                        <ValidationError
                          message={validationErrors.password}
                          position="right"
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 mt-1">
                        <Checkbox id="remember" />
                        <Label
                          htmlFor="remember"
                          className="text-sm text-gray-600"
                        >
                          Remember me
                        </Label>
                      </div>
                      <button
                        type="button"
                        className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <Button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
                      style={{ marginTop: "20px" }}
                    >
                      Sign in
                    </Button>
                  </form>
                </TabsContent>

                {/* Sign Up Form */}
                <TabsContent value="signup" className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      Join JOMA Media
                    </h2>
                    <p className="text-gray-600">
                      Create your account to get started
                    </p>
                  </div>

                  <Button
                    onClick={handleGoogleAuth}
                    className="w-full flex items-center justify-center py-3 px-4 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg transition-all duration-200"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Create Account with Google
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">
                        Or create account with email
                      </span>
                    </div>
                  </div>

                  <form
                    className="space-y-4"
                    onSubmit={handleRegistration}
                    noValidate
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <Label
                          htmlFor="firstName"
                          className="text-sm font-medium text-gray-700"
                        >
                          First name
                        </Label>
                        <div className="mt-1 relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            id="firstName"
                            name="firstName"
                            type="text"
                            className="pl-10 py-3 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                            placeholder="John"
                            onChange={handleFieldChange}
                            onBlur={handleFieldChange}
                          />
                        </div>
                        {validationErrors.firstName && (
                          <ValidationError
                            message={validationErrors.firstName}
                            position="right"
                          />
                        )}
                      </div>
                      <div className="relative">
                        <Label
                          htmlFor="lastName"
                          className="text-sm font-medium text-gray-700"
                        >
                          Last name
                        </Label>
                        <div className="mt-1 relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            id="lastName"
                            name="lastName"
                            type="text"
                            className="pl-10 py-3 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Doe"
                            onChange={handleFieldChange}
                            onBlur={handleFieldChange}
                          />
                        </div>
                        {validationErrors.lastName && (
                          <ValidationError
                            message={validationErrors.lastName}
                            position="right"
                          />
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <Label
                        htmlFor="signup-email"
                        className="text-sm font-medium text-gray-700"
                      >
                        Email address
                      </Label>
                      <div className="mt-1 relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          className="pl-10 py-3 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Enter your email"
                          onChange={handleFieldChange}
                          onBlur={handleFieldChange}
                        />
                      </div>
                      {validationErrors.email && (
                        <ValidationError
                          message={validationErrors.email}
                          position="right"
                        />
                      )}
                    </div>

                    <div className="relative">
                      <Label
                        htmlFor="signup-password"
                        className="text-sm font-medium text-gray-700"
                      >
                        Password
                      </Label>
                      <div className="mt-1 relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          id="signup-password"
                          name="password"
                          type="password"
                          className="pl-10 py-3 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Create a password (min 8 characters)"
                          onChange={handleFieldChange}
                          onBlur={handleFieldChange}
                        />
                      </div>
                      {validationErrors.password && (
                        <ValidationError
                          message={validationErrors.password}
                          position="right"
                        />
                      )}
                    </div>

                    <div className="relative" style={{ marginTop: "25px" }}>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="terms" />
                        <Label
                          htmlFor="terms"
                          className="text-sm text-gray-600"
                        >
                          I agree to the{" "}
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-500 underline"
                          >
                            Terms of Service
                          </button>{" "}
                          and{" "}
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-500 underline"
                          >
                            Privacy Policy
                          </button>
                        </Label>
                      </div>
                      {showCheckboxError && (
                        <div
                          className="absolute -top-12 left-0 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm shadow-lg z-10"
                          style={{ marginLeft: "-14px" }}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-red-500">⚠️</span>
                            <span>
                              Please check this box if you want to proceed
                            </span>
                          </div>
                          <div className="absolute bottom-0 left-4 w-2 h-2 bg-red-50 border-b border-r border-red-200 transform rotate-45 translate-y-1"></div>
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
                      style={{ marginTop: "25px" }}
                    >
                      Create account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="text-center pt-6 mt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  © 2024 JOMA Media. All rights reserved.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
