import { cn } from "@/lib/utils";
import { 
  MessageSquare, 
  FileText, 
  Download,
  BarChart3,
  GitCompare,
  History
} from "lucide-react";
import ceekLogo from "@/assets/ceek-logo.png";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'ask', label: 'Ask a LLM', icon: MessageSquare },
  { id: 'responses', label: 'Check Responses', icon: FileText },
  { id: 'export', label: 'Export', icon: Download },
  { id: 'nlp', label: 'Analyse NLP', icon: BarChart3 },
  { id: 'compare', label: 'Compare Models', icon: GitCompare },
  { id: 'history', label: 'Usage/Diagnostics', icon: History },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
      {/* CEEK Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <img src={ceekLogo} alt="CEEK" className="h-6 mb-3 brightness-0 invert opacity-90" />
        <p className="text-xs text-sidebar-foreground/50 tracking-widest uppercase">
          AI Brand Visibility
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <li key={tab.id}>
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-primary" 
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-[10px] text-sidebar-foreground/40 text-center tracking-wider uppercase">
          Powered by CEEK
        </p>
      </div>
    </aside>
  );
}
