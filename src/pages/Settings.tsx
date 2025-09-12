import { useState } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Bell, 
  Shield, 
  Database,
  Palette,
  Brain,
  Download,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { TradingCard, TradingCardContent, TradingCardHeader, TradingCardTitle } from "@/components/ui/trading-card";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function Settings() {
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [notifications, setNotifications] = useState({
    tradeAlerts: true,
    analysisComplete: true,
    weeklyReports: false,
  });

  const settingSections = [
    {
      title: "Profile & Preferences",
      icon: User,
      settings: [
        {
          label: "Display Name",
          type: "input",
          value: "Alex Thompson",
          description: "Your name as it appears in the interface"
        },
        {
          label: "Trading Experience Level",
          type: "select",
          value: "Professional",
          options: ["Beginner", "Intermediate", "Advanced", "Professional"],
          description: "Helps tailor analysis complexity"
        },
        {
          label: "Primary Trading Style",
          type: "select", 
          value: "Swing Trading",
          options: ["Scalping", "Day Trading", "Swing Trading", "Position Trading"],
          description: "Influences risk management suggestions"
        },
        {
          label: "Preferred Risk Level",
          type: "select",
          value: "Moderate",
          options: ["Conservative", "Moderate", "Aggressive"],
          description: "Default risk parameters for analysis"
        }
      ]
    },
    {
      title: "Analysis & Memory",
      icon: Brain,
      settings: [
        {
          label: "Analysis Depth",
          type: "select",
          value: "Comprehensive",
          options: ["Quick", "Standard", "Comprehensive"],
          description: "Detail level in trade analysis"
        },
        {
          label: "Remember Trading Patterns",
          type: "toggle",
          value: true,
          description: "Learn from your past trades to improve suggestions"
        },
        {
          label: "Context Window",
          type: "select",
          value: "Last 30 trades",
          options: ["Last 10 trades", "Last 30 trades", "Last 100 trades", "All trades"],
          description: "How much trading history to consider"
        }
      ]
    },
    {
      title: "Notifications",
      icon: Bell,
      settings: [
        {
          label: "Trade Analysis Complete",
          type: "toggle",
          value: notifications.analysisComplete,
          key: "analysisComplete",
          description: "Notify when AI finishes analyzing your trades"
        },
        {
          label: "Risk Alert Notifications",
          type: "toggle", 
          value: notifications.tradeAlerts,
          key: "tradeAlerts",
          description: "Alerts for high-risk trade setups"
        },
        {
          label: "Weekly Performance Reports",
          type: "toggle",
          value: notifications.weeklyReports,
          key: "weeklyReports",
          description: "Summary of your trading performance"
        }
      ]
    },
    {
      title: "Data & Privacy",
      icon: Shield,
      settings: [
        {
          label: "Data Retention",
          type: "select",
          value: "1 year",
          options: ["3 months", "6 months", "1 year", "2 years", "Forever"],
          description: "How long to keep your trading data"
        },
        {
          label: "Anonymous Analytics",
          type: "toggle",
          value: true,
          description: "Help improve TradeCopilot with anonymous usage data"
        },
        {
          label: "Export Data",
          type: "action",
          action: "download",
          description: "Download all your trading data and analysis"
        },
        {
          label: "Delete All Data",
          type: "action", 
          action: "delete",
          description: "Permanently delete all your data from TradeCopilot",
          dangerous: true
        }
      ]
    }
  ];

  const handleNotificationToggle = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof notifications]
    }));
  };

  const renderSetting = (setting: any) => {
    switch (setting.type) {
      case "input":
        return (
          <input
            type="text"
            defaultValue={setting.value}
            className="p-2 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        );
      
      case "select":
        return (
          <select 
            defaultValue={setting.value}
            className="p-2 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {setting.options?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case "toggle":
        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={setting.key ? notifications[setting.key as keyof typeof notifications] : setting.value}
              onChange={() => setting.key && handleNotificationToggle(setting.key)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        );
      
      case "action":
        return (
          <Button
            variant={setting.dangerous ? "destructive" : "outline"}
            size="sm"
            className="w-fit"
          >
            {setting.action === "download" && <Download className="h-4 w-4 mr-2" />}
            {setting.action === "delete" && <Trash2 className="h-4 w-4 mr-2" />}
            {setting.label}
          </Button>
        );
      
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout 
        title="Settings" 
        subtitle="Preferences & memory"
      >
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {settingSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            <TradingCard>
              <TradingCardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <TradingCardTitle className="text-lg">{section.title}</TradingCardTitle>
                </div>
              </TradingCardHeader>
              
              <TradingCardContent>
                <div className="space-y-6">
                  {section.settings.map((setting, settingIndex) => (
                    <div key={settingIndex} className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium">{setting.label}</label>
                        {setting.description && (
                          <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        {renderSetting(setting)}
                      </div>
                    </div>
                  ))}
                </div>
              </TradingCardContent>
            </TradingCard>
          </motion.div>
        ))}

        {/* Save Changes Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-end"
        >
          <Button variant="premium" size="lg">
            Save Changes
          </Button>
        </motion.div>
      </div>
    </AppLayout>
    </ProtectedRoute>
  );
}