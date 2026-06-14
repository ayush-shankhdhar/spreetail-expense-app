"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Users, Plus, ChevronRight, X, UserMinus, UserPlus, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Group {
  id: string;
  name: string;
  createdAt: string;
  members: { user: { id: string; name: string }; joinDate: string; leaveDate: string | null }[];
  _count: { expenses: number };
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchGroups = () => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then((data) => setGroups(data.groups || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGroupName }),
      });
      if (res.ok) {
        setNewGroupName("");
        setShowCreate(false);
        fetchGroups();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Active Groups</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage workspaces and flatmates</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="w-full sm:w-auto">
          <Plus size={18} className="mr-2" />
          New Group
        </Button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowCreate(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md"
              >
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold tracking-tight">Create Workspace</h2>
                    <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleCreateGroup} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Workspace Name</label>
                      <input
                        className="input"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="e.g., Goa Trip 2026"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-3 justify-end mt-6">
                      <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" isLoading={creating} disabled={!newGroupName.trim()}>
                        Create
                      </Button>
                    </div>
                  </form>
                </Card>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : groups.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 border-dashed border-2 bg-transparent text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
            <Users size={28} className="text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold tracking-tight mb-2">No active groups</h3>
          <p className="text-muted-foreground max-w-sm mb-6">Create your first group to start inviting members and tracking shared expenses.</p>
          <Button onClick={() => setShowCreate(true)}>Create Group</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {groups.map((group) => (
            <motion.div key={group.id} variants={itemVariants}>
              <Link href={`/groups/${group.id}`} className="block h-full">
                <Card hoverEffect className="h-full flex flex-col p-6 group cursor-pointer transition-all duration-300">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-semibold text-lg tracking-tight group-hover:text-accent transition-colors">{group.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Clock size={12} />
                        Created {formatDate(group.createdAt)}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-surface-active flex items-center justify-center text-muted-foreground group-hover:bg-accent group-hover:text-background transition-colors">
                      <ChevronRight size={16} />
                    </div>
                  </div>

                  {/* Overlapping Avatars */}
                  <div className="flex items-center mb-6">
                    <div className="flex -space-x-3 relative z-10">
                      {group.members.slice(0, 5).map((m, i) => (
                        <div 
                          key={m.user.id} 
                          className="w-10 h-10 rounded-full border-2 border-surface bg-surface-hover flex items-center justify-center text-sm font-bold shadow-sm relative"
                          style={{ zIndex: 10 - i }}
                          title={m.user.name}
                        >
                          <span className={m.leaveDate ? "opacity-50" : "text-foreground"}>
                            {m.user.name.charAt(0).toUpperCase()}
                          </span>
                          {/* Dot indicator for status */}
                          <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface ${m.leaveDate ? 'bg-muted' : 'bg-success'}`}></div>
                        </div>
                      ))}
                      {group.members.length > 5 && (
                        <div className="w-10 h-10 rounded-full border-2 border-surface bg-background flex items-center justify-center text-xs font-semibold shadow-sm z-0 text-muted-foreground">
                          +{group.members.length - 5}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 text-sm font-medium text-muted-foreground">
                      {group.members.filter(m => !m.leaveDate).length} active
                    </div>
                  </div>

                  <div className="mt-auto">
                    {/* Membership Timeline Snippet */}
                    <div className="bg-background/50 rounded-lg p-3 text-xs border border-border/50">
                      <div className="font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Users size={12} /> Recent Activity
                      </div>
                      <div className="space-y-2">
                        {group.members.slice().sort((a,b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()).slice(0, 2).map(m => (
                          <div key={`join-${m.user.id}`} className="flex items-center gap-2 text-muted-foreground">
                            <UserPlus size={12} className="text-success" />
                            <span><span className="text-foreground font-medium">{m.user.name}</span> joined {formatDate(m.joinDate)}</span>
                          </div>
                        ))}
                        {group.members.filter(m => m.leaveDate).map(m => (
                          <div key={`leave-${m.user.id}`} className="flex items-center gap-2 text-muted-foreground">
                            <UserMinus size={12} className="text-warning" />
                            <span><span className="text-foreground font-medium">{m.user.name}</span> left {formatDate(m.leaveDate!)}</span>
                          </div>
                        )).slice(0, 1)}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
