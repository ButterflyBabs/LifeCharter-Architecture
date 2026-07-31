"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Star,
  MessageSquare,
  Video,
  Mic,
  Share2,
  TrendingUp,
  Users,
  Target,
  Plus,
  Send,
  CheckCircle,
  Sparkles,
  Zap,
  BarChart3,
  Download,
  Copy,
  Mail
} from "lucide-react";
interface Review {
  id: string;
  clientName: string;
  clientPhoto?: string;
  rating: number;
  type: "text" | "video" | "audio";
  content: string;
  date: string;
  program: string;
  tags: string[];
  status: "pending" | "approved" | "featured";
  socialShares: number;
}

interface ReviewRequest {
  id: string;
  clientName: string;
  clientEmail: string;
  program: string;
  sentDate: string;
  status: "sent" | "opened" | "completed" | "reminded";
}

interface ReviewCampaign {
  id: string;
  name: string;
  type: "post-program" | "milestone" | "annual" | "custom";
  status: "active" | "paused" | "completed";
  sent: number;
  received: number;
  conversionRate: number;
}

export default function ReviewsPage() {
  const [reviews] = useState<Review[]>([
    {
      id: "1",
      clientName: "Sarah Johnson",
      rating: 5,
      type: "text",
      content: "LifeCharter completely transformed how I approach my business. The alignment framework helped me clarify my vision and actually achieve my goals instead of just dreaming about them.",
      date: "2026-07-15",
      program: "LifeCharter Circle",
      tags: ["transformation", "clarity", "results"],
      status: "featured",
      socialShares: 12
    },
    {
      id: "2",
      clientName: "Michael Chen",
      rating: 5,
      type: "video",
      content: "Video testimonial - 2:34 duration",
      date: "2026-07-12",
      program: "LifeCharter Incubator",
      tags: ["workshop", "breakthrough"],
      status: "approved",
      socialShares: 8
    },
    {
      id: "3",
      clientName: "Emily Rodriguez",
      rating: 5,
      type: "audio",
      content: "Audio testimonial - 1:45 duration",
      date: "2026-07-10",
      program: "LifeCharter Circle",
      tags: ["community", "support"],
      status: "approved",
      socialShares: 5
    }
  ]);

  const [requests] = useState<ReviewRequest[]>([
    {
      id: "1",
      clientName: "David Park",
      clientEmail: "david@example.com",
      program: "LifeCharter Circle",
      sentDate: "2026-07-14",
      status: "opened"
    },
    {
      id: "2",
      clientName: "Lisa Thompson",
      clientEmail: "lisa@example.com",
      program: "LifeCharter Incubator",
      sentDate: "2026-07-10",
      status: "completed"
    }
  ]);

  const [campaigns] = useState<ReviewCampaign[]>([
    {
      id: "1",
      name: "Post-Program Follow-up",
      type: "post-program",
      status: "active",
      sent: 45,
      received: 28,
      conversionRate: 62
    },
    {
      id: "2",
      name: "6-Month Milestone",
      type: "milestone",
      status: "active",
      sent: 32,
      received: 19,
      conversionRate: 59
    }
  ]);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    clientName: "",
    clientEmail: "",
    program: "",
    message: ""
  });

  const stats = {
    totalReviews: 127,
    averageRating: 4.9,
    responseRate: 64,
    socialShares: 342,
    featuredCount: 18,
    videoCount: 23,
    audioCount: 15,
    textCount: 89
  };

  const handleSendRequest = () => {
    // Handle sending review request
    setShowRequestForm(false);
    setNewRequest({ clientName: "", clientEmail: "", program: "", message: "" });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? "fill-[#c9a227] text-[#c9a227]" : "text-[#b8a898]"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#c9a227]/20 flex items-center justify-center">
            <Star className="w-6 h-6 text-[#c9a227]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
              Reviews & Testimonials
            </h1>
            <p className="text-[#b8a898]">
              Collect, manage, and leverage client success stories
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[#b8a898] mb-1">Total Reviews</p>
            <p className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{stats.totalReviews}</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600">+12 this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[#b8a898] mb-1">Average Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{stats.averageRating}</p>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#c9a227] text-[#c9a227]" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[#b8a898] mb-1">Response Rate</p>
            <p className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{stats.responseRate}%</p>
            <div className="w-full bg-[#1a2b4a]/10 rounded-full h-2 mt-2">
              <div className="bg-[#4a9b9b] h-2 rounded-full" style={{ width: `${stats.responseRate}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[#b8a898] mb-1">Social Shares</p>
            <p className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{stats.socialShares}</p>
            <div className="flex items-center gap-1 mt-2">
              <Share2 className="w-4 h-4 text-[#c9a227]" />
              <span className="text-xs text-[#b8a898]">across platforms</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Reviews & Requests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Bar */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
              Recent Reviews
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <Button size="sm" onClick={() => setShowRequestForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Request Review
              </Button>
            </div>
          </div>

          {/* Review Request Form */}
          {showRequestForm && (
            <Card className="border-[#c9a227]/30">
              <CardHeader>
                <CardTitle className="text-lg">Request a Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[#b8a898] mb-1 block">Client Name</label>
                    <Input
                      placeholder="e.g., Jane Smith"
                      value={newRequest.clientName}
                      onChange={(e) => setNewRequest({...newRequest, clientName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#b8a898] mb-1 block">Client Email</label>
                    <Input
                      type="email"
                      placeholder="jane@example.com"
                      value={newRequest.clientEmail}
                      onChange={(e) => setNewRequest({...newRequest, clientEmail: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#b8a898] mb-1 block">Program</label>
                  <select
                    className="w-full p-2 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a] text-[#1a2b4a] dark:text-[#F8F5F0]"
                    value={newRequest.program}
                    onChange={(e) => setNewRequest({...newRequest, program: e.target.value})}
                  >
                    <option value="">Select program...</option>
                    <option value="LifeCharter Circle">LifeCharter Circle</option>
                    <option value="LifeCharter Incubator">LifeCharter Incubator</option>
                    <option value="1:1 Coaching">1:1 Coaching</option>
                    <option value="Workshop">Workshop</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[#b8a898] mb-1 block">Personal Message (Optional)</label>
                  <Textarea
                    placeholder="Add a personal note to your review request..."
                    value={newRequest.message}
                    onChange={(e) => setNewRequest({...newRequest, message: e.target.value})}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowRequestForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendRequest}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className={review.status === "featured" ? "border-[#c9a227]" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#1a2b4a]/10 flex items-center justify-center">
                        {review.type === "video" ? (
                          <Video className="w-6 h-6 text-[#4a9b9b]" />
                        ) : review.type === "audio" ? (
                          <Mic className="w-6 h-6 text-[#7b6b8d]" />
                        ) : (
                          <MessageSquare className="w-6 h-6 text-[#c9a227]" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">
                            {review.clientName}
                          </h3>
                          {review.status === "featured" && (
                            <span className="px-2 py-0.5 bg-[#c9a227]/20 text-[#c9a227] text-xs rounded-full">
                              Featured
                            </span>
                          )}
                        </div>
                        {renderStars(review.rating)}
                        <p className="text-sm text-[#b8a898] mt-1">
                          {review.program} • {review.date}
                        </p>
                        <p className="text-[#1a2b4a] dark:text-[#F8F5F0] mt-3">
                          &quot;{review.content}&quot;
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {review.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-[#1a2b4a]/5 text-[#7b6b8d] dark:text-[#e8e4f0] text-xs rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      {review.type !== "text" && (
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pending Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#c9a227]" />
                Pending Review Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-[#1a2b4a]/5 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        request.status === "completed" ? "bg-green-500" :
                        request.status === "opened" ? "bg-yellow-500" :
                        "bg-blue-500"
                      }`} />
                      <div>
                        <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                          {request.clientName}
                        </p>
                        <p className="text-sm text-[#b8a898]">
                          {request.program} • Sent {request.sentDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        request.status === "completed" ? "bg-green-100 text-green-700" :
                        request.status === "opened" ? "bg-yellow-100 text-yellow-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {request.status}
                      </span>
                      {request.status !== "completed" && (
                        <Button variant="outline" size="sm">
                          Remind
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Campaigns & Tools */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-[#1a2b4a] to-[#7b6b8d] text-[#F8F5F0]">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#c9a227]" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start border-[#c9a227] text-[#c9a227] hover:bg-[#c9a227]/10">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
                <Button variant="outline" className="w-full justify-start border-[#c9a227] text-[#c9a227] hover:bg-[#c9a227]/10">
                  <Users className="w-4 h-4 mr-2" />
                  Import Contacts
                </Button>
                <Button variant="outline" className="w-full justify-start border-[#c9a227] text-[#c9a227] hover:bg-[#c9a227]/10">
                  <Download className="w-4 h-4 mr-2" />
                  Export All Reviews
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-[#c9a227]" />
                Active Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="p-4 bg-[#1a2b4a]/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                      {campaign.name}
                    </h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      campaign.status === "active" ? "bg-green-100 text-green-700" :
                      campaign.status === "paused" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-3">
                    <div>
                      <p className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">{campaign.sent}</p>
                      <p className="text-xs text-[#b8a898]">Sent</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#4a9b9b]">{campaign.received}</p>
                      <p className="text-xs text-[#b8a898]">Received</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#c9a227]">{campaign.conversionRate}%</p>
                      <p className="text-xs text-[#b8a898]">Rate</p>
                    </div>
                  </div>
                  <div className="w-full bg-[#1a2b4a]/10 rounded-full h-2">
                    <div
                      className="bg-[#4a9b9b] h-2 rounded-full"
                      style={{ width: `${campaign.conversionRate}%` }}
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                View All Campaigns
              </Button>
            </CardContent>
          </Card>

          {/* Review Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Review Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#1a2b4a]/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-[#c9a227]" />
                    <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">Text Reviews</span>
                  </div>
                  <span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{stats.textCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1a2b4a]/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-[#4a9b9b]" />
                    <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">Video Testimonials</span>
                  </div>
                  <span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{stats.videoCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#1a2b4a]/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mic className="w-5 h-5 text-[#7b6b8d]" />
                    <span className="text-[#1a2b4a] dark:text-[#F8F5F0]">Audio Reviews</span>
                  </div>
                  <span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{stats.audioCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share on Social */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#c9a227]" />
                Share Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" className="flex flex-col items-center py-3">
                  <Share2 className="w-5 h-5 mb-1" />
                  <span className="text-xs">Instagram</span>
                </Button>
                <Button variant="outline" size="sm" className="flex flex-col items-center py-3">
                  <Share2 className="w-5 h-5 mb-1" />
                  <span className="text-xs">LinkedIn</span>
                </Button>
                <Button variant="outline" size="sm" className="flex flex-col items-center py-3">
                  <Share2 className="w-5 h-5 mb-1" />
                  <span className="text-xs">Twitter</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-[#c9a227]/10 border-[#c9a227]/30">
            <CardContent className="p-6">
              <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#c9a227]" />
                Pro Tips
              </h3>
              <ul className="space-y-2 text-sm text-[#7b6b8d] dark:text-[#e8e4f0]">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#4a9b9b] mt-0.5" />
                  Request reviews within 48 hours of program completion
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#4a9b9b] mt-0.5" />
                  Offer multiple formats: text, video, or audio
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#4a9b9b] mt-0.5" />
                  Feature the best reviews on your website
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#4a9b9b] mt-0.5" />
                  Share video testimonials on social media
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
