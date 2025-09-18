"use client";

import { motion } from "framer-motion";
import { ChevronDown, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";
import { useState } from "react";
import { toast } from "sonner";

interface TopbarProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function Topbar({ title, subtitle, className }: TopbarProps) {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out", {
        description: error.message
      });
    } else {
      toast.success("Signed out successfully");
    }
  };

  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur px-6",
        className
      )}
    >
      {/* Left side - Page title */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>


      {/* Right side - User controls */}
      <div className="flex items-center gap-3">

        {/* User avatar */}
        {user ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <User className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAuthModal(true)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <User className="h-4 w-4" />
            Sign In
          </Button>
        )}
      </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </motion.div>
  );
}