import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X, Loader2, Eye, EyeOff, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  dismissible?: boolean;
}

export function AuthModal({ isOpen, onClose, dismissible = true }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showEmailSent, setShowEmailSent] = useState(false);
  const { signUp, signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (isSignUp && password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          // Handle specific signup errors
          if (error.message?.includes("already registered")) {
            toast.error("Account already exists", {
              description: "Please try signing in instead, or use a different email address."
            });
            // Switch to sign in mode
            setIsSignUp(false);
          } else {
            toast.error("Failed to create account", {
              description: error.message
            });
          }
        } else {
          toast.success("Account created!", {
            description: "Please check your email to confirm your account before signing in."
          });
          setShowEmailSent(true);
          setIsSignUp(false); // Switch to sign in mode
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message?.includes("Email not confirmed")) {
            toast.error("Email not confirmed", {
              description: "Please check your email and click the confirmation link first."
            });
          } else if (error.message?.includes("Invalid login credentials")) {
            toast.error("Invalid credentials", {
              description: "Please check your email and password, or sign up if you don't have an account."
            });
          } else {
            toast.error("Failed to sign in", {
              description: error.message
            });
          }
        } else {
          toast.success("Welcome back!");
          onClose();
        }
      }
    } catch (error) {
      toast.error("An error occurred", {
        description: "Please try again or contact support if the issue persists."
      });
    }
    
    setIsLoading(false);
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setIsLoading(false);
    setShowPassword(false);
    setIsSignUp(false);
    setShowEmailSent(false);
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
          onClick={dismissible ? handleClose : undefined}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-xl"
        >
          {/* Close button */}
          {dismissible && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                {showEmailSent ? (
                  <Mail className="h-6 w-6 text-primary" />
                ) : (
                  <User className="h-6 w-6 text-primary" />
                )}
              </div>
              <h2 className="text-2xl font-semibold">
                {showEmailSent 
                  ? "Check Your Email" 
                  : isSignUp ? "Create Account" : "Welcome Back"
                }
              </h2>
              <p className="text-muted-foreground">
                {showEmailSent 
                  ? "We've sent a confirmation link to your email. Please click it, then sign in below."
                  : isSignUp 
                    ? "Sign up to start using TradeCopilot"
                    : "Sign in to your TradeCopilot account"
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !email || !password || (isSignUp && !confirmPassword)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </>
                ) : (
                  isSignUp ? "Create Account" : "Sign In"
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setShowEmailSent(false);
                  }}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  {isSignUp 
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}