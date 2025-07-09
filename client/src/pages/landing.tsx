import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Star, Briefcase, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("influencer");
  const { toast } = useToast();

  const handleGoogleAuth = () => {
    setIsLoading(true);
    window.location.href = "/api/login";
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Email Authentication",
      description: "Please use Google authentication for now.",
      variant: "default",
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="p-6">
          <CardContent className="flex items-center space-x-3 pt-6">
            <Loader2 className="animate-spin h-6 w-6 text-primary" />
            <span className="text-gray-700">Authenticating...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-primary w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg">
              <Users className="text-white h-8 w-8" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome to JOMA Media
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Connect with brands and manage your influencer career
          </p>
        </div>

        {/* Authentication Card */}
        <Card className="shadow-xl rounded-2xl">
          <CardContent className="p-8">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Sign In Form */}
              <TabsContent value="signin" className="space-y-6">
                <Button
                  onClick={handleGoogleAuth}
                  variant="outline"
                  className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-600">Or continue with email</span>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={handleEmailAuth}>
                  <div>
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="mt-1"
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="mt-1"
                      placeholder="Enter your password"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" />
                      <Label htmlFor="remember" className="text-sm">
                        Remember me
                      </Label>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-medium text-primary hover:text-blue-500 transition-colors duration-200"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button type="submit" className="w-full">
                    Sign in
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Form */}
              <TabsContent value="signup" className="space-y-6">
                <Button
                  onClick={handleGoogleAuth}
                  variant="outline"
                  className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-600">Or create account with email</span>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">I am a</Label>
                  <RadioGroup value={selectedRole} onValueChange={setSelectedRole} className="grid grid-cols-2 gap-3 mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="influencer" id="influencer" />
                      <Label htmlFor="influencer" className="flex items-center space-x-2 cursor-pointer">
                        <Star className="h-4 w-4 text-primary" />
                        <span>Influencer</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="admin" id="admin" />
                      <Label htmlFor="admin" className="flex items-center space-x-2 cursor-pointer">
                        <Briefcase className="h-4 w-4 text-gray-600" />
                        <span>Admin</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <form className="space-y-4" onSubmit={handleEmailAuth}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first-name">First name</Label>
                      <Input
                        id="first-name"
                        name="first-name"
                        type="text"
                        required
                        className="mt-1"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last-name">Last name</Label>
                      <Input
                        id="last-name"
                        name="last-name"
                        type="text"
                        required
                        className="mt-1"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="signup-email">Email address</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      className="mt-1"
                      placeholder="Enter your email"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      className="mt-1"
                      placeholder="Create a password"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" required />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the{" "}
                      <button type="button" className="text-primary hover:text-blue-500">
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button type="button" className="text-primary hover:text-blue-500">
                        Privacy Policy
                      </button>
                    </Label>
                  </div>

                  <Button type="submit" className="w-full">
                    Create account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="text-center pt-4">
              <p className="text-xs text-gray-600">
                © 2024 JOMA Media. All rights reserved.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
