import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { signInWithEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    const { error } = await signInWithEmail(email);
    
    if (error) {
      toast.error("Failed to send magic link", {
        description: error.message
      });
    } else {
      setEmailSent(true);
      toast.success("Magic link sent!", {
        description: "Check your email for the login link"
      });
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    setEmail("");
    setEmailSent(false);
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-xl"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Welcome to TradeCopilot</h2>
              <p className="text-muted-foreground">
                {emailSent 
                  ? "Check your email for the magic link" 
                  : "Sign in with your email to continue"
                }
              </p>
            </div>

            {!emailSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending magic link...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send magic link
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="h-16 w-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-muted-foreground">
                  We've sent a magic link to <strong>{email}</strong>. 
                  Click the link in your email to sign in.
                </p>
                <Button variant="outline" onClick={handleClose} className="w-full">
                  Close
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}