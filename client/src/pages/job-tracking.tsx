import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Briefcase, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Plus,
  Edit,
  Eye
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function JobTracking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  
  // Form state for new work item
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    campaignId: '',
    dueDate: '',
  });

  // Fetch work items
  const { data: workItems, isLoading } = useQuery({
    queryKey: ['/api/work-items'],
    enabled: !!user,
  });

  // Create work item mutation
  const createWorkItemMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/work-items', data);
    },
    onSuccess: () => {
      toast({
        title: "✅ Job created successfully",
        description: "Your job has been added to the tracking system.",
        variant: "default",
      });
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        description: '',
        campaignId: '',
        dueDate: '',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/work-items'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Creation failed",
        description: error.message || "Failed to create job. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update work item status mutation
  const updateWorkItemMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest('PUT', `/api/work-items/${id}`, { status });
    },
    onSuccess: () => {
      toast({
        title: "✅ Status updated",
        description: "Job status has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/work-items'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Update failed",
        description: error.message || "Failed to update status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast({
        title: "❌ Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createWorkItemMutation.mutate({
      ...formData,
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStatusUpdate = (id: string, newStatus: string) => {
    updateWorkItemMutation.mutate({ id, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'brief_sent': return 'bg-blue-100 text-blue-800';
      case 'content_submitted': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'brief_sent': return <FileText className="h-4 w-4" />;
      case 'content_submitted': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'brief_sent': return 'Brief Sent';
      case 'content_submitted': return 'Content Submitted';
      case 'approved': return 'Approved';
      case 'paid': return 'Paid';
      default: return status;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && dueDate;
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Tracking</h1>
          <p className="text-gray-600">
            Monitor your ongoing projects and deliverables.
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Instagram Reel for Summer Campaign"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the job requirements and deliverables..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  required
                />
              </div>
              
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
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  />
                </div>
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
                  disabled={createWorkItemMutation.isPending}
                >
                  {createWorkItemMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Job
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Job Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold">{workItems?.length || 0}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">
                  {workItems?.filter((item: any) => 
                    item.status === 'brief_sent' || item.status === 'content_submitted'
                  ).length || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">
                  {workItems?.filter((item: any) => 
                    item.status === 'approved' || item.status === 'paid'
                  ).length || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold">
                  {workItems?.filter((item: any) => 
                    item.dueDate && isOverdue(item.dueDate) && 
                    item.status !== 'approved' && item.status !== 'paid'
                  ).length || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Items List */}
      <div className="space-y-4">
        {workItems && workItems.length > 0 ? (
          workItems.map((item: any) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600">
                        {item.campaignId && `Campaign: ${item.campaignId} • `}
                        Created {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                    {item.dueDate && (
                      <div className={`text-sm ${isOverdue(item.dueDate) ? 'text-red-600' : 'text-gray-600'}`}>
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Due: {new Date(item.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{item.description}</p>
                
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedJob(item)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {/* Handle edit */}}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                  
                  <Select
                    value={item.status}
                    onValueChange={(newStatus) => handleStatusUpdate(item.id, newStatus)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brief_sent">Brief Sent</SelectItem>
                      <SelectItem value="content_submitted">Content Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first job to start tracking your work progress.
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Job
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}