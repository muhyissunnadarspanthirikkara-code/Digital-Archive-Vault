import { SignIn, SignUp } from "@clerk/react";
import { Shield } from "lucide-react";
import { Link } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      
      <div className="absolute top-6 left-6 z-10">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Shield className="w-6 h-6 text-accent" />
          <span className="font-bold text-lg">SafeDrive</span>
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <SignIn 
          routing="path" 
          path={`${basePath}/sign-in`} 
          signUpUrl={`${basePath}/sign-up`}
          appearance={{
            elements: {
              rootBox: "mx-auto w-full max-w-md",
              card: "bg-card border border-border shadow-xl rounded-2xl",
              headerTitle: "text-2xl font-bold text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "border-border text-foreground hover:bg-muted/50",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
              formFieldLabel: "text-foreground font-medium",
              formFieldInput: "bg-background border-border text-foreground rounded-lg focus:ring-ring",
              formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-10",
              footerActionText: "text-muted-foreground",
              footerActionLink: "text-accent hover:text-accent/80 font-medium"
            }
          }}
        />
      </div>
    </div>
  );
}

export function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      
      <div className="absolute top-6 left-6 z-10">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <Shield className="w-6 h-6 text-accent" />
          <span className="font-bold text-lg">SafeDrive</span>
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <SignUp 
          routing="path" 
          path={`${basePath}/sign-up`} 
          signInUrl={`${basePath}/sign-in`}
          appearance={{
            elements: {
              rootBox: "mx-auto w-full max-w-md",
              card: "bg-card border border-border shadow-xl rounded-2xl",
              headerTitle: "text-2xl font-bold text-foreground",
              headerSubtitle: "text-muted-foreground",
              socialButtonsBlockButton: "border-border text-foreground hover:bg-muted/50",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
              formFieldLabel: "text-foreground font-medium",
              formFieldInput: "bg-background border-border text-foreground rounded-lg focus:ring-ring",
              formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-10",
              footerActionText: "text-muted-foreground",
              footerActionLink: "text-accent hover:text-accent/80 font-medium"
            }
          }}
        />
      </div>
    </div>
  );
}
