// React 18 JSX transform

import { 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar, 
  CreditCard, 
  Zap, 
  Clock, 
  Key, 
  X, 
  Sparkles, 
  Cpu, 
  Layers,
  Award,
  Database,
  ArrowUpRight
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
}

export default function UserProfileModal({ isOpen, onClose, username = 'user01' }: UserProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-[0_0_50px_rgba(0,255,204,0.15)] flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-primary to-emerald-400 shadow-[0_0_12px_#00ffcc]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60 select-none">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/40 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(0,255,204,0.25)]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">User Account Profile</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Verified Subscriber
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">ID: ACC-2026-USR01 • {username.toUpperCase()}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-muted border border-transparent hover:border-border transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-foreground">
          
          {/* User Account Info Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-card/50 border border-border/70 shadow-inner">
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block">Full Name</span>
              <p className="text-white font-medium text-sm flex items-center space-x-1.5">
                <span>Enterprise User (Admin)</span>
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block">Username</span>
              <p className="text-primary font-mono font-medium text-sm">@{username}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block">Account Email</span>
              <p className="text-gray-300 font-mono text-xs truncate">user01@enterprise-agent.io</p>
            </div>
          </div>

          {/* Package Details Section */}
          <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-card to-[#09151c] p-5 shadow-[0_0_20px_rgba(0,255,204,0.08)] relative overflow-hidden">
            {/* Background Decorative Emblem */}
            <div className="absolute -right-4 -bottom-4 text-primary/5 pointer-events-none">
              <Award className="w-36 h-36" />
            </div>

            <div className="flex items-start justify-between relative z-10 mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-[11px] uppercase tracking-wider font-bold text-primary">Current Subscription Package</span>
                </div>
                <h3 className="text-xl font-extrabold text-white mt-1 tracking-tight">
                  AI Agent Enterprise Pro Package
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  แพ็กเกจระดับองค์กร • สิทธิ์การใช้งานระบบประมวลผล AI Agent และ Pipeline อัตโนมัติเต็มรูปแบบ
                </p>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active • ชำระเงินแล้ว</span>
                </span>
                <p className="text-[11px] text-muted-foreground font-mono mt-1">รอบบิล: รายปี (Annual Plan)</p>
              </div>
            </div>

            {/* Package Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/60 relative z-10">
              <div className="p-2.5 rounded-lg bg-card/60 border border-border/40">
                <div className="flex items-center space-x-1.5 text-muted-foreground text-[10px] uppercase font-semibold mb-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Start Date</span>
                </div>
                <p className="text-xs font-mono font-medium text-white">15 Jan 2026</p>
              </div>

              <div className="p-2.5 rounded-lg bg-card/60 border border-border/40">
                <div className="flex items-center space-x-1.5 text-muted-foreground text-[10px] uppercase font-semibold mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Expiry Date</span>
                </div>
                <p className="text-xs font-mono font-medium text-amber-400">15 Jan 2027</p>
                <span className="text-[9px] text-muted-foreground">(เหลืออีก 108 วัน)</span>
              </div>

              <div className="p-2.5 rounded-lg bg-card/60 border border-border/40">
                <div className="flex items-center space-x-1.5 text-muted-foreground text-[10px] uppercase font-semibold mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Amount Paid</span>
                </div>
                <p className="text-xs font-mono font-bold text-white">฿ 48,000 / ปี</p>
                <span className="text-[9px] text-emerald-400 font-mono">Invoice #INV-9821</span>
              </div>

              <div className="p-2.5 rounded-lg bg-card/60 border border-border/40">
                <div className="flex items-center space-x-1.5 text-muted-foreground text-[10px] uppercase font-semibold mb-1">
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  <span>License Key</span>
                </div>
                <p className="text-[11px] font-mono font-semibold text-primary truncate" title="LIC-LG3-9984-7721-ENT">
                  LIC-LG3-9984-ENT
                </p>
              </div>
            </div>
          </div>

          {/* Quota and Usage Limits */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-primary" />
              <span>Package Quota & Resources (โควตาสิทธิการใช้งาน)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Workflows Quota */}
              <div className="p-3.5 rounded-xl bg-card/50 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Workflows Creation</span>
                  </span>
                  <span className="font-mono font-bold text-primary">Unlimited (ไม่จำกัด)</span>
                </div>
                <div className="w-full bg-card h-1.5 rounded-full overflow-hidden border border-border/40">
                  <div className="bg-primary h-full w-full" />
                </div>
                <p className="text-[10px] text-muted-foreground">สร้างและจัดเก็บ Workflow ได้ไม่จำกัดจำนวนโปรเจกต์</p>
              </div>

              {/* Monthly AI Executions */}
              <div className="p-3.5 rounded-xl bg-card/50 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center space-x-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI Execution Runs / Month</span>
                  </span>
                  <span className="font-mono font-bold text-white">8,450 / 50,000</span>
                </div>
                <div className="w-full bg-card h-1.5 rounded-full overflow-hidden border border-border/40">
                  <div className="bg-gradient-to-r from-primary to-cyan-400 h-full w-[17%]" />
                </div>
                <p className="text-[10px] text-muted-foreground">เหลือโควตา 41,550 รัน สำหรับรอบเดือนนี้</p>
              </div>

              {/* Concurrency */}
              <div className="p-3.5 rounded-xl bg-card/50 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Concurrent Pipelines</span>
                  </span>
                  <span className="font-mono font-bold text-white">10 Simultaneous</span>
                </div>
                <p className="text-[10px] text-muted-foreground">รันประมวลผลหลาย Workflow ขนานกันได้สูงสุด 10 สายงาน</p>
              </div>

              {/* AI Models Access */}
              <div className="p-3.5 rounded-xl bg-card/50 border border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center space-x-1.5">
                    <Database className="w-3.5 h-3.5 text-purple-400" />
                    <span>Unlocked AI Models</span>
                  </span>
                  <span className="font-mono font-bold text-emerald-400">All Tiers (GPT-4o, Claude 3.5, Gemini Pro)</span>
                </div>
                <p className="text-[10px] text-muted-foreground">ปลดล็อกทุกโมเดลระดับสูงและ Local LLMs</p>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-card/70">
          <span className="text-[11px] text-muted-foreground font-mono flex items-center space-x-1">
            <span>Server Cluster:</span>
            <span className="text-primary">SG-AP-NORTH-01 [99.98% SLA]</span>
          </span>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer shadow-xs"
            >
              Close
            </button>
            <button
              onClick={() => {
                alert("ระบบต่ออายุแพ็กเกจกำลังเชื่อมต่อไปยัง Payment Gateway...");
              }}
              className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-xs transition-colors cursor-pointer"
            >
              <span>Manage Subscription</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
