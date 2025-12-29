import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Download, RefreshCw, Hash, DollarSign, BarChart3, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { getProjects, getKeywords, formatVolume } from "@/lib/keywordApi";
import { KeywordProject, KeywordData } from "@/types";

type SortField = 'keyword' | 'monthlyVolume' | 'rank' | 'cpc' | 'competition';
type SortDirection = 'asc' | 'desc';

interface KeywordsPanelProps {
  onTestKeyword?: (keyword: string) => void;
}

export function KeywordsPanel({ onTestKeyword }: KeywordsPanelProps) {
  const [projects, setProjects] = useState<KeywordProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>('monthlyVolume');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Load projects on mount
  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      try {
        const data = await getProjects();
        setProjects(data);
        // Auto-select CEEK if available
        const ceek = data.find(p => p.name.toLowerCase().includes('ceek'));
        if (ceek) {
          setSelectedProject(ceek.id);
        }
      } catch (error) {
        toast.error("Failed to load projects");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  // Load keywords when project changes
  useEffect(() => {
    if (!selectedProject) {
      setKeywords([]);
      return;
    }

    async function loadKeywords() {
      setLoadingKeywords(true);
      try {
        const data = await getKeywords(selectedProject);
        setKeywords(data);
      } catch (error) {
        toast.error("Failed to load keywords");
        console.error(error);
      } finally {
        setLoadingKeywords(false);
      }
    }
    loadKeywords();
  }, [selectedProject]);

  // Filter and sort keywords
  const filteredKeywords = useMemo(() => {
    let result = keywords;
    
    // Filter by search
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(k => k.keyword.toLowerCase().includes(lower));
    }
    
    // Sort
    result = [...result].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'keyword') {
        return sortDirection === 'asc' 
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      }
      
      if (sortField === 'competition') {
        const order = { low: 1, medium: 2, high: 3 };
        aVal = order[aVal as 'low' | 'medium' | 'high'] || 0;
        bVal = order[bVal as 'low' | 'medium' | 'high'] || 0;
      }
      
      aVal = aVal ?? Infinity;
      bVal = bVal ?? Infinity;
      
      return sortDirection === 'asc' 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
    
    return result.slice(0, 100); // Show first 100
  }, [keywords, search, sortField, sortDirection]);

  // Summary stats
  const stats = useMemo(() => {
    const totalVolume = keywords.reduce((sum, k) => sum + k.monthlyVolume, 0);
    const rankedKeywords = keywords.filter(k => k.rank !== null && k.rank > 0);
    const avgRank = rankedKeywords.length > 0 
      ? rankedKeywords.reduce((sum, k) => sum + (k.rank || 0), 0) / rankedKeywords.length
      : null;
    
    return {
      total: keywords.length,
      totalVolume,
      avgRank,
      ranking: rankedKeywords.length,
    };
  }, [keywords]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleExport = () => {
    if (keywords.length === 0) {
      toast.error("No keywords to export");
      return;
    }

    const headers = ['Keyword', 'Monthly Volume', 'Annual Volume', 'Rank', 'CPC', 'Competition'];
    const rows = keywords.map(k => [
      k.keyword,
      k.monthlyVolume,
      k.annualVolume,
      k.rank ?? 'N/A',
      k.cpc.toFixed(2),
      k.competition,
    ].join(','));
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${selectedProject}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Exported keywords to CSV");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 animate-fade-in">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">Keyword.com</p>
        <h3 className="text-2xl mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Keyword Tracking
        </h3>

        {/* Project Selector */}
        <div className="flex items-center gap-4">
          <Select value={selectedProject} onValueChange={setSelectedProject} disabled={loading}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a project..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.keywordCount} keywords)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => selectedProject && setSelectedProject(selectedProject)}
            disabled={!selectedProject || loadingKeywords}
          >
            <RefreshCw className={`w-4 h-4 ${loadingKeywords ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={keywords.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {selectedProject && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
          <Card className="p-4 bg-secondary/30 border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Hash className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Total Keywords</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-secondary/30 border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Monthly Volume</p>
                <p className="text-2xl font-semibold">{formatVolume(stats.totalVolume)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-secondary/30 border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Avg Rank</p>
                <p className="text-2xl font-semibold">
                  {stats.avgRank ? stats.avgRank.toFixed(1) : 'N/A'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-secondary/30 border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Keywords Ranking</p>
                <p className="text-2xl font-semibold">{stats.ranking}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Keywords Table */}
      {selectedProject && (
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          {/* Search */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Showing {filteredKeywords.length} of {keywords.length}
            </p>
          </div>

          {loadingKeywords ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => handleSort('keyword')}
                    >
                      Keyword {sortField === 'keyword' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-secondary/50"
                      onClick={() => handleSort('monthlyVolume')}
                    >
                      Monthly Vol {sortField === 'monthlyVolume' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-right">Annual Vol</TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-secondary/50"
                      onClick={() => handleSort('rank')}
                    >
                      Rank {sortField === 'rank' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-secondary/50"
                      onClick={() => handleSort('cpc')}
                    >
                      CPC {sortField === 'cpc' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-secondary/50"
                      onClick={() => handleSort('competition')}
                    >
                      Competition {sortField === 'competition' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    {onTestKeyword && <TableHead className="w-24">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKeywords.map((kw) => (
                    <TableRow key={kw.id}>
                      <TableCell className="font-medium">{kw.keyword}</TableCell>
                      <TableCell className="text-right">{formatVolume(kw.monthlyVolume)}</TableCell>
                      <TableCell className="text-right">{formatVolume(kw.annualVolume)}</TableCell>
                      <TableCell className="text-right">
                        {kw.rank !== null ? (
                          <span className={kw.rank <= 10 ? 'text-green-500' : kw.rank <= 30 ? 'text-yellow-500' : ''}>
                            {kw.rank}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">${kw.cpc.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={kw.competition === 'high' ? 'destructive' : kw.competition === 'medium' ? 'secondary' : 'outline'}
                        >
                          {kw.competition}
                        </Badge>
                      </TableCell>
                      {onTestKeyword && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onTestKeyword(kw.keyword)}
                            className="h-8 px-2 text-xs"
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Test AI
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {filteredKeywords.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={onTestKeyword ? 7 : 6} className="text-center text-muted-foreground py-8">
                        {search ? 'No keywords match your search' : 'No keywords found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {!selectedProject && !loading && (
        <div className="glass-card p-12 text-center animate-fade-in">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Select a project to view keyword tracking data
          </p>
        </div>
      )}
    </div>
  );
}
