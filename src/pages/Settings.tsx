import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Brain,
  Save,
  Loader2
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { TradingCard, TradingCardContent, TradingCardHeader, TradingCardTitle } from "@/components/ui/trading-card";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserSettings {
  display_name: string;
  trading_experience: string;
  trading_style: string;
  risk_level: string;
  analysis_depth: string;
  remember_patterns: boolean;
  context_window: string;
}

export default function Settings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    display_name: '',
    trading_experience: 'Intermediate',
    trading_style: 'Day Trading',
    risk_level: 'Moderate',
    analysis_depth: 'Standard',
    remember_patterns: true,
    context_window: 'Last 30 trades'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to load existing settings
      const { data: userSettings, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (userSettings) {
        setSettings({
          display_name: userSettings.display_name || user.email?.split('@')[0] || '',
          trading_experience: userSettings.trading_experience || 'Intermediate',
          trading_style: userSettings.trading_style || 'Day Trading',
          risk_level: userSettings.risk_level || 'Moderate',
          analysis_depth: userSettings.analysis_depth || 'Standard',
          remember_patterns: userSettings.remember_patterns ?? true,
          context_window: userSettings.context_window || 'Last 30 trades'
        });
      } else {
        // Set default display name from email
        setSettings(prev => ({
          ...prev,
          display_name: user.email?.split('@')[0] || ''
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully",
      });

      // Trigger a page refresh to update sidebar
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const settingSections = [
    {
      title: "Profile & Preferences",
      icon: User,
      settings: [
        {
          label: "Display Name",
          type: "input",
          key: "display_name",
          description: "Your name as it appears in the interface"
        },
        {
          label: "Trading Experience Level",
          type: "select",
          key: "trading_experience",
          options: ["Beginner", "Intermediate", "Advanced", "Professional"],
          description: "Helps tailor analysis complexity to your skill level"
        },
        {
          label: "Primary Trading Style",
          type: "select",
          key: "trading_style",
          options: ["Scalping", "Day Trading", "Swing Trading", "Position Trading"],
          description: "Influences risk management and timeframe suggestions"
        },
        {
          label: "Preferred Risk Level",
          type: "select",
          key: "risk_level",
          options: ["Conservative", "Moderate", "Aggressive"],
          description: "Default risk parameters for trade analysis"
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
          key: "analysis_depth",
          options: ["Quick", "Standard", "Comprehensive"],
          description: "Controls detail level and processing time for AI analysis"
        },
        {
          label: "Remember Trading Patterns",
          type: "toggle",
          key: "remember_patterns",
          description: "AI learns from your trades to provide personalized insights"
        },
        {
          label: "Context Window",
          type: "select",
          key: "context_window",
          options: ["Last 10 trades", "Last 30 trades", "Last 100 trades", "All trades"],
          description: "How much trading history AI considers for pattern recognition"
        }
      ]
    }
  ];

  const renderSetting = (setting: any) => {
    const currentValue = settings[setting.key as keyof UserSettings];
    
    switch (setting.type) {
      case "input":
        return (
          <input
            type="text"
            value={currentValue as string || ''}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
            className="p-2 rounded-lg bg-input border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={setting.label}
          />
        );
      
      case "select":
        return (
          <select 
            value={currentValue as string}
            onChange={(e) => updateSetting(setting.key, e.target.value)}
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
              checked={currentValue as boolean}
              onChange={(e) => updateSetting(setting.key, e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout title="Settings" subtitle="Preferences & memory">
          <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

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
          <Button 
            variant="default" 
            size="lg"
            onClick={saveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </AppLayout>
    </ProtectedRoute>
  );
}