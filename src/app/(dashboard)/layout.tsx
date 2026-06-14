"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  ArrowLeftRight, 
  FileUp, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Search,
  Plus
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Groups", href: "/groups", icon: Users },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Settlements", href: "/settlements", icon: ArrowLeftRight },
  { name: "Import Center", href: "/import", icon: FileUp },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation Rail */}
      <motion.aside 
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-surface/50 backdrop-blur-xl border-r border-border flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-purple flex items-center justify-center">
              <span className="text-white font-bold text-lg leading-none">S</span>
            </div>
            <span className="font-semibold tracking-tight text-lg">SplitWise Pro</span>
          </div>
          <button className="ml-auto md:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-2 mt-4 flex-1">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative overflow-hidden ${
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="sidebar-active" 
                      className="absolute inset-0 bg-surface-active rounded-lg z-0" 
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-3 w-full">
                    <item.icon size={18} className={isActive ? "text-accent-light" : "group-hover:text-foreground transition-colors"} />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-4 mt-auto">
          {user && (
            <div className="mb-4 px-2 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-surface-active border border-border flex items-center justify-center text-sm font-semibold text-accent-light">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-danger transition-colors rounded-lg hover:bg-danger/10"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 min-h-screen flex flex-col md:pl-[260px]">
        {/* Top Command Bar */}
        <header className="h-16 border-b border-border bg-background/50 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-muted-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface rounded-md border border-border w-64 focus-within:border-accent transition-colors">
              <Search size={16} className="text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search everywhere..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground text-foreground"
              />
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono bg-background px-1.5 py-0.5 rounded border border-border">
                <span>⌘</span><span>K</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/expenses/new" 
              className="hidden sm:flex items-center gap-2 bg-foreground text-background px-3 py-1.5 rounded-full text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              <Plus size={16} />
              New Expense
            </Link>
          </div>
        </header>

        <div className="p-4 sm:p-8 flex-1 max-w-7xl mx-auto w-full relative">
          <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-accent/5 to-transparent pointer-events-none -z-10" />
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
