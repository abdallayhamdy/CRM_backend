"use client"

import { ThemeSwitcher } from "@/components/ThemeSwitcher"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor, Check, Bell, Star, Users, DollarSign, TrendingUp } from "lucide-react"

const chartColor = (i: number) => `hsl(var(--chart-${i + 1}))`

const CHART_COLORS = [0, 1, 2, 3, 4]

export default function AppearancePage() {
  const { theme } = useTheme()

  return (
    <div className="flex gap-6 min-h-0">
      {/* Main Content — Preview */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-foreground">Preview</h2>
          <p className="text-sm text-muted-foreground">See how your settings look in real-time.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard icon={<Users className="h-4 w-4" />} label="Contacts" value="2,847" change="+12.5%" />
          <StatCard icon={<DollarSign className="h-4 w-4" />} label="Revenue" value="$48.2K" change="+8.3%" />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Growth" value="24.6%" change="+3.1%" />
        </div>

        {/* Charts Row — Bar + Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Bar Chart — uses chartColor 0-4 cycling */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Revenue</h3>
            <div className="flex items-end gap-2 h-32">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-sm transition-all duration-300"
                    style={{ height: `${h}%`, backgroundColor: chartColor(i % 5) }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"].map((m, i) => (
                <span key={i} className="flex-1 text-center text-[9px] text-muted-foreground">{m}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
              {["Product A", "Product B", "Product C", "Product D", "Product E"].map((label, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColor(i) }} />
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Donut Chart — uses chartColor 0-4 for segments */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Deal Stages</h3>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  {[
                    { pct: 35, offset: 0 },
                    { pct: 25, offset: 35 },
                    { pct: 20, offset: 60 },
                    { pct: 12, offset: 80 },
                    { pct: 8, offset: 92 },
                  ].map((seg, i) => (
                    <circle
                      key={i}
                      cx="18" cy="18" r="14"
                      fill="none"
                      stroke={chartColor(i)}
                      strokeWidth="5"
                      strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                      strokeDashoffset={`-${seg.offset}`}
                      className="transition-all duration-500"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">247</div>
                    <div className="text-[9px] text-muted-foreground">deals</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                {[
                  { label: "Prospecting", value: "35%", idx: 0 },
                  { label: "Negotiation", value: "25%", idx: 1 },
                  { label: "Proposal", value: "20%", idx: 2 },
                  { label: "Closed Won", value: "12%", idx: 3 },
                  { label: "Closed Lost", value: "8%", idx: 4 },
                ].map((item) => (
                  <div key={item.idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: chartColor(item.idx) }} />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="text-xs font-medium text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Bar Chart — uses chartColor 0-3 */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Team Performance</h3>
          <div className="space-y-3">
            {[
              { name: "Sarah Chen", deals: 42, max: 50 },
              { name: "Mike Johnson", deals: 38, max: 50 },
              { name: "Emily Davis", deals: 35, max: 50 },
              { name: "Alex Kim", deals: 28, max: 50 },
            ].map((person, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{person.name}</span>
                  <span className="text-xs text-muted-foreground">{person.deals} deals</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(person.deals / person.max) * 100}%`, backgroundColor: chartColor(i) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Area Chart + Radial Progress */}
        <div className="grid grid-cols-3 gap-3">
          {/* Area Chart — uses chartColor 0 and 1 */}
          <div className="col-span-2 rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Trend</h3>
            <div className="relative h-40">
              <svg viewBox="0 0 400 120" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={chartColor(0)} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={chartColor(0)} stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="areaGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={chartColor(1)} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={chartColor(1)} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3, 4].map((i) => (
                  <line key={i} x1="0" y1={i * 30} x2="400" y2={i * 30} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4,4" />
                ))}
                <path d="M0,100 C30,85 60,90 90,70 C120,50 150,60 180,45 C210,30 240,40 270,25 C300,10 330,20 360,15 L400,10 L400,120 L0,120 Z" fill="url(#areaGrad)" />
                <path d="M0,100 C30,85 60,90 90,70 C120,50 150,60 180,45 C210,30 240,40 270,25 C300,10 330,20 360,15 L400,10" fill="none" stroke={chartColor(0)} strokeWidth="2" />
                <path d="M0,110 C30,100 60,105 90,95 C120,85 150,90 180,80 C210,70 240,75 270,65 C300,55 330,60 360,50 L400,45 L400,120 L0,120 Z" fill="url(#areaGrad2)" />
                <path d="M0,110 C30,100 60,105 90,95 C120,85 150,90 180,80 C210,70 240,75 270,65 C300,55 330,60 360,50 L400,45" fill="none" stroke={chartColor(1)} strokeWidth="2" />
              </svg>
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[9px] text-muted-foreground -ml-1">
                <span>$100K</span><span>$75K</span><span>$50K</span><span>$25K</span><span>$0</span>
              </div>
            </div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColor(0) }} />
                <span className="text-[10px] text-muted-foreground">This Year</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColor(1) }} />
                <span className="text-[10px] text-muted-foreground">Last Year</span>
              </div>
            </div>
          </div>

          {/* Radial Progress — uses chartColor 0-2 */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">KPI Targets</h3>
            <div className="space-y-4">
              {[
                { label: "Revenue", value: 78, idx: 0 },
                { label: "Deals", value: 92, idx: 1 },
                { label: "Pipeline", value: 65, idx: 2 },
              ].map((item) => (
                <div key={item.idx} className="flex items-center gap-3">
                  <div className="relative w-10 h-10 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                      <circle
                        cx="18" cy="18" r="14" fill="none"
                        stroke={chartColor(item.idx)}
                        strokeWidth="4"
                        strokeDasharray={`${item.value} ${100 - item.value}`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-foreground">{item.value}%</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground">Target</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stacked Bar Chart — uses all 5 chartColor for stages */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">Deal Pipeline by Stage</h3>
          <div className="flex items-end gap-3 h-32">
            {[
              { label: "Q1", stages: [30, 25, 20, 15, 10] },
              { label: "Q2", stages: [25, 30, 22, 18, 5] },
              { label: "Q3", stages: [20, 20, 35, 15, 10] },
              { label: "Q4", stages: [15, 25, 25, 25, 10] },
            ].map((quarter, qi) => (
              <div key={qi} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col" style={{ height: "100px" }}>
                  {quarter.stages.map((pct, si) => (
                    <div
                      key={si}
                      className="w-full transition-all duration-500"
                      style={{
                        height: `${pct}%`,
                        backgroundColor: chartColor(si),
                        borderRadius: si === quarter.stages.length - 1 ? "0 0 4px 4px" : "0",
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{quarter.label}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border">
            {["Prospecting", "Negotiation", "Proposal", "Closed Won", "Closed Lost"].map((label, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColor(i) }} />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card Example */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">JD</div>
              <div>
                <div className="text-sm font-semibold text-foreground">John Doe</div>
                <div className="text-xs text-muted-foreground">Senior Engineer • Acme Corp</div>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-status-success/10 px-2.5 py-0.5 text-xs font-medium text-status-success">Active</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Experienced software engineer with expertise in building scalable web applications and leading cross-functional teams.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {["React", "TypeScript", "Node.js", "PostgreSQL"].map((tag) => (
              <span key={tag} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{tag}</span>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              <Check className="h-3 w-3" /> Assign
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">
              View Profile
            </button>
          </div>
        </div>

        {/* Table Preview */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Recent Deals</h3>
          </div>
          <div className="divide-y divide-border/50">
            {[
              { name: "Enterprise License", value: "$12,500", stage: "Negotiation", colorIdx: 1 },
              { name: "API Integration", value: "$8,200", stage: "Proposal", colorIdx: 2 },
              { name: "Consulting Pack", value: "$24,000", stage: "Closed Won", colorIdx: 3 },
            ].map((deal, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColor(deal.colorIdx) }} />
                  <div className="text-sm font-medium text-foreground">{deal.name}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">{deal.value}</span>
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{deal.stage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Examples */}
        <div className="space-y-2">
          <AlertExample icon={<Check className="h-4 w-4" />} title="Success" description="Deal has been closed successfully." color="bg-status-success/10 text-status-success border-status-success/20" />
          <AlertExample icon={<Bell className="h-4 w-4" />} title="Warning" description="Meeting scheduled in 15 minutes." color="bg-status-warning/10 text-status-warning border-status-warning/20" />
          <AlertExample icon={<Star className="h-4 w-4" />} title="Info" description="New features available in settings." color="bg-status-info/10 text-status-info border-status-info/20" />
        </div>
      </div>

      {/* Appearance Sidebar */}
      <div className="w-[320px] shrink-0">
        <ThemeSwitcher />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, change }: { icon: React.ReactNode; label: string; value: string; change: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">{icon}</div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-status-success font-medium">{change}</div>
    </div>
  )
}

function AlertExample({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${color}`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs opacity-80">{description}</div>
      </div>
    </div>
  )
}
