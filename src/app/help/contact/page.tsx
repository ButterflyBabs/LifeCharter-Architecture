"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { 
  LifeBuoy, 
  Mail, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Send,
  Phone,
  Video
} from "lucide-react";

export default function ContactSupportPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
    priority: "normal"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const supportCategories = [
    { id: "technical", label: "Technical Issue", icon: "🔧" },
    { id: "billing", label: "Billing & Payments", icon: "💳" },
    { id: "account", label: "Account Access", icon: "🔐" },
    { id: "feature", label: "Feature Request", icon: "✨" },
    { id: "assessment", label: "Assessment Help", icon: "📊" },
    { id: "coaching", label: "Coaching Support", icon: "🎯" },
    { id: "other", label: "Other", icon: "💬" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In production, this would send to your support system
      console.log("Support request submitted:", formData);
      
      setSubmitSuccess(true);
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "",
        message: "",
        priority: "normal"
      });
    } catch {
      setSubmitError("Failed to submit request. Please try again or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#c9a227]/20 mb-4">
          <LifeBuoy className="w-8 h-8 text-[#c9a227]" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">
          Contact Support
        </h1>
        <p className="text-[#7b6b8d] dark:text-[#e8e4f0] mt-2 max-w-2xl mx-auto">
          We&apos;re here to help. Choose the best way to reach us below, or fill out the form and we&apos;ll get back to you within 24 hours.
        </p>
      </div>

      {/* Quick Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#1a2b4a]/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-[#1a2b4a] dark:text-[#F8F5F0]" />
            </div>
            <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">Email Us</h3>
            <p className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0] mb-3">
              Best for detailed questions
            </p>
            <a 
              href="mailto:support@lifecharter.architecture"
              className="text-[#c9a227] hover:underline font-medium"
            >
              support@lifecharter.architecture
            </a>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#7b6b8d]/10 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-6 h-6 text-[#7b6b8d] dark:text-[#e8e4f0]" />
            </div>
            <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">Live Chat</h3>
            <p className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0] mb-3">
              Quick questions during business hours
            </p>
            <Button variant="outline" size="sm" onClick={() => alert("Live chat coming soon!")}>
              Start Chat
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#c9a227]/10 flex items-center justify-center mx-auto mb-4">
              <Video className="w-6 h-6 text-[#c9a227]" />
            </div>
            <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">Schedule a Call</h3>
            <p className="text-sm text-[#7b6b8d] dark:text-[#e8e4f0] mb-3">
              For VIP members or complex issues
            </p>
            <Button variant="outline" size="sm" onClick={() => alert("Scheduling coming soon!")}>
              Book Time
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Response Time Banner */}
      <div className="bg-gradient-to-r from-[#1a2b4a] to-[#7b6b8d] rounded-xl p-6 text-[#F8F5F0]">
        <div className="flex items-center gap-4">
          <Clock className="w-8 h-8 text-[#c9a227]" />
          <div>
            <h3 className="font-semibold text-lg">Our Commitment to You</h3>
            <p className="text-[#e8e4f0]">
              We respond to all inquiries within 24 hours during business days (Monday-Friday, 9am-5pm MT). 
              VIP members receive priority support with 4-hour response times.
            </p>
          </div>
        </div>
      </div>

      {/* Support Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
            Submit a Support Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submitSuccess ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
                Request Submitted!
              </h3>
              <p className="text-[#7b6b8d] dark:text-[#e8e4f0] mb-6">
                We&apos;ve received your message and will respond within 24 hours. 
                A confirmation email has been sent to your inbox.
              </p>
              <Button onClick={() => setSubmitSuccess(false)}>
                Submit Another Request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-600">{submitError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
                    Your Name *
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Seraphina Rose"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
                    Email Address *
                  </label>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1A1A2E] text-[#1a2b4a] dark:text-[#F8F5F0] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50"
                  >
                    <option value="">Select a category...</option>
                    {supportCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1A1A2E] text-[#1a2b4a] dark:text-[#F8F5F0] focus:outline-none focus:ring-2 focus:ring-[#c9a227]/50"
                  >
                    <option value="low">🟢 Low - General question</option>
                    <option value="normal">🟡 Normal - Need help soon</option>
                    <option value="high">🔴 High - Blocking my work</option>
                    <option value="urgent">🚨 Urgent - Critical issue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
                  Subject *
                </label>
                <Input
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
                  Message *
                </label>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, or specific questions you have."
                />
                <p className="text-xs text-[#b8a898] mt-2">
                  Tip: The more details you provide, the faster we can help you.
                </p>
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-[#b8a898]">
                  * Required fields
                </p>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-[#1a2b4a] dark:text-[#F8F5F0]">
            Before You Reach Out
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Check These First
              </h4>
              <ul className="space-y-2 text-[#7b6b8d] dark:text-[#e8e4f0]">
                <li>• Try refreshing your browser</li>
                <li>• Clear your browser cache</li>
                <li>• Check your internet connection</li>
                <li>• Try logging out and back in</li>
                <li>• Visit our <a href="/help/12-domain-alignment" className="text-[#c9a227] hover:underline">Help Center</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-3 flex items-center gap-2">
                <Phone className="w-5 h-5 text-[#c9a227]" />
                Emergency Contact
              </h4>
              <p className="text-[#7b6b8d] dark:text-[#e8e4f0] mb-2">
                For urgent issues that cannot wait:
              </p>
              <p className="text-[#1a2b4a] dark:text-[#F8F5F0] font-medium">
                VIP Members: Text &quot;URGENT&quot; to (555) 123-4567
              </p>
              <p className="text-xs text-[#b8a898] mt-2">
                Available 24/7 for VIP members only
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Office Hours */}
      <div className="text-center py-8 border-t border-[#1a2b4a]/10">
        <h3 className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-4">
          Our Support Hours
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="p-4 bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/10 rounded-lg">
            <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Monday - Friday</p>
            <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">9:00 AM - 5:00 PM MT</p>
          </div>
          <div className="p-4 bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/10 rounded-lg">
            <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Saturday</p>
            <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">Email only</p>
          </div>
          <div className="p-4 bg-[#1a2b4a]/5 dark:bg-[#e8e4f0]/10 rounded-lg">
            <p className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">Sunday</p>
            <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">Closed</p>
          </div>
        </div>
        <p className="text-sm text-[#b8a898] mt-4">
          Based in Denver, CO • Mountain Time (UTC-7)
        </p>
      </div>
    </div>
  );
}
