import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OAuthTest() {
  const testGoogleOAuth = () => {
    // Direct navigation to Google OAuth
    window.location.href = "/auth/google";
  };

  const testGoogleOAuthNewTab = () => {
    // Open in new tab
    window.open("/auth/google", "_blank");
  };

  const testGoogleOAuthPopup = () => {
    // Open in popup
    const popup = window.open("/auth/google", "googleAuth", "width=500,height=600");
    
    // Check if popup was blocked
    if (!popup || popup.closed) {
      alert("Popup was blocked. Please allow popups for this site.");
      return;
    }
    
    // Monitor popup for completion
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        // Refresh the page to check if logged in
        window.location.reload();
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Google OAuth Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testGoogleOAuth}
            className="w-full"
            variant="default"
          >
            Test Direct Navigation
          </Button>
          
          <Button 
            onClick={testGoogleOAuthNewTab}
            className="w-full"
            variant="secondary"
          >
            Test New Tab
          </Button>
          
          <Button 
            onClick={testGoogleOAuthPopup}
            className="w-full"
            variant="outline"
          >
            Test Popup Window
          </Button>
          
          <div className="text-sm text-gray-600">
            <p><strong>Debug Info:</strong></p>
            <p>Current URL: {window.location.href}</p>
            <p>In iframe: {window.self !== window.top ? 'Yes' : 'No'}</p>
            <p>User agent: {navigator.userAgent.slice(0, 50)}...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}