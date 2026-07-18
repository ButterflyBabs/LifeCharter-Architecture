"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import {
  Star,
  Video,
  Mic,
  MessageSquare,
  CheckCircle,
  Upload,
  Camera,
  Sparkles
} from "lucide-react";

export default function ReviewCollectionPage() {
  const [step, setStep] = useState(1);
  const [reviewType, setReviewType] = useState<"text" | "video" | "audio">("text");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    program: "",
    testimonial: "",
    headline: "",
    consent: false
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const programs = [
    "LifeCharter Circle",
    "LifeCharter Incubator",
    "1:1 Coaching with Babs",
    "Alignment Workshop",
    "Other"
  ];

  const handleSubmit = () => {
    // Handle submission
    setIsSubmitted(true);
  };

  const renderStars = (count: number, interactive = false) => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={`transition-transform ${interactive ? "hover:scale-110" : ""}`}
            disabled={!interactive}
          >
            <Star
              className={`w-10 h-10 ${
                star <= (interactive ? hoverRating || rating : count)
                  ? "fill-[#D4AF63] text-[#D4AF63]"
                  : "text-[#B9A9A9]"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1F315B] to-[#5E3B6C] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-3">
            Thank You!
          </h1>
          <p className="text-[#B9A9A9] mb-6">
            Your testimonial has been submitted successfully. Your story will help 
            others discover the power of LifeCharter.
          </p>
          <div className="bg-[#D4AF63]/10 rounded-lg p-4 mb-6">
            <Heart className="w-6 h-6 text-[#D4AF63] mx-auto mb-2" />
            <p className="text-sm text-[#5E3B6C] dark:text-[#CDBED6]">
              We appreciate you taking the time to share your experience!
            </p>
          </div>
          <Button className="w-full">
            Return to Website
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F1E8] to-[#DAD2B9] dark:from-[#1A1A2E] dark:to-[#1F315B] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#D4AF63]/20 flex items-center justify-center mx-auto mb-4">
            <Quote className="w-8 h-8 text-[#D4AF63]" />
          </div>
          <h1 className="text-3xl font-bold text-[#1F315B] dark:text-[#F6F1E8] mb-2">
            Share Your Story
          </h1>
          <p className="text-[#B9A9A9]">
            Your testimonial helps others discover LifeCharter
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      step >= s
                        ? "bg-[#D4AF63] text-[#1F315B]"
                        : "bg-[#1F315B]/10 text-[#B9A9A9]"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        step > s ? "bg-[#D4AF63]" : "bg-[#1F315B]/10"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Choose Format */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[#1F315B] dark:text-[#F6F1E8] text-center">
                  How would you like to share your experience?
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      setReviewType("text");
                      setStep(2);
                    }}
                    className={`p-6 rounded-xl border-2 transition-all text-center ${
                      reviewType === "text"
                        ? "border-[#D4AF63] bg-[#D4AF63]/10"
                        : "border-[#1F315B]/20 hover:border-[#D4AF63]/50"
                    }`}
                  >
                    <MessageSquare className="w-10 h-10 text-[#D4AF63] mx-auto mb-3" />
                    <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-1">
                      Written Review
                    </h3>
                    <p className="text-sm text-[#B9A9A9]">
                      Share your thoughts in writing
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setReviewType("video");
                      setStep(2);
                    }}
                    className={`p-6 rounded-xl border-2 transition-all text-center ${
                      reviewType === "video"
                        ? "border-[#D4AF63] bg-[#D4AF63]/10"
                        : "border-[#1F315B]/20 hover:border-[#D4AF63]/50"
                    }`}
                  >
                    <Video className="w-10 h-10 text-[#2E7C83] mx-auto mb-3" />
                    <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-1">
                      Video Testimonial
                    </h3>
                    <p className="text-sm text-[#B9A9A9]">
                      Record a video message
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setReviewType("audio");
                      setStep(2);
                    }}
                    className={`p-6 rounded-xl border-2 transition-all text-center ${
                      reviewType === "audio"
                        ? "border-[#D4AF63] bg-[#D4AF63]/10"
                        : "border-[#1F315B]/20 hover:border-[#D4AF63]/50"
                    }`}
                  >
                    <Mic className="w-10 h-10 text-[#5E3B6C] mx-auto mb-3" />
                    <h3 className="font-semibold text-[#1F315B] dark:text-[#F6F1E8] mb-1">
                      Audio Message
                    </h3>
                    <p className="text-sm text-[#B9A9A9]">
                      Record your voice only
                    </p>
                  </button>
                </div>

                <div className="bg-[#1F315B]/5 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[#D4AF63] mt-0.5" />
                    <div>
                      <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-1">
                        Tips for a great testimonial
                      </h4>
                      <ul className="text-sm text-[#B9A9A9] space-y-1">
                        <li>• Be specific about your transformation</li>
                        <li>• Mention the program or service you used</li>
                        <li>• Share results you have achieved</li>
                        <li>• Keep it authentic and from the heart</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Rating & Basic Info */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[#1F315B] dark:text-[#F6F1E8] text-center">
                  How would you rate your experience?
                </h2>

                <div className="flex justify-center py-4">
                  {renderStars(0, true)}
                </div>

                {rating > 0 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div>
                      <label className="text-sm text-[#B9A9A9] mb-2 block">Your Name</label>
                      <Input
                        placeholder="e.g., Jane Smith"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-[#B9A9A9] mb-2 block">Email</label>
                      <Input
                        type="email"
                        placeholder="jane@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-[#B9A9A9] mb-2 block">Which program did you participate in?</label>
                      <select
                        className="w-full p-3 rounded-lg border border-[#1F315B]/20 bg-white dark:bg-[#1F315B] text-[#1F315B] dark:text-[#F6F1E8]"
                        value={formData.program}
                        onChange={(e) => setFormData({...formData, program: e.target.value})}
                      >
                        <option value="">Select a program...</option>
                        {programs.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                        Back
                      </Button>
                      <Button 
                        onClick={() => setStep(3)} 
                        className="flex-1"
                        disabled={!formData.name || !formData.email || !formData.program}
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Testimonial Content */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-[#1F315B] dark:text-[#F6F1E8] text-center">
                  Share your experience
                </h2>

                {/* Text Review */}
                {reviewType === "text" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[#B9A9A9] mb-2 block">
                        Headline (Optional)
                      </label>
                      <Input
                        placeholder="e.g., LifeCharter Changed Everything"
                        value={formData.headline}
                        onChange={(e) => setFormData({...formData, headline: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[#B9A9A9] mb-2 block">
                        Your Testimonial
                      </label>
                      <Textarea
                        placeholder="Tell us about your experience with LifeCharter. What challenges were you facing? What results have you achieved? How has your life or business changed?"
                        value={formData.testimonial}
                        onChange={(e) => setFormData({...formData, testimonial: e.target.value})}
                        className="min-h-[200px]"
                      />
                    </div>
                  </div>
                )}

                {/* Video Review */}
                {reviewType === "video" && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-[#1F315B]/20 rounded-xl p-8 text-center">
                      {isRecording ? (
                        <div className="space-y-4">
                          <div className="w-20 h-20 rounded-full bg-red-500 animate-pulse flex items-center justify-center mx-auto">
                            <Video className="w-10 h-10 text-white" />
                          </div>
                          <p className="text-red-500 font-medium">Recording...</p>
                          <Button onClick={() => setIsRecording(false)} variant="outline">
                            Stop Recording
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Camera className="w-16 h-16 text-[#B9A9A9] mx-auto" />
                          <p className="text-[#1F315B] dark:text-[#F6F1E8] font-medium">
                            Record your video testimonial
                          </p>
                          <p className="text-sm text-[#B9A9A9]">
                            2-3 minutes is perfect. Speak from the heart!
                          </p>
                          <div className="flex gap-2 justify-center">
                            <Button onClick={() => setIsRecording(true)}>
                              <Camera className="w-4 h-4 mr-2" />
                              Start Recording
                            </Button>
                            <Button variant="outline">
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Video
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="bg-[#1F315B]/5 rounded-lg p-4">
                      <h4 className="font-medium text-[#1F315B] dark:text-[#F6F1E8] mb-2">
                        Suggested talking points:
                      </h4>
                      <ul className="text-sm text-[#B9A9A9] space-y-1">
                        <li>• What was your situation before LifeCharter?</li>
                        <li>• What specific results have you achieved?</li>
                        <li>• What would you tell someone considering LifeCharter?</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Audio Review */}
                {reviewType === "audio" && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-[#1F315B]/20 rounded-xl p-8 text-center">
                      {isRecording ? (
                        <div className="space-y-4">
                          <div className="w-20 h-20 rounded-full bg-red-500 animate-pulse flex items-center justify-center mx-auto">
                            <Mic className="w-10 h-10 text-white" />
                          </div>
                          <p className="text-red-500 font-medium">Recording...</p>
                          <Button onClick={() => setIsRecording(false)} variant="outline">
                            Stop Recording
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Mic className="w-16 h-16 text-[#B9A9A9] mx-auto" />
                          <p className="text-[#1F315B] dark:text-[#F6F1E8] font-medium">
                            Record your audio testimonial
                          </p>
                          <p className="text-sm text-[#B9A9A9]">
                            1-2 minutes is perfect. Just speak naturally!
                          </p>
                          <Button onClick={() => setIsRecording(true)}>
                            <Mic className="w-4 h-4 mr-2" />
                            Start Recording
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Consent */}
                <div className="flex items-start gap-3 p-4 bg-[#1F315B]/5 rounded-lg">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={formData.consent}
                    onChange={(e) => setFormData({...formData, consent: e.target.checked})}
                    className="mt-1"
                  />
                  <label htmlFor="consent" className="text-sm text-[#5E3B6C] dark:text-[#CDBED6]">
                    I give permission for LifeCharter to use my testimonial in marketing materials, 
                    including website, social media, and email campaigns. I understand my name and 
                    photo may be displayed alongside my testimonial.
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    className="flex-1"
                    disabled={reviewType === "text" ? !formData.testimonial || !formData.consent : !formData.consent}
                  >
                    Submit Testimonial
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-[#B9A9A9] mt-8">
          Questions? Contact us at support@lifecharter.architecture
        </p>
      </div>
    </div>
  );
}
