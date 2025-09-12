"use client";

import { motion } from "framer-motion";
import { ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TopbarProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function Topbar({ title, subtitle, className }: TopbarProps) {
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

      {/* Center - Model selector (future) */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">GPT-4 Vision</span>
        <span className="text-xs text-primary">•</span>
        <span className="text-xs text-muted-foreground">Real-time</span>
      </div>

      {/* Right side - User controls */}
      <div className="flex items-center gap-3">
        {/* Future model selector */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <span className="text-sm">Advanced Model</span>
          <ChevronDown className="h-3 w-3" />
        </Button>

        {/* User avatar */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <User className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}