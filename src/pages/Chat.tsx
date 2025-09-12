import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Mic, Send, BarChart3, Shield, Target, FileText } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { TradingCard, TradingCardContent, TradingCardHeader, TradingCardTitle } from "@/components/ui/trading-card";
import { Button } from "@/components/ui/button";

const analysisOptions = [
  {
    icon: Upload,
    title: "Screenshot Analysis",
    description: "Upload charts, setups, or trade screenshots",
    action: "Upload Image"
  },
  {
    icon: Mic,
    title: "Voice Context",
    description: "Add spoken context to your analysis",
    action: "Record Voice"
  },
  {
    icon: BarChart3,
    title: "Structured Feedback",
    description: "Get organized insights and checklists",
    action: "Quick Analysis"
  },
  {
    icon: FileText,
    title: "Save as Trade",
    description: "Export analysis to your trade journal",
    action: "Save Trade"
  }
];

export default function Chat() {
  const [message, setMessage] = useState("");

  return (
    <AppLayout 
      title="Trade Analysis Chat" 
      subtitle="Upload screenshots of your trades, charts, or analysis, and I'll provide structured feedback with actionable insights."
    >
      <div className="flex h-full flex-col">
        {/* Welcome Section */}
        <div className="p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Welcome Card */}
            <TradingCard variant="premium" className="mb-8">
              <TradingCardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <TradingCardTitle className="text-xl">Welcome to TradeCopilot</TradingCardTitle>
                    <p className="text-muted-foreground">
                      I'm your AI trading assistant. Upload screenshots of your trades, charts, or analysis, and I'll provide structured feedback with actionable insights.
                    </p>
                  </div>
                </div>
              </TradingCardHeader>
            </TradingCard>

            {/* Analysis Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {analysisOptions.map((option, index) => (
                <motion.div
                  key={option.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TradingCard className="h-full hover:shadow-glow transition-all duration-200 cursor-pointer group">
                    <TradingCardContent className="p-4">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <option.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm mb-1">{option.title}</h3>
                          <p className="text-xs text-muted-foreground mb-3">{option.description}</p>
                          <Button size="sm" variant="outline" className="text-xs">
                            {option.action}
                          </Button>
                        </div>
                      </div>
                    </TradingCardContent>
                  </TradingCard>
                </motion.div>
              ))}
            </div>

            {/* Upload Area */}
            <TradingCard className="border-dashed border-2 border-border/50 hover:border-primary/50 transition-colors">
              <TradingCardContent className="p-12">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Drop your chart here or click to upload</h3>
                    <p className="text-muted-foreground">
                      PNG, JPG, or paste from clipboard • Max 10MB
                    </p>
                  </div>
                  <Button variant="premium" size="lg">
                    Choose File
                  </Button>
                </div>
              </TradingCardContent>
            </TradingCard>
          </motion.div>
        </div>

        {/* Chat Input Area */}
        <div className="mt-auto border-t border-border bg-background/80 backdrop-blur">
          <div className="max-w-4xl mx-auto p-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  placeholder="Add context about your trade setup, timeframe, strategy..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full min-h-[100px] p-4 rounded-2xl bg-input border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button variant="premium" size="lg" className="self-end">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="ghost" className="text-xs">
                📊 Analyze Chart
              </Button>
              <Button size="sm" variant="ghost" className="text-xs">
                🎯 Position Size
              </Button>
              <Button size="sm" variant="ghost" className="text-xs">
                ⚠️ Risk Check
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}