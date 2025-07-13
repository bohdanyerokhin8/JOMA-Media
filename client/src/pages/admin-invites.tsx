import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Plus, 
  Mail, 
  Shield, 
  UserPlus,
  Trash2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const inviteAdminSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

type InviteAdminData = z.infer<typeof inviteAdminSchema>;

export default function AdminInvites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<InviteAdminData>({
    resolver: zodResolver(inviteAdminSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
    },
  });

  // Fetch admin invites
  const { data: adminInvites } = useQuery({
    queryKey: ['/api/admin/invites'],
    enabled: !!user && user.role === 'admin',
  });

  // Create admin invite mutation
  const createInviteMutation = useMutation({
    mutationFn: async (data: InviteAdminData) => {
      return await apiRequest('POST', '/api/admin/invites', data);
    },
    onSuccess: () => {
      toast({
        title: "✅ Admin invite created",
        description: "Admin invite has been created successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/invites'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Failed to create invite",
        description: error.message || "Failed to create admin invite. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete admin invite mutation
  const deleteInviteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest('DELETE', `/api/admin/invites/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "✅ Admin invite deleted",
        description: "Admin invite has been deleted successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/invites'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Failed to delete invite",
        description: error.message || "Failed to delete admin invite. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InviteAdminData) => {
    createInviteMutation.mutate(data);
  };

  const handleDeleteInvite = (id: string) => {
    if (confirm("Are you sure you want to delete this admin invite?")) {
      deleteInviteMutation.mutate(id);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Accepted</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Invites</h1>
          <p className="text-gray-600 mt-1">
            Manage admin invitations and pre-approved email addresses
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Admin Invite
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Admin Invite</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createInviteMutation.isPending}>
                    {createInviteMutation.isPending ? "Creating..." : "Create Invite"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invites</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminInvites?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Admin invitations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminInvites?.filter((invite: any) => invite.status === 'pending').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting signup</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminInvites?.filter((invite: any) => invite.status === 'accepted').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Completed signups</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Invites Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Admin Invites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {adminInvites && adminInvites.length > 0 ? (
              adminInvites.map((invite: any) => (
                <div key={invite.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(invite.firstName, invite.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">
                        {invite.firstName} {invite.lastName}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {invite.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(invite.status)}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteInvite(invite.id)}
                      disabled={deleteInviteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <UserPlus className="h-12 w-12 mb-4 text-gray-400" />
                <p className="text-lg font-medium">No admin invites yet</p>
                <p className="text-sm">Create your first admin invite to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}