/**
 * Avatar Upload Component
 * Handles profile picture upload to Supabase Storage
 */

"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { User, Upload, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onAvatarChange: (url: string | null) => void;
  userId: string;
}

export function AvatarUpload({ currentAvatar, onAvatarChange, userId }: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
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

    try {
      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Check if avatars bucket exists, create if not
      const { data: buckets } = await supabase.storage.listBuckets();
      const avatarsBucket = buckets?.find(b => b.name === "avatars");
      
      if (!avatarsBucket) {
        await supabase.storage.createBucket("avatars", {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp"]
        });
      }

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile in database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      onAvatarChange(publicUrl);
      setPreviewUrl(publicUrl);

    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload image. Please try again.");
      setPreviewUrl(currentAvatar || null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    if (!previewUrl) return;

    setIsUploading(true);

    try {
      // Extract file path from URL
      const urlParts = previewUrl.split("/");
      const filePath = `avatars/${urlParts[urlParts.length - 1]}`;

      // Delete from storage
      await supabase.storage
        .from("avatars")
        .remove([filePath]);

      // Update profile
      await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

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
        <div className="w-24 h-24 rounded-full overflow-hidden bg-[#D4AF63]/20 flex items-center justify-center border-2 border-[#D4AF63]/30">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 text-[#D4AF63]" />
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

        <p className="text-xs text-[#B9A9A9] mt-2">
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
