"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

// Color palette for avatar fallbacks
const AVATAR_COLORS = ["#FF8750", "#6EBF4E", "#BEE5FF", "#F3E5F5", "#FFE3CC", "#B9E88A"];

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

interface UserAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  showOnlineIndicator?: boolean;
  isOnline?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

export function UserAvatar({
  name,
  size = "md",
  showOnlineIndicator = false,
  isOnline = false,
  className = "",
}: UserAvatarProps) {
  const { user } = useAuth();

  // Get avatar URL from multiple sources
  const avatarUrl = useMemo(() => {
    // If the name matches the current authenticated user, use their avatar
    // Google OAuth uses 'picture', other providers might use 'avatar_url'
    if (user?.user_metadata?.full_name === name) {
      const avatar = user.user_metadata.picture || user.user_metadata.avatar_url;
      if (avatar) return avatar;
    }

    // Check localStorage for anonymous user profile
    if (typeof window !== "undefined") {
      const userProfile = localStorage.getItem("userProfile");
      if (userProfile) {
        try {
          const profile = JSON.parse(userProfile);
          if (profile.name === name && profile.image) {
            return profile.image;
          }
        } catch {
          // Ignore parse errors
        }
      }
    }

    return null;
  }, [name, user]);

  const initials = name[0]?.toUpperCase() || "?";
  const bgColor = getAvatarColor(name);

  return (
    <div className="relative">
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        {avatarUrl && (
          <AvatarImage
            src={avatarUrl}
            alt={name}
            referrerPolicy="no-referrer"
          />
        )}
        <AvatarFallback
          style={{ backgroundColor: bgColor }}
          className={`text-white font-semibold ${textSizeClasses[size]}`}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      {showOnlineIndicator && isOnline && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
      )}
    </div>
  );
}

// Hook to get avatar URL for a specific name
export function useAvatarUrl(name: string): string | null {
  const { user } = useAuth();

  return useMemo(() => {
    // If the name matches the current authenticated user
    if (user?.user_metadata?.full_name === name) {
      const avatar = user.user_metadata.picture || user.user_metadata.avatar_url;
      if (avatar) return avatar;
    }

    // Check localStorage
    if (typeof window !== "undefined") {
      const userProfile = localStorage.getItem("userProfile");
      if (userProfile) {
        try {
          const profile = JSON.parse(userProfile);
          if (profile.name === name && profile.image) {
            return profile.image;
          }
        } catch {
          // Ignore
        }
      }
    }

    return null;
  }, [name, user]);
}

// Export color function for backward compatibility
export { getAvatarColor, AVATAR_COLORS };
