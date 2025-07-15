import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Search,
  Filter
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch dashboard data
  const { data: allPaymentRequests } = useQuery({
    queryKey: ['/api/admin/payment-requests'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: allWorkItems } = useQuery({
    queryKey: ['/api/admin/work-items'],
    enabled: !!user && user.role === 'admin',
  });

  const { data: allInfluencers } = useQuery({
    queryKey: ['/api/admin/influencers'],
    enabled: !!user && user.role === 'admin',
  });

  // Update payment request status mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      return await apiRequest('PUT', `/api/admin/payment-requests/${id}`, { status, adminNotes });
    },
    onSuccess: () => {
      toast({
        title: "✅ Status updated",
        description: "Payment request status has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Update failed",
        description: error.message || "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate statistics
  const totalInfluencers = allInfluencers?.length || 0;
  const totalPaymentRequests = allPaymentRequests?.length || 0;
  const pendingPayments = allPaymentRequests?.filter((req: any) => req.status === 'pending').length || 0;
  const totalRevenue = allPaymentRequests?.filter((req: any) => req.status === 'paid')
    .reduce((sum: number, req: any) => sum + parseFloat(req.amount || 0), 0) || 0;

  const handleStatusUpdate = (id: string, newStatus: string) => {
    updatePaymentStatusMutation.mutate({ id, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'paid': return <DollarSign className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  // Filter payment requests
  const filteredPaymentRequests = allPaymentRequests?.filter((req: any) => {
    const matchesSearch = req.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.campaignId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage influencers, review payment requests, and oversee platform operations.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Influencers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInfluencers}</div>
            <p className="text-xs text-muted-foreground">
              {totalInfluencers === 0 ? 'No influencers yet' : 'Active creators'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPaymentRequests}</div>
            <p className="text-xs text-muted-foreground">
              {pendingPayments} pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              {pendingPayments === 0 ? 'No pending reviews' : 'Require attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Paid to influencers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Requests Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Payment Requests Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by email or campaign ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Requests List */}
          <div className="space-y-4">
            {filteredPaymentRequests.length > 0 ? (
              filteredPaymentRequests.map((request: any) => (
                <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.user?.profileImageUrl || ''} />
                        <AvatarFallback>
                          {getInitials(request.user?.firstName, request.user?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.user?.firstName} {request.user?.lastName}</p>
                        <p className="text-sm text-gray-600">{request.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                      <span className="text-lg font-bold">${parseFloat(request.amount).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-600">Campaign:</p>
                      <p>{request.campaignId || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Submitted:</p>
                      <p>{new Date(request.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Content URL:</p>
                      <a 
                        href={request.contentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate block"
                      >
                        {request.contentUrl}
                      </a>
                    </div>
                    {request.invoiceUrl && (
                      <div>
                        <p className="text-gray-600">Invoice:</p>
                        <a 
                          href={request.invoiceUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Invoice
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Add Notes
                      </Button>
                    </div>
                    
                    <Select
                      value={request.status}
                      onValueChange={(newStatus) => handleStatusUpdate(request.id, newStatus)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {request.adminNotes && (
                    <div className="mt-3 p-3 bg-gray-100 rounded text-sm">
                      <p className="font-medium">Admin Notes:</p>
                      <p>{request.adminNotes}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No payment requests found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


    </div>
  );
}