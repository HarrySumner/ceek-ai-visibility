import { cn } from "@/lib/utils";
import { 
  MessageSquare, 
  FileText, 
  Download,
  BarChart3,
  GitCompare,
  History,
  Eye
} from "lucide-react";

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
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Eye className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
              Brand Ceeker
            </h1>
            <p className="text-xs text-sidebar-foreground/60">AI Visibility Tracker</p>
          </div>
        </div>
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
        <p className="text-xs text-sidebar-foreground/50 text-center">
          Powered by Lovable AI
        </p>
      </div>
    </aside>
  );
}
