"use client";

import { motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

export function AppLayout({ children, title, subtitle, className }: AppLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="flex h-screen">
        <Sidebar />
        
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar title={title} subtitle={subtitle} />
          
          <main className={cn("flex-1 overflow-auto", className)}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}