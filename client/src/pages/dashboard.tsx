import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  FileText, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Eye
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch dashboard data
  const { data: paymentRequests } = useQuery({
    queryKey: ['/api/payment-requests'],
    enabled: !!user,
  });

  const { data: workItems } = useQuery({
    queryKey: ['/api/work-items'],
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ['/api/profile'],
    enabled: !!user,
  });

  // Calculate stats
  const totalEarnings = paymentRequests?.filter((req: any) => req.status === 'paid')
    .reduce((sum: number, req: any) => sum + req.amount, 0) || 0;

  const pendingPayments = paymentRequests?.filter((req: any) => req.status === 'pending').length || 0;
  const activeJobs = workItems?.filter((item: any) => item.status === 'in_progress').length || 0;
  const completedJobs = workItems?.filter((item: any) => item.status === 'completed').length || 0;

  const successRate = workItems?.length > 0 ? 
    Math.round((completedJobs / workItems.length) * 100) : 0;

  const recentActivity = [
    ...paymentRequests?.slice(0, 3).map((req: any) => ({
      type: 'payment',
      title: `Payment request ${req.status}`,
      amount: req.amount,
      date: req.submittedAt,
      status: req.status
    })) || [],
    ...workItems?.slice(0, 3).map((item: any) => ({
      type: 'work',
      title: item.title,
      date: item.createdAt,
      status: item.status
    })) || []
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600">
          Here's your current status and recent activity overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {completedJobs} completed jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs}</div>
            <p className="text-xs text-muted-foreground">
              {activeJobs === 0 ? 'No active jobs' : 'In progress'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              {pendingPayments === 0 ? 'No pending payments' : 'Awaiting review'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {workItems?.length === 0 ? 'Complete your first job' : `${completedJobs} of ${workItems?.length} jobs`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Profile Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'completed' || activity.status === 'paid' ? 'bg-green-500' :
                        activity.status === 'pending' ? 'bg-yellow-500' :
                        activity.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {activity.type === 'payment' && (
                      <span className="text-sm font-medium text-green-600">
                        ${activity.amount}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center p-8 text-gray-500">
                  <div className="text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Profile Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {profile ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Profile Complete</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Instagram</p>
                      <p className="font-medium">{profile.instagramHandle || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">TikTok</p>
                      <p className="font-medium">{profile.tiktokHandle || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">YouTube</p>
                      <p className="font-medium">{profile.youtubeHandle || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Primary Rate</p>
                      <p className="font-medium">${profile.primaryRate || 'Not set'}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium">Profile Incomplete</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}