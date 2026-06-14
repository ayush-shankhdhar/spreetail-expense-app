import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SplitWise Pro | Authentication",
  description: "Secure login for your financial workspace.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-accent-purple/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-96 bg-gradient-to-t from-background via-background to-transparent pointer-events-none z-10" />

      <div className="relative z-20 w-full max-w-md mx-auto px-4">
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-accent-purple flex items-center justify-center mx-auto mb-6 shadow-xl shadow-accent/20">
            <span className="text-white font-bold text-2xl leading-none">S</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground">SplitWise Pro</h1>
          <p className="text-muted-foreground text-sm">Enterprise-grade shared expense resolution</p>
        </div>
        {children}
      </div>
    </div>
  );
}
