import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Filter, 
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Search,
  MoreHorizontal,
  Eye,
  ChevronDown,
  Trash2
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { TradingCard, TradingCardContent, TradingCardHeader, TradingCardTitle } from "@/components/ui/trading-card";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TradesAPI, type Trade } from "@/lib/trades";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { TradeDetailsModal } from "@/components/trade/TradeDetailsModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function History() {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [filter, setFilter] = useState("all");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    wins: 0,
    losses: 0,
    unknown: 0,
    winRate: 0,
    avgRR: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [instrumentFilter, setInstrumentFilter] = useState("all");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTrades();
    loadStats();
  }, []);

  const loadTrades = async () => {
    try {
      const tradesData = await TradesAPI.getAll();
      setTrades(tradesData);
    } catch (error) {
      console.error('Error loading trades:', error);
      toast({
        title: "Error",
        description: "Failed to load trades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await TradesAPI.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleViewDetails = (trade: Trade) => {
    setSelectedTrade(trade);
    setShowDetailsModal(true);
  };

  const handleTradeUpdate = (updatedTrade: Trade) => {
    setTrades(prev => prev.map(t => t.id === updatedTrade.id ? updatedTrade : t));
    loadStats(); // Refresh stats
  };

  const handleDeleteTrade = async () => {
    if (!tradeToDelete) return;
    
    try {
      await TradesAPI.delete(tradeToDelete.id);
      toast({
        title: "Trade deleted",
        description: "Trade has been successfully deleted",
      });
      loadTrades();
      loadStats();
    } catch (error) {
      console.error('Error deleting trade:', error);
      toast({
        title: "Error",
        description: "Failed to delete trade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setTradeToDelete(null);
    }
  };

  const openDeleteDialog = (trade: Trade) => {
    setTradeToDelete(trade);
    setShowDeleteDialog(true);
  };

  // Filter trades based on search and filters
  const filteredTrades = trades.filter(trade => {
    // Search by tags
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesTags = trade.tags?.some(tag => tag.toLowerCase().includes(query));
      const matchesInstrument = trade.instrument.toLowerCase().includes(query);
      const matchesNotes = trade.notes?.toLowerCase().includes(query);
      const matchesEntryPlan = trade.entry_plan?.toLowerCase().includes(query);
      
      if (!(matchesTags || matchesInstrument || matchesNotes || matchesEntryPlan)) {
        return false;
      }
    }

    // Filter by instrument
    if (instrumentFilter !== "all" && trade.instrument !== instrumentFilter) {
      return false;
    }

    // Filter by outcome
    if (outcomeFilter !== "all" && trade.outcome !== outcomeFilter) {
      return false;
    }

    return true;
  });

  // Get unique instruments for filter
  const uniqueInstruments = Array.from(new Set(trades.map(t => t.instrument))).sort();

  // Export functionality
  const handleExport = (format: 'csv' | 'json') => {
    if (filteredTrades.length === 0) {
      toast({
        title: "No data to export",
        description: "Please ensure you have trades to export",
        variant: "destructive",
      });
      return;
    }

    if (format === 'csv') {
      const headers = ['Date', 'Instrument', 'Direction', 'Outcome', 'R:R Ratio', 'Entry Plan', 'Tags', 'Notes'];
      const csvData = [
        headers.join(','),
        ...filteredTrades.map(trade => [
          new Date(trade.created_at).toLocaleDateString(),
          trade.instrument,
          trade.direction,
          trade.outcome === 'unknown' ? 'pending' : trade.outcome,
          trade.rr_numeric ? `1:${trade.rr_numeric.toFixed(1)}` : 'N/A',
          `"${trade.entry_plan || ''}"`,
          `"${trade.tags?.join(', ') || ''}"`,
          `"${trade.notes || ''}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trades-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const jsonData = JSON.stringify(filteredTrades, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trades-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast({
      title: "Export successful",
      description: `Exported ${filteredTrades.length} trades as ${format.toUpperCase()}`,
    });
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case "win":
        return "text-success";
      case "loss":
        return "text-danger";
      case "unknown":
        return "text-warning";
      default:
        return "text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  const getDirectionIcon = (direction: string) => {
    return direction === "long" ? (
      <TrendingUp className="h-4 w-4 text-success" />
    ) : (
      <TrendingDown className="h-4 w-4 text-danger" />
    );
  };

  return (
    <ProtectedRoute>
      <AppLayout 
        title="Trade History" 
        subtitle={`${stats.total} trades analyzed`}
      >
      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <TradingCard variant="gradient">
            <TradingCardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Trades</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </TradingCardContent>
          </TradingCard>
          
          <TradingCard variant="gradient">
            <TradingCardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</p>
                </div>
              </div>
            </TradingCardContent>
          </TradingCard>
          
          <TradingCard variant="gradient">
            <TradingCardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg R:R</p>
                  <p className="text-2xl font-bold">1:{stats.avgRR.toFixed(1)}</p>
                </div>
              </div>
            </TradingCardContent>
          </TradingCard>
          
          <TradingCard variant="gradient">
            <TradingCardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.unknown}</p>
                </div>
              </div>
            </TradingCardContent>
          </TradingCard>
        </motion.div>

        {/* Filters and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
        >
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-input">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <select className="bg-transparent text-sm focus:outline-none">
                <option value="30">Last 30 days</option>
                <option value="7">Last 7 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2 p-3 rounded-lg bg-input">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select 
                value={instrumentFilter} 
                onChange={(e) => setInstrumentFilter(e.target.value)}
                className="bg-transparent text-sm focus:outline-none"
              >
                <option value="all">All Instruments</option>
                {uniqueInstruments.map(instrument => (
                  <option key={instrument} value={instrument}>{instrument}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-input">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select 
                value={outcomeFilter} 
                onChange={(e) => setOutcomeFilter(e.target.value)}
                className="bg-transparent text-sm focus:outline-none"
              >
                <option value="all">All Outcomes</option>
                <option value="win">Wins</option>
                <option value="loss">Losses</option>
                <option value="unknown">Pending</option>
              </select>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-input">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search trades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm focus:outline-none w-32"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              Cards
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}  
              size="sm"
              onClick={() => setViewMode("table")}
            >
              Table
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </motion.div>

        {/* Recent Trades Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Trades</h2>
          <p className="text-sm text-muted-foreground">Showing {filteredTrades.length} of {trades.length} results</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!loading && trades.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No trades yet</h3>
            <p className="text-muted-foreground mb-4">Start analyzing trades to build your history</p>
            <Button onClick={() => window.location.href = '/'}>
              Start Trading Analysis
            </Button>
          </div>
        )}

        {/* No Filtered Results */}
        {!loading && trades.length > 0 && filteredTrades.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No matching trades</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your filters or search query</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery("");
                setInstrumentFilter("all");
                setOutcomeFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* Trades Grid/Table */}
        {!loading && filteredTrades.length > 0 && (
          <>
            {viewMode === "cards" ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredTrades.map((trade, index) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <TradingCard className="hover:shadow-glow transition-all duration-200">
                  <TradingCardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getDirectionIcon(trade.direction)}
                        <div>
                          <TradingCardTitle className="text-base">{trade.instrument}</TradingCardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{formatDate(trade.created_at)}</span>
                            <span>•</span>
                            <span>{formatTime(trade.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.outcome === "win" ? "bg-success/20 text-success" :
                        trade.outcome === "loss" ? "bg-danger/20 text-danger" :
                        "bg-warning/20 text-warning"
                      }`}>
                        {trade.outcome === "unknown" ? "PENDING" : trade.outcome.toUpperCase()}
                      </div>
                    </div>
                  </TradingCardHeader>
                  
                  <TradingCardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Direction</span>
                          <div className={`font-medium ${
                            trade.direction === "long" ? "text-success" : "text-danger"
                          }`}>
                            {trade.direction.toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">R:R Ratio</span>
                          <div className="font-medium">
                            {trade.rr_numeric ? `1:${trade.rr_numeric.toFixed(1)}` : "N/A"}
                          </div>
                        </div>
                      </div>

                      {trade.entry_plan && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Entry Plan</span>
                          <div className="mt-1 text-sm line-clamp-2">{trade.entry_plan}</div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Status: <span className={getOutcomeColor(trade.outcome)}>
                            {trade.outcome === "unknown" ? "pending" : trade.outcome}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewDetails(trade)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openDeleteDialog(trade)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {trade.tags && trade.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {trade.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-secondary/50 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {trade.timeframes && trade.timeframes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-muted-foreground mr-2">Timeframes:</span>
                          {trade.timeframes.map((tf) => (
                            <span
                              key={tf}
                              className="px-1.5 py-0.5 bg-primary/10 text-xs rounded"
                            >
                              {tf}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </TradingCardContent>
                </TradingCard>
              </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="border rounded-lg"
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Instrument</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>R:R Ratio</TableHead>
                      <TableHead>Entry Plan</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell className="text-sm">
                          {formatDate(trade.created_at)}
                          <div className="text-xs text-muted-foreground">
                            {formatTime(trade.created_at)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{trade.instrument}</TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1 ${
                            trade.direction === 'long' ? 'text-success' : 'text-danger'
                          }`}>
                            {getDirectionIcon(trade.direction)}
                            {trade.direction.toUpperCase()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            trade.outcome === 'win' ? 'default' :
                            trade.outcome === 'loss' ? 'destructive' : 'secondary'
                          }>
                            {trade.outcome === 'unknown' ? 'PENDING' : trade.outcome.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {trade.rr_numeric ? `1:${trade.rr_numeric.toFixed(1)}` : 'N/A'}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm line-clamp-2">
                            {trade.entry_plan || 'No entry plan'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {trade.tags?.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {trade.tags && trade.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{trade.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(trade)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDeleteDialog(trade)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </motion.div>
            )}
          </>
        )}

        {/* Trade Details Modal */}
        {selectedTrade && (
          <TradeDetailsModal
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            trade={selectedTrade}
            onTradeUpdate={handleTradeUpdate}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Trade</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this trade? This action cannot be undone.
                {tradeToDelete && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <strong>{tradeToDelete.instrument}</strong> - {tradeToDelete.direction.toUpperCase()} - {formatDate(tradeToDelete.created_at)}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteTrade}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete Trade
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
    </ProtectedRoute>
  );
}