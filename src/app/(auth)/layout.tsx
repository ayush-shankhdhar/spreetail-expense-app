export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(108,92,231,0.08) 0%, var(--background) 70%)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">SplitWise Pro</h1>
          <p className="text-[var(--muted)] text-sm">Shared Expense Management</p>
        </div>
        {children}
      </div>
    </div>
  );
}
