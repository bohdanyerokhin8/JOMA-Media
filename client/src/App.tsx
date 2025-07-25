import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import OAuthTest from "@/pages/oauth-test";
import Dashboard from "@/pages/dashboard";
import ProfileSettings from "@/pages/profile-settings";
import PaymentRequests from "@/pages/payment-requests";
import JobTracking from "@/pages/job-tracking";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminInvites from "@/pages/admin-invites";
import AdminManageInfluencers from "@/pages/admin-manage-influencers";
import ResetPassword from "@/pages/reset-password";
import DashboardLayout from "@/components/layout/dashboard-layout";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/oauth-test" component={OAuthTest} />
          <Route path="/reset-password" component={ResetPassword} />
        </Switch>
      ) : (
        <>
          {/* Legacy home route - redirect to appropriate dashboard */}
          <Route path="/" component={Home} />

          {/* Influencer routes */}
          <Route path="/dashboard">
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </Route>

          <Route path="/profile">
            <DashboardLayout>
              <ProfileSettings />
            </DashboardLayout>
          </Route>

          <Route path="/payments">
            <DashboardLayout>
              <PaymentRequests />
            </DashboardLayout>
          </Route>

          <Route path="/jobs">
            <DashboardLayout>
              <JobTracking />
            </DashboardLayout>
          </Route>

          {/* Admin routes */}
          {user?.role === "admin" && (
            <>
              <Route path="/admin">
                <DashboardLayout>
                  <AdminDashboard />
                </DashboardLayout>
              </Route>

              <Route path="/admin/influencers">
                <DashboardLayout>
                  <AdminManageInfluencers />
                </DashboardLayout>
              </Route>

              <Route path="/admin/payments">
                <DashboardLayout>
                  <div>Payment Reviews (Coming Soon)</div>
                </DashboardLayout>
              </Route>

              <Route path="/admin/campaigns">
                <DashboardLayout>
                  <div>Campaign Management (Coming Soon)</div>
                </DashboardLayout>
              </Route>

              <Route path="/admin/invites">
                <DashboardLayout>
                  <AdminInvites />
                </DashboardLayout>
              </Route>
            </>
          )}
          <Route component={Home} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
