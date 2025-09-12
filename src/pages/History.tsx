import { useState } from "react";
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
  ChevronDown
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { TradingCard, TradingCardContent, TradingCardHeader, TradingCardTitle } from "@/components/ui/trading-card";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Mock data for trade history
const trades = [
  {
    id: 1,
    pair: "EURUSD",
    direction: "LONG",
    outcome: "WIN",
    date: "Dec 15, 2023",
    time: "14:30",
    riskReward: "1:2.4",
    entry: "1.0850",
    exit: "1.0920",
    pnl: "+$2,400",
    tags: ["Support Break", "Fibonacci", "Swing Trade"],
    confidence: 8
  },
  {
    id: 2,
    pair: "BTCUSD",
    direction: "SHORT",
    outcome: "LOSS", 
    date: "Dec 14, 2023",
    time: "09:15",
    riskReward: "1:3.0",
    entry: "42,150",
    exit: "42,350",
    pnl: "-$1,000",
    tags: ["Resistance", "Scalp"],
    confidence: 6
  },
  {
    id: 3,
    pair: "GBPJPY",
    direction: "LONG",
    outcome: "WIN",
    date: "Dec 13, 2023", 
    time: "16:45",
    riskReward: "1:1.8",
    entry: "185.40",
    exit: "186.20",
    pnl: "+$1,800",
    tags: ["Breakout", "Momentum"],
    confidence: 9
  },
  {
    id: 4,
    pair: "AUDUSD",
    direction: "SHORT",
    outcome: "OPEN",
    date: "Dec 12, 2023",
    time: "11:20",
    riskReward: "1:2.5",
    entry: "0.6720",
    exit: "0.6715",
    pnl: "Current: +$50",
    tags: ["Trend Follow", "Daily TF"],
    confidence: 7
  },
  {
    id: 5,
    pair: "GOLD",
    direction: "LONG", 
    outcome: "WIN",
    date: "Dec 11, 2023",
    time: "08:30",
    riskReward: "1:4.2",
    entry: "2,015.40",
    exit: "2,035.80",
    pnl: "+$1,800",
    tags: ["Safe Haven", "News Event"],
    confidence: 8
  },
  {
    id: 6,
    pair: "USDCAD",
    direction: "SHORT",
    outcome: "WIN",
    date: "Dec 10, 2023",
    time: "13:15", 
    riskReward: "1:1.5",
    entry: "1.3420",
    exit: "1.3390",
    pnl: "+$900",
    tags: ["Range Trade", "4H TF"],
    confidence: 6
  }
];

const stats = [
  { label: "Total Trades", value: "247", change: "+12.7%", positive: true },
  { label: "Win Rate", value: "68.4%", change: "+4.2%", positive: true },
  { label: "Avg R:R", value: "1:2.1", change: "Same", positive: null },
  { label: "Best Streak", value: "9 wins", change: "+2", positive: true },
];

export default function History() {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [filter, setFilter] = useState("all");

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case "WIN":
        return "text-success";
      case "LOSS":
        return "text-danger";
      case "OPEN":
        return "text-warning";
      default:
        return "text-muted-foreground";
    }
  };

  const getDirectionIcon = (direction: string) => {
    return direction === "LONG" ? (
      <TrendingUp className="h-4 w-4 text-success" />
    ) : (
      <TrendingDown className="h-4 w-4 text-danger" />
    );
  };

  return (
    <ProtectedRoute>
      <AppLayout 
        title="Trade History" 
        subtitle="247 trades analyzed"
      >
      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          {stats.map((stat, index) => (
            <TradingCard key={stat.label} variant="gradient">
              <TradingCardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  {stat.change !== "Same" && (
                    <div className={`text-sm ${stat.positive ? "text-success" : "text-danger"}`}>
                      {stat.change}
                    </div>
                  )}
                </div>
              </TradingCardContent>
            </TradingCard>
          ))}
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
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="bg-transparent text-sm focus:outline-none"
              >
                <option value="all">All Instruments</option>
                <option value="forex">Forex</option>
                <option value="crypto">Crypto</option>
                <option value="commodities">Commodities</option>
              </select>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-input">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search by tags..."
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
              📊 Cards
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}  
              size="sm"
              onClick={() => setViewMode("table")}
            >
              📋 Table
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Recent Trades Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Trades</h2>
          <p className="text-sm text-muted-foreground">Showing 247 results</p>
        </div>

        {/* Trades Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {trades.map((trade, index) => (
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
                        <TradingCardTitle className="text-base">{trade.pair}</TradingCardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{trade.date}</span>
                          <span>•</span>
                          <span>{trade.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.outcome === "WIN" ? "bg-success/20 text-success" :
                      trade.outcome === "LOSS" ? "bg-danger/20 text-danger" :
                      "bg-warning/20 text-warning"
                    }`}>
                      {trade.outcome}
                    </div>
                  </div>
                </TradingCardHeader>
                
                <TradingCardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Direction</span>
                        <div className={`font-medium ${
                          trade.direction === "LONG" ? "text-success" : "text-danger"
                        }`}>
                          {trade.direction}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">R:R Ratio</span>
                        <div className="font-medium">{trade.riskReward}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Entry</span>
                        <div className="font-mono">{trade.entry}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Exit</span>
                        <div className="font-mono">{trade.exit}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className={`text-lg font-semibold ${
                        trade.pnl.includes("+") ? "text-success" : 
                        trade.pnl.includes("-") ? "text-danger" : "text-warning"
                      }`}>
                        {trade.pnl}
                      </div>
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>

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
                  </div>
                </TradingCardContent>
              </TradingCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </AppLayout>
    </ProtectedRoute>
  );
}