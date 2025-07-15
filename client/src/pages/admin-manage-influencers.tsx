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
  DialogDescription,
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

export default function AdminManageInfluencers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("name");
  const [selectedInfluencer, setSelectedInfluencer] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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

  const getSearchPlaceholder = (type: string) => {
    switch (type) {
      case "name":
        return "Enter name to search...";
      case "email":
        return "Enter email to search...";
      case "tiktok_followers":
        return "Enter minimum TikTok followers...";
      case "instagram_followers":
        return "Enter minimum Instagram followers...";
      case "youtube_followers":
        return "Enter minimum YouTube followers...";
      case "primary_rate":
        return "Enter minimum primary rate...";
      case "engagement_rate":
        return "Enter minimum engagement rate...";
      default:
        return "Enter search value...";
    }
  };

  const handleViewDetails = async (influencer: any) => {
    setSelectedInfluencer(influencer);
    setIsDetailModalOpen(true);
  };

  // Filter influencers based on search type and search term
  const filteredInfluencers = influencers.filter((influencer: any) => {
    if (!searchTerm) return true;
    
    const user = influencer.user || {};
    const followers = influencer.followers || {};
    const engagement = influencer.engagement || {};
    const rates = influencer.rates || {};
    
    const searchValue = searchTerm.toLowerCase();
    
    switch (searchType) {
      case "name":
        return `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchValue);
      
      case "email":
        return user.email?.toLowerCase().includes(searchValue);
      
      case "tiktok_followers":
        const tikTokFollowers = followers.tiktok || 0;
        return tikTokFollowers >= parseInt(searchTerm) || tikTokFollowers.toString().includes(searchTerm);
      
      case "instagram_followers":
        const instagramFollowers = followers.instagram || 0;
        return instagramFollowers >= parseInt(searchTerm) || instagramFollowers.toString().includes(searchTerm);
      
      case "youtube_followers":
        const youtubeFollowers = followers.youtube || 0;
        return youtubeFollowers >= parseInt(searchTerm) || youtubeFollowers.toString().includes(searchTerm);
      
      case "primary_rate":
        const primaryRate = rates.post || 0;
        return primaryRate >= parseInt(searchTerm) || primaryRate.toString().includes(searchTerm);
      
      case "engagement_rate":
        const avgEngagement = Object.values(engagement).reduce((sum: number, val: any) => sum + (val || 0), 0) / Object.keys(engagement).length || 0;
        return avgEngagement >= parseFloat(searchTerm) || avgEngagement.toString().includes(searchTerm);
      
      default:
        return true;
    }
  });

  const clearSearch = () => {
    setSearchTerm("");
    setSearchType("name");
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
            <Search className="h-5 w-5 mr-2" />
            Search Influencers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Type Dropdown */}
            <div className="w-full md:w-64">
              <Label htmlFor="search-type">Search By</Label>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger id="search-type">
                  <SelectValue placeholder="Select search type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="tiktok_followers">TikTok Followers</SelectItem>
                  <SelectItem value="instagram_followers">Instagram Followers</SelectItem>
                  <SelectItem value="youtube_followers">YouTube Followers</SelectItem>
                  <SelectItem value="primary_rate">Primary Rate</SelectItem>
                  <SelectItem value="engagement_rate">Engagement Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="flex-1">
              <Label htmlFor="search-input">Search Value</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search-input"
                  placeholder={getSearchPlaceholder(searchType)}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  type={searchType.includes('followers') || searchType.includes('rate') ? 'number' : 'text'}
                />
              </div>
            </div>

            {/* Clear Search Button */}
            <div className="flex items-end">
              <Button variant="outline" onClick={clearSearch}>
                Clear Search
              </Button>
            </div>
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
            <DialogDescription>
              Complete profile information for the selected influencer
            </DialogDescription>
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
                            {influencerDetails.profile.followers && Object.entries(influencerDetails.profile.followers)
                              .filter(([platform, count]) => count !== null && count !== undefined)
                              .map(([platform, count]: [string, any]) => (
                                <div key={platform} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="text-sm font-medium capitalize">{platform}</span>
                                  <span className="text-sm">{formatNumber(Number(count))}</span>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Engagement */}
                        <div>
                          <div className="flex items-center gap-2">
                            <Label>Engagement Rates</Label>
                            {influencerDetails.profile.engagement && Object.entries(influencerDetails.profile.engagement)
                              .filter(([platform, rate]) => rate !== null && rate !== undefined)
                              .map(([platform, rate]: [string, any]) => (
                                <span key={platform} className="text-sm font-medium">{Number(rate).toFixed(1)}%</span>
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