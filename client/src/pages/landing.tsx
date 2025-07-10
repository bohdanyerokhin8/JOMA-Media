import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Loader2, Shield } from "lucide-react";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = () => {
    setIsLoading(true);
    // Cloudflare Access will handle the Google authentication
    window.location.href = "/";
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
        <Card className="p-8 shadow-lg">
          <CardContent className="flex flex-col items-center space-y-4 pt-6">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
            <span className="text-gray-700 font-medium">Redirecting to secure authentication...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
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

        {/* Authentication Card */}
        <Card className="shadow-2xl rounded-2xl border-0">
          <CardContent className="p-8">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 rounded-lg p-1">
                <TabsTrigger value="signin" className="rounded-md">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-md">Sign Up</TabsTrigger>
              </TabsList>

              {/* Sign In Form */}
              <TabsContent value="signin" className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome Back</h2>
                  <p className="text-gray-600">Access your JOMA Media dashboard</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900">Secure Authentication</h3>
                  </div>
                  <p className="text-sm text-blue-800">
                    This application is protected by Cloudflare Access with Google authentication. 
                    Click below to securely sign in with your Google account.
                  </p>
                </div>

                <Button
                  onClick={handleGoogleAuth}
                  className="w-full flex items-center justify-center py-3 px-4 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-500 mt-4">
                    All authentication is handled securely through Cloudflare Access
                  </p>
                </div>
              </TabsContent>

              {/* Sign Up Form */}
              <TabsContent value="signup" className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Join JOMA Media</h2>
                  <p className="text-gray-600">Create your influencer or admin account</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium text-green-900">Secure Account Creation</h3>
                  </div>
                  <p className="text-sm text-green-800">
                    New users are automatically registered when they first sign in with Google. 
                    Your account will be created with your Google profile information.
                  </p>
                </div>

                <Button
                  onClick={handleGoogleAuth}
                  className="w-full flex items-center justify-center py-3 px-4 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Create Account with Google
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-500 mt-4">
                    Your account will be created automatically using your Google profile information
                  </p>
                </div>
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
  );
}
