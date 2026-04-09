import { Link, Redirect } from "wouter";
import { Show } from "@clerk/react";
import { Shield, Lock, Cloud, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function Home() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/drive" />
      </Show>
      
      <Show when="signed-out">
        <div className="min-h-screen bg-background flex flex-col text-foreground overflow-hidden">
          <header className="h-20 px-6 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-accent" />
              <span className="font-bold text-xl tracking-tight">SafeDrive</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/sign-in">
                <Button variant="ghost" className="font-medium text-muted-foreground hover:text-foreground">Log in</Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-primary text-primary-foreground font-medium rounded-full px-6 hover:bg-primary/90 hover:scale-105 transition-all shadow-md">Get Started</Button>
              </Link>
            </div>
          </header>
          
          <main className="flex-1 flex flex-col items-center justify-center relative">
            <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
            
            <div className="max-w-5xl w-full px-6 py-20 flex flex-col items-center text-center relative z-10">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent font-medium text-sm mb-8 border border-accent/20">
                  <Lock className="w-4 h-4" />
                  Your private digital vault
                </div>
              </motion.div>
              
              <motion.h1 
                className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl text-primary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              >
                Your files are <span className="text-accent">always safe</span> and accessible anywhere.
              </motion.h1>
              
              <motion.p 
                className="text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              >
                SafeDrive provides calm, organized, and secure cloud storage for your most important photos, videos, and documents.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
              >
                <Link href="/sign-up">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-1 transition-all shadow-xl shadow-primary/20">
                    Create Your Vault
                  </Button>
                </Link>
              </motion.div>
            </div>
            
            <div className="max-w-6xl w-full px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              {[
                { icon: Shield, title: "Military-grade Security", desc: "Your files are encrypted and stored safely, ensuring only you have access to your digital life." },
                { icon: Cloud, title: "Access from Anywhere", desc: "Your entire vault is available on any device, syncing automatically without you having to think about it." },
                { icon: Zap, title: "Lightning Fast", desc: "Upload and download your largest files with incredible speed. We never compress your memories." }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 + i * 0.1, ease: "easeOut" }}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </main>
        </div>
      </Show>
    </>
  );
}
