import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, 
  Eye, 
  Search, 
  Filter,
  MapPin,
  Link as LinkIcon,
  DollarSign,
  TrendingUp,
  Hash,
  Mail,
  User,
  Globe
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function AdminManageInfluencers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInfluencer, setSelectedInfluencer] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    minTikTokFollowers: "",
    maxTikTokFollowers: "",
    minInstagramFollowers: "",
    maxInstagramFollowers: "",
    minYouTubeFollowers: "",
    maxYouTubeFollowers: "",
    minPrimaryRate: "",
    maxPrimaryRate: "",
    minEngagementRate: "",
    maxEngagementRate: "",
    nameFilter: "",
    emailFilter: "",
  });

  // Fetch all influencers
  const { data: influencers = [], isLoading } = useQuery({
    queryKey: ['/api/admin/influencers'],
    enabled: !!user && user.role === 'admin',
  });

  // Fetch individual influencer details
  const { data: influencerDetails, isLoading: isDetailLoading } = useQuery({
    queryKey: ['/api/admin/influencers', selectedInfluencer?.userId],
    enabled: !!selectedInfluencer?.userId,
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toString() || '0';
  };

  const handleViewDetails = async (influencer: any) => {
    setSelectedInfluencer(influencer);
    setIsDetailModalOpen(true);
  };

  // Filter influencers based on search and filters
  const filteredInfluencers = influencers.filter((influencer: any) => {
    const user = influencer.user || {};
    const followers = influencer.followers || {};
    const engagement = influencer.engagement || {};
    const rates = influencer.rates || {};
    
    // Basic search filter
    const matchesSearch = !searchTerm || 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    // Name filter
    const matchesName = !filters.nameFilter || 
      `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(filters.nameFilter.toLowerCase());

    // Email filter
    const matchesEmail = !filters.emailFilter || 
      user.email?.toLowerCase().includes(filters.emailFilter.toLowerCase());

    // TikTok followers filter
    const tikTokFollowers = followers.tiktok || 0;
    const matchesTikTokMin = !filters.minTikTokFollowers || tikTokFollowers >= parseInt(filters.minTikTokFollowers);
    const matchesTikTokMax = !filters.maxTikTokFollowers || tikTokFollowers <= parseInt(filters.maxTikTokFollowers);

    // Instagram followers filter
    const instagramFollowers = followers.instagram || 0;
    const matchesInstagramMin = !filters.minInstagramFollowers || instagramFollowers >= parseInt(filters.minInstagramFollowers);
    const matchesInstagramMax = !filters.maxInstagramFollowers || instagramFollowers <= parseInt(filters.maxInstagramFollowers);

    // YouTube followers filter
    const youtubeFollowers = followers.youtube || 0;
    const matchesYouTubeMin = !filters.minYouTubeFollowers || youtubeFollowers >= parseInt(filters.minYouTubeFollowers);
    const matchesYouTubeMax = !filters.maxYouTubeFollowers || youtubeFollowers <= parseInt(filters.maxYouTubeFollowers);

    // Primary rate filter (using post rate as primary)
    const primaryRate = rates.post || 0;
    const matchesPrimaryRateMin = !filters.minPrimaryRate || primaryRate >= parseInt(filters.minPrimaryRate);
    const matchesPrimaryRateMax = !filters.maxPrimaryRate || primaryRate <= parseInt(filters.maxPrimaryRate);

    // Engagement rate filter (using average engagement)
    const avgEngagement = Object.values(engagement).reduce((sum: number, val: any) => sum + (val || 0), 0) / Object.keys(engagement).length || 0;
    const matchesEngagementMin = !filters.minEngagementRate || avgEngagement >= parseFloat(filters.minEngagementRate);
    const matchesEngagementMax = !filters.maxEngagementRate || avgEngagement <= parseFloat(filters.maxEngagementRate);

    return matchesSearch && matchesName && matchesEmail && 
           matchesTikTokMin && matchesTikTokMax && 
           matchesInstagramMin && matchesInstagramMax && 
           matchesYouTubeMin && matchesYouTubeMax && 
           matchesPrimaryRateMin && matchesPrimaryRateMax && 
           matchesEngagementMin && matchesEngagementMax;
  });

  const clearFilters = () => {
    setFilters({
      minTikTokFollowers: "",
      maxTikTokFollowers: "",
      minInstagramFollowers: "",
      maxInstagramFollowers: "",
      minYouTubeFollowers: "",
      maxYouTubeFollowers: "",
      minPrimaryRate: "",
      maxPrimaryRate: "",
      minEngagementRate: "",
      maxEngagementRate: "",
      nameFilter: "",
      emailFilter: "",
    });
    setSearchTerm("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-lg">Loading influencers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Manage Influencers
        </h1>
        <p className="text-gray-600">
          View and manage all influencers in the platform with detailed profiles and filtering capabilities.
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Basic Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Name Filter */}
            <div>
              <Label htmlFor="name-filter">Name</Label>
              <Input
                id="name-filter"
                placeholder="Filter by name..."
                value={filters.nameFilter}
                onChange={(e) => setFilters({...filters, nameFilter: e.target.value})}
              />
            </div>

            {/* Email Filter */}
            <div>
              <Label htmlFor="email-filter">Email</Label>
              <Input
                id="email-filter"
                placeholder="Filter by email..."
                value={filters.emailFilter}
                onChange={(e) => setFilters({...filters, emailFilter: e.target.value})}
              />
            </div>

            {/* TikTok Followers Range */}
            <div>
              <Label>TikTok Followers</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minTikTokFollowers}
                  onChange={(e) => setFilters({...filters, minTikTokFollowers: e.target.value})}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxTikTokFollowers}
                  onChange={(e) => setFilters({...filters, maxTikTokFollowers: e.target.value})}
                />
              </div>
            </div>

            {/* Instagram Followers Range */}
            <div>
              <Label>Instagram Followers</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minInstagramFollowers}
                  onChange={(e) => setFilters({...filters, minInstagramFollowers: e.target.value})}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxInstagramFollowers}
                  onChange={(e) => setFilters({...filters, maxInstagramFollowers: e.target.value})}
                />
              </div>
            </div>

            {/* YouTube Followers Range */}
            <div>
              <Label>YouTube Followers</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minYouTubeFollowers}
                  onChange={(e) => setFilters({...filters, minYouTubeFollowers: e.target.value})}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxYouTubeFollowers}
                  onChange={(e) => setFilters({...filters, maxYouTubeFollowers: e.target.value})}
                />
              </div>
            </div>

            {/* Primary Rate Range */}
            <div>
              <Label>Primary Rate ($)</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrimaryRate}
                  onChange={(e) => setFilters({...filters, minPrimaryRate: e.target.value})}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrimaryRate}
                  onChange={(e) => setFilters({...filters, maxPrimaryRate: e.target.value})}
                />
              </div>
            </div>

            {/* Engagement Rate Range */}
            <div>
              <Label>Engagement Rate (%)</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Min"
                  value={filters.minEngagementRate}
                  onChange={(e) => setFilters({...filters, minEngagementRate: e.target.value})}
                />
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Max"
                  value={filters.maxEngagementRate}
                  onChange={(e) => setFilters({...filters, maxEngagementRate: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Showing {filteredInfluencers.length} of {influencers.length} influencers
      </div>

      {/* Influencers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Influencers ({filteredInfluencers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Influencer</TableHead>
                  <TableHead>TikTok</TableHead>
                  <TableHead>Instagram</TableHead>
                  <TableHead>YouTube</TableHead>
                  <TableHead>Primary Rate</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInfluencers.length > 0 ? (
                  filteredInfluencers.map((influencer: any) => {
                    const user = influencer.user || {};
                    const followers = influencer.followers || {};
                    const engagement = influencer.engagement || {};
                    const rates = influencer.rates || {};
                    const avgEngagement = Object.values(engagement).reduce((sum: number, val: any) => sum + (val || 0), 0) / Object.keys(engagement).length || 0;
                    
                    return (
                      <TableRow key={influencer.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profileImageUrl || ''} />
                              <AvatarFallback>
                                {getInitials(user.firstName, user.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Hash className="h-4 w-4 text-gray-400" />
                            <span>{formatNumber(followers.tiktok || 0)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Hash className="h-4 w-4 text-gray-400" />
                            <span>{formatNumber(followers.instagram || 0)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Hash className="h-4 w-4 text-gray-400" />
                            <span>{formatNumber(followers.youtube || 0)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span>{rates.post || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-4 w-4 text-gray-400" />
                            <span>{avgEngagement.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(influencer)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No influencers found matching your criteria</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Influencer Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Influencer Profile Details</DialogTitle>
          </DialogHeader>
          
          {isDetailLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg">Loading profile details...</div>
            </div>
          ) : influencerDetails && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={influencerDetails.user?.profileImageUrl || ''} />
                  <AvatarFallback className="text-xl">
                    {getInitials(influencerDetails.user?.firstName, influencerDetails.user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">
                    {influencerDetails.user?.firstName} {influencerDetails.user?.lastName}
                  </h2>
                  <p className="text-gray-600 flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {influencerDetails.user?.email}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="outline">
                      {influencerDetails.user?.role || 'influencer'}
                    </Badge>
                    <Badge variant={influencerDetails.user?.isActive ? "default" : "secondary"}>
                      {influencerDetails.user?.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              {influencerDetails.profile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <User className="h-5 w-5 mr-2" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {influencerDetails.profile.bio && (
                        <div>
                          <Label>Bio</Label>
                          <p className="text-sm text-gray-600">{influencerDetails.profile.bio}</p>
                        </div>
                      )}
                      
                      {influencerDetails.profile.location && (
                        <div>
                          <Label>Location</Label>
                          <p className="text-sm text-gray-600 flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {influencerDetails.profile.location}
                          </p>
                        </div>
                      )}
                      
                      {influencerDetails.profile.languages && influencerDetails.profile.languages.length > 0 && (
                        <div>
                          <Label>Languages</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {influencerDetails.profile.languages.map((lang: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {lang}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {influencerDetails.profile.niches && influencerDetails.profile.niches.length > 0 && (
                        <div>
                          <Label>Niches</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {influencerDetails.profile.niches.map((niche: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {niche}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Social Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Hash className="h-5 w-5 mr-2" />
                        Social Media Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Followers */}
                        <div>
                          <Label>Followers</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {influencerDetails.profile.followers && Object.entries(influencerDetails.profile.followers).map(([platform, count]: [string, any]) => (
                              <div key={platform} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm font-medium capitalize">{platform}</span>
                                <span className="text-sm">{formatNumber(count)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Engagement */}
                        <div>
                          <Label>Engagement Rates</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {influencerDetails.profile.engagement && Object.entries(influencerDetails.profile.engagement).map(([platform, rate]: [string, any]) => (
                              <div key={platform} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm font-medium capitalize">{platform}</span>
                                <span className="text-sm">{rate}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rates */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <DollarSign className="h-5 w-5 mr-2" />
                        Rates
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {influencerDetails.profile.rates && Object.entries(influencerDetails.profile.rates).map(([type, rate]: [string, any]) => (
                          <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium capitalize">{type}</span>
                            <span className="text-sm">${rate}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Social Links */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <LinkIcon className="h-5 w-5 mr-2" />
                        Social Links
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {influencerDetails.profile.socialLinks && Object.entries(influencerDetails.profile.socialLinks).map(([platform, link]: [string, any]) => (
                          link && (
                            <div key={platform} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm font-medium capitalize">{platform}</span>
                              <a 
                                href={link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center"
                              >
                                <Globe className="h-4 w-4 mr-1" />
                                View Profile
                              </a>
                            </div>
                          )
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>This influencer hasn't completed their profile yet</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}