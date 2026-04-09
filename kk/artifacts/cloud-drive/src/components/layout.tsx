import { Link } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { Shield, LogOut, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-90 transition-opacity">
          <Shield className="w-6 h-6 text-accent" />
          <span className="font-bold text-lg tracking-tight">SafeDrive</span>
        </Link>
        
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline-block">{user.fullName || user.emailAddresses[0]?.emailAddress}</span>
            </span>
            <Button variant="ghost" size="icon" onClick={() => signOut()} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </header>
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>
    </div>
  );
}
