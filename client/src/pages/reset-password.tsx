import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    // Extract token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    
    if (!tokenParam) {
      toast({
        title: "❌ Invalid Link",
        description: "This password reset link is invalid or expired.",
        variant: "destructive",
      });
      setLocation("/");
      return;
    }
    
    setToken(tokenParam);
  }, [setLocation, toast]);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await apiRequest("POST", "/auth/reset-password", {
        token,
        password,
      });
      
      setIsSuccess(true);
      
      toast({
        title: "✅ Password Reset Successful",
        description: "Your password has been updated successfully.",
        variant: "default",
      });
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reset password";
      
      toast({
        title: "❌ Password Reset Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Password Reset Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Your password has been successfully updated. You are now logged in.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Reset Your Password
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Enter your new password below
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 py-3 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter new password (min 8 characters)"
                  required
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 py-3 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Confirm new password"
                  required
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? "Updating Password..." : "Reset Password"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setLocation("/")}
              className="text-sm text-blue-600 hover:text-blue-500 underline"
            >
              Back to Sign In
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}