import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  DollarSign, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  Calendar,
  Upload
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PaymentRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Form state for new payment request
  const [formData, setFormData] = useState({
    campaignId: '',
    amount: '',
    contentUrl: '',
    invoiceUrl: '',
    description: '',
  });

  // Fetch payment requests
  const { data: paymentRequests, isLoading } = useQuery({
    queryKey: ['/api/payment-requests'],
    enabled: !!user,
  });

  // Create payment request mutation
  const createPaymentRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/payment-requests', data);
    },
    onSuccess: () => {
      toast({
        title: "✅ Payment request submitted",
        description: "Your payment request has been submitted for review.",
        variant: "default",
      });
      setIsCreateModalOpen(false);
      setFormData({
        campaignId: '',
        amount: '',
        contentUrl: '',
        invoiceUrl: '',
        description: '',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-requests'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Submission failed",
        description: error.message || "Failed to submit payment request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.contentUrl) {
      toast({
        title: "❌ Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createPaymentRequestMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Requests</h1>
          <p className="text-gray-600">
            Submit and track your payment requests for completed work.
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Submit Payment Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaignId">Campaign ID</Label>
                  <Input
                    id="campaignId"
                    placeholder="e.g., CAMP-2024-001"
                    value={formData.campaignId}
                    onChange={(e) => handleInputChange('campaignId', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Amount (USD) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="500.00"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="contentUrl">Content URL *</Label>
                <Input
                  id="contentUrl"
                  placeholder="https://instagram.com/p/..."
                  value={formData.contentUrl}
                  onChange={(e) => handleInputChange('contentUrl', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="invoiceUrl">Invoice URL (optional)</Label>
                <Input
                  id="invoiceUrl"
                  placeholder="https://drive.google.com/..."
                  value={formData.invoiceUrl}
                  onChange={(e) => handleInputChange('invoiceUrl', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Additional details about the completed work..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPaymentRequestMutation.isPending}
                >
                  {createPaymentRequestMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment Requests List */}
      <div className="space-y-4">
        {paymentRequests && paymentRequests.length > 0 ? (
          paymentRequests.map((request: any) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {request.campaignId || 'General Payment Request'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Submitted {new Date(request.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                    <span className="text-lg font-bold text-gray-900">
                      ${parseFloat(request.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                
                {request.adminNotes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Admin Notes:</p>
                    <p className="text-sm">{request.adminNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment requests yet</h3>
              <p className="text-gray-600 mb-4">
                Submit your first payment request to get started with the payment process.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Payment Request
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}