import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Instagram, 
  Youtube, 
  DollarSign,
  Camera,
  Save,
  Hash
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch existing profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/profile'],
    enabled: !!user,
  });

  // Form state
  const [formData, setFormData] = useState({
    instagramHandle: '',
    tiktokHandle: '',
    youtubeHandle: '',
    primaryRate: '',
    bio: '',
    niches: '',
    instagramFollowers: '',
    tiktokFollowers: '',
    youtubeSubscribers: '',
    avgEngagementRate: '',
    location: '',
    preferredContentTypes: '',
  });

  // Profile photo state
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      // Calculate average engagement rate across all platforms
      const calculateAvgEngagement = () => {
        if (!profile.engagement) return '';
        
        const engagement = profile.engagement;
        const rates = Object.values(engagement).filter(rate => rate && rate > 0);
        
        if (rates.length === 0) return '';
        
        const avgRate = rates.reduce((sum: number, rate: any) => sum + rate, 0) / rates.length;
        return avgRate.toFixed(1);
      };

      setFormData({
        instagramHandle: profile.socialLinks?.instagram || '',
        tiktokHandle: profile.socialLinks?.tiktok || '',
        youtubeHandle: profile.socialLinks?.youtube || '',
        primaryRate: profile.rates?.post?.toString() || '',
        bio: profile.bio || '',
        niches: Array.isArray(profile.niches) ? profile.niches.join(', ') : '',
        instagramFollowers: profile.followers?.instagram?.toString() || '',
        tiktokFollowers: profile.followers?.tiktok?.toString() || '',
        youtubeSubscribers: profile.followers?.youtube?.toString() || '',
        avgEngagementRate: calculateAvgEngagement(),
        location: profile.location || '',
        preferredContentTypes: Array.isArray(profile.languages) ? profile.languages.join(', ') : '',
      });
    }
  }, [profile]);

  // Create or update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = profile ? '/api/profile' : '/api/profile';
      const method = profile ? 'PUT' : 'POST';
      return await apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: "✅ Profile updated successfully",
        description: "Your profile information has been saved.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Update failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Profile photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profileImage', file);
      return await apiRequest('POST', '/api/upload-profile-image', formData);
    },
    onSuccess: () => {
      toast({
        title: "✅ Photo updated successfully",
        description: "Your profile photo has been updated.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setProfileImage(null);
      setImagePreview(null);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Upload failed",
        description: error.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const profileData = {
      bio: formData.bio || null,
      niches: formData.niches ? formData.niches.split(',').map(n => n.trim()).filter(n => n) : [],
      rates: {
        post: formData.primaryRate ? parseFloat(formData.primaryRate) : null,
      },
      socialLinks: {
        instagram: formData.instagramHandle || null,
        tiktok: formData.tiktokHandle || null,
        youtube: formData.youtubeHandle || null,
      },
      followers: {
        instagram: formData.instagramFollowers ? parseInt(formData.instagramFollowers) : null,
        tiktok: formData.tiktokFollowers ? parseInt(formData.tiktokFollowers) : null,
        youtube: formData.youtubeSubscribers ? parseInt(formData.youtubeSubscribers) : null,
      },
      engagement: {
        instagram: formData.avgEngagementRate ? parseFloat(formData.avgEngagementRate) : null,
        tiktok: formData.avgEngagementRate ? parseFloat(formData.avgEngagementRate) : null,
        youtube: formData.avgEngagementRate ? parseFloat(formData.avgEngagementRate) : null,
      },
      location: formData.location || null,
      languages: formData.preferredContentTypes ? formData.preferredContentTypes.split(',').map(l => l.trim()).filter(l => l) : [],
    };

    updateProfileMutation.mutate(profileData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "❌ File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "❌ Invalid file type",
          description: "Please select a valid image file (JPG, PNG, or GIF).",
          variant: "destructive",
        });
        return;
      }

      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-600">
          Manage your profile information and social media presence.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-6">
              <Avatar className="h-20 w-20">
                <AvatarImage 
                  src={imagePreview || user?.profileImageUrl || ''} 
                  alt={user?.firstName || ''} 
                />
                <AvatarFallback className="text-lg">
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="profile-image-input"
                />
                <Label htmlFor="profile-image-input">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Camera className="h-4 w-4 mr-2" />
                      Change Photo
                    </span>
                  </Button>
                </Label>
                {profileImage && (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => uploadPhotoMutation.mutate(profileImage)}
                    disabled={uploadPhotoMutation.isPending}
                    className="ml-2"
                  >
                    {uploadPhotoMutation.isPending ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={user?.firstName || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={user?.lastName || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="pl-10 bg-gray-50"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Los Angeles, CA"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Instagram className="h-5 w-5 mr-2" />
              Social Media Profiles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instagramHandle">Instagram Handle</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="instagramHandle"
                    placeholder="username"
                    value={formData.instagramHandle}
                    onChange={(e) => handleInputChange('instagramHandle', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="instagramFollowers">Instagram Followers</Label>
                <Input
                  id="instagramFollowers"
                  type="number"
                  placeholder="10000"
                  value={formData.instagramFollowers}
                  onChange={(e) => handleInputChange('instagramFollowers', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tiktokHandle">TikTok Handle</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="tiktokHandle"
                    placeholder="username"
                    value={formData.tiktokHandle}
                    onChange={(e) => handleInputChange('tiktokHandle', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="tiktokFollowers">TikTok Followers</Label>
                <Input
                  id="tiktokFollowers"
                  type="number"
                  placeholder="50000"
                  value={formData.tiktokFollowers}
                  onChange={(e) => handleInputChange('tiktokFollowers', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="youtubeHandle">YouTube Handle</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="youtubeHandle"
                    placeholder="username"
                    value={formData.youtubeHandle}
                    onChange={(e) => handleInputChange('youtubeHandle', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="youtubeSubscribers">YouTube Subscribers</Label>
                <Input
                  id="youtubeSubscribers"
                  type="number"
                  placeholder="25000"
                  value={formData.youtubeSubscribers}
                  onChange={(e) => handleInputChange('youtubeSubscribers', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryRate">Primary Rate (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="primaryRate"
                    type="number"
                    placeholder="500"
                    value={formData.primaryRate}
                    onChange={(e) => handleInputChange('primaryRate', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="avgEngagementRate">Avg. Engagement Rate (%)</Label>
                <Input
                  id="avgEngagementRate"
                  type="number"
                  step="0.1"
                  placeholder="3.5"
                  value={formData.avgEngagementRate}
                  onChange={(e) => handleInputChange('avgEngagementRate', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="niches">Niches</Label>
              <Input
                id="niches"
                placeholder="e.g., Fashion, Beauty, Lifestyle"
                value={formData.niches}
                onChange={(e) => handleInputChange('niches', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="preferredContentTypes">Preferred Content Types</Label>
              <Input
                id="preferredContentTypes"
                placeholder="e.g., Instagram Posts, Stories, Reels"
                value={formData.preferredContentTypes}
                onChange={(e) => handleInputChange('preferredContentTypes', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={updateProfileMutation.isPending}
            className="min-w-[120px]"
          >
            {updateProfileMutation.isPending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}