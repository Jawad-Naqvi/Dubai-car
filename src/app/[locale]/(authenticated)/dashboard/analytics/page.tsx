import { DashboardHeader } from "@/components/dashboard/header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Eye, MessageCircle, TrendingUp, Clock } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <>
      <DashboardHeader title="Analytics" subtitle="Last 30 days · Across all listings" />

      <main className="p-5 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Eye, label: "Total views", value: "58,420", delta: "+22%" },
            { icon: MessageCircle, label: "Leads generated", value: "412", delta: "+15%" },
            { icon: TrendingUp, label: "Conversion rate", value: "7.1%", delta: "+0.4pp" },
            { icon: Clock, label: "Avg response time", value: "3m 42s", delta: "-18%" },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-lg bg-white border border-[#E5E5E5] shadow-card p-5"
            >
              <k.icon className="h-5 w-5 text-[#C8A93E]" />
              <div className="mt-4 text-base font-bold">{k.value}</div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-xs text-muted">{k.label}</div>
                <div className="text-xs text-[#C8A93E]">{k.delta}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart placeholder */}
        <div className="rounded-xl bg-white border border-[#E5E5E5] shadow-card p-4">
          <Eyebrow tone="gold">VIEWS & LEADS TREND</Eyebrow>
          <h3 className="mt-3 text-xs font-semibold">Last 30 days</h3>
          <div className="mt-6 h-64 relative">
            <svg viewBox="0 0 600 200" className="w-full h-full">
              <defs>
                <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C8A93E" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#C8A93E" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C8A93E" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#C8A93E" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,130 C50,120 80,95 130,105 C190,118 250,80 300,72 C360,65 410,90 470,75 C530,62 580,55 600,42 L600,200 L0,200 Z"
                fill="url(#vg)"
              />
              <path
                d="M0,130 C50,120 80,95 130,105 C190,118 250,80 300,72 C360,65 410,90 470,75 C530,62 580,55 600,42"
                stroke="#C8A93E"
                strokeWidth="2"
                fill="none"
              />
              <path
                d="M0,170 C50,165 90,160 140,155 C200,150 260,145 320,140 C380,135 430,135 480,130 C530,125 570,123 600,120 L600,200 L0,200 Z"
                fill="url(#lg)"
              />
              <path
                d="M0,170 C50,165 90,160 140,155 C200,150 260,145 320,140 C380,135 430,135 480,130 C530,125 570,123 600,120"
                stroke="#C8A93E"
                strokeWidth="2"
                fill="none"
              />
            </svg>
            <div className="absolute top-2 left-2 flex gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#C8A93E]" />
                Views
              </span>
              <span className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-[#C8A93E]" />
                Leads
              </span>
            </div>
          </div>
        </div>

        {/* Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            {
              title: "By emirate",
              items: [
                { label: "Dubai", value: 62 },
                { label: "Abu Dhabi", value: 22 },
                { label: "Sharjah", value: 11 },
                { label: "Other", value: 5 },
              ],
            },
            {
              title: "By channel",
              items: [
                { label: "WhatsApp", value: 58 },
                { label: "Call", value: 27 },
                { label: "Message", value: 15 },
              ],
            },
            {
              title: "By body type",
              items: [
                { label: "SUV", value: 71 },
                { label: "Sedan", value: 12 },
                { label: "Coupe", value: 9 },
                { label: "Other", value: 8 },
              ],
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-xl bg-white border border-[#E5E5E5] shadow-card p-4"
            >
              <h3 className="font-semibold">{card.title}</h3>
              <div className="mt-5 space-y-3">
                {card.items.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-secondary">{item.label}</span>
                      <span className="text-[#1A1A1A] font-semibold">{item.value}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#F4F4F4] overflow-hidden">
                      <div
                        className="h-full bg-[#C8A93E]"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
