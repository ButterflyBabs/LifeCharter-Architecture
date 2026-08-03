/**
 * Avatar Upload Component
 * Handles profile picture upload to Supabase Storage
 */

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { User, Upload, X, Loader2 } from "lucide-react";

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onAvatarChange: (url: string | null) => void;
  userId: string;
}

export function AvatarUpload({ currentAvatar, onAvatarChange }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setError(null);
    setIsUploading(true);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "upload failed");
      }
      onAvatarChange(data.url);
      setPreviewUrl(data.url);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image. Please try again.");
      setPreviewUrl(currentAvatar || null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!previewUrl) return;
    setIsUploading(true);
    try {
      await fetch("/api/profile/avatar", { method: "DELETE" });
      onAvatarChange(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error("Remove error:", err);
      setError("Failed to remove image");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex items-center gap-6">
      {/* Avatar Preview */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-[#c9a227]/20 flex items-center justify-center border-2 border-[#c9a227]/30">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 text-[#c9a227]" />
          )}
        </div>
        
        {/* Remove button (if has avatar) */}
        {previewUrl && !isUploading && (
          <button
            onClick={handleRemove}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Remove photo"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Uploading overlay */}
        {isUploading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Upload Controls */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={triggerFileInput}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {previewUrl ? "Change Photo" : "Upload Photo"}
          </Button>
        </div>

        <p className="text-xs text-[#b8a898] mt-2">
          Recommended: 400x400px, JPG or PNG, max 5MB
        </p>

        {error && (
          <p className="text-xs text-red-500 mt-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
