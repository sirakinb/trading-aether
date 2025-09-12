"use client";

import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  MessageSquare, 
  History, 
  Settings, 
  TrendingUp,
  ChevronLeft,
  ChevronRight 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: "Chat Analysis",
    href: "/",
    icon: MessageSquare,
    description: "Upload & analyze trades",
  },
  {
    name: "Trade History",
    href: "/history",
    icon: History,
    description: "Review past analyses",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Preferences & memory",
  },
];

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <motion.div 
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className={cn(
        "flex h-full flex-col bg-sidebar border-r border-sidebar-border",
        collapsed ? "w-16" : "w-64",
        "transition-all duration-300 ease-in-out",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-sidebar-foreground">TradeCopilot</h1>
              <p className="text-xs text-sidebar-foreground/60">AI Trading Assistant</p>
            </div>
          </motion.div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const active = isActive(item.href);
          
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                "hover:bg-sidebar-accent",
                active && "bg-sidebar-primary text-sidebar-primary-foreground",
                !active && "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                collapsed && "justify-center"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0")} />
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col"
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs opacity-60">{item.description}</span>
                </motion.div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Recent Analysis Section */}
      {!collapsed && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 border-t border-sidebar-border"
        >
          <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-3">
            Recent Analysis
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-2 rounded-lg bg-sidebar-accent/50">
              <div className="font-medium text-sidebar-foreground">EURUSD Analysis</div>
              <div className="text-sidebar-foreground/60">Strong support at 1.0850 level...</div>
              <div className="text-sidebar-foreground/40 mt-1">2m ago</div>
            </div>
            <div className="p-2 rounded-lg bg-sidebar-accent/50">
              <div className="font-medium text-sidebar-foreground">BTCUSD Swing</div>
              <div className="text-sidebar-foreground/60">Breakout pattern confirmed...</div>
              <div className="text-sidebar-foreground/40 mt-1">1h ago</div>
            </div>
            <div className="p-2 rounded-lg bg-sidebar-accent/50">
              <div className="font-medium text-sidebar-foreground">SPY Options</div>
              <div className="text-sidebar-foreground/60">Risk management suggestions...</div>
              <div className="text-sidebar-foreground/40 mt-1">3h ago</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/30",
          collapsed && "justify-center"
        )}>
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-foreground">AT</span>
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col"
            >
              <span className="text-sm font-medium text-sidebar-foreground">Alex Thompson</span>
              <span className="text-xs text-sidebar-foreground/60">Pro Trader</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}