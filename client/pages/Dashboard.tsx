import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  DollarSign,
  Ticket,
  Lock,
  Package,
  TrendingUp,
  ShoppingCart,
  AlertCircle,
  Users,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { apiClient } from "../services/api";
import { DashboardStats } from "@shared/api";

interface DashboardTileProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}

function DashboardTile({
  title,
  value,
  description,
  icon,
  color,
  delay = 0,
}: DashboardTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="transform-gpu"
    >
      <Card className="luxury-card hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/5 to-luxury-bronze/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
          <CardTitle className="text-sm font-heading font-medium velvet-text">
            {title}
          </CardTitle>
          <div
            className={`p-2 rounded-full ${color} animate-glow group-hover:scale-110 transition-transform duration-300`}
          >
            {icon}
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-2xl font-heading font-bold mb-1 velvet-text">
            {value}
          </div>
          <p className="text-xs text-muted-foreground font-body">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      setError("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardStats();
    }
  }, [user]);

  if (!user) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="font-body text-foreground">
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-heading font-bold text-foreground mb-2">
          Error Loading Dashboard
        </h3>
        <p className="text-foreground/70 font-body mb-4">{error}</p>
        <Button
          onClick={loadDashboardStats}
          className="velvet-button text-primary-foreground font-body"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const commonTiles = [
    {
      title: "Today's Sales",
      value: `৳${stats?.todaysSales?.amount?.toLocaleString() || "0"}`,
      description: `${stats?.todaysSales?.count || 0} tickets sold today`,
      icon: <DollarSign className="h-4 w-4 text-white" />,
      color: "bg-green-500",
    },
    {
      title: "Total Bookings",
      value: stats?.totalBookings || 0,
      description: "Active booking requests",
      icon: <Ticket className="h-4 w-4 text-white" />,
      color: "bg-blue-500",
    },
    {
      title: "Locked Tickets",
      value: stats?.lockedTickets || 0,
      description: "Temporarily reserved",
      icon: <Lock className="h-4 w-4 text-white" />,
      color: "bg-yellow-500",
    },
    {
      title: "Total Inventory",
      value: stats?.totalInventory || 0,
      description: "Available tickets",
      icon: <Package className="h-4 w-4 text-white" />,
      color: "bg-purple-500",
    },
  ];

  const adminTiles = hasPermission("view_profit")
    ? [
        {
          title: "Estimated Profit",
          value: `৳${stats?.estimatedProfit?.toLocaleString() || "0"}`,
          description: "Based on current sales",
          icon: <TrendingUp className="h-4 w-4 text-white" />,
          color: "bg-teal-primary",
        },
      ]
    : [];

  const tilesToShow = [...commonTiles, ...adminTiles];

  // Quick Action handlers
  const handleViewTickets = () => {
    navigate("/countries");
  };

  const handleBuyTickets = () => {
    navigate("/admin/buying");
  };

  const handleManageBookings = () => {
    navigate("/bookings");
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-luxury-gold to-luxury-bronze rounded-full animate-glow animate-float">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold velvet-text">
                Welcome back, {user.name}
              </h1>
              <p className="text-foreground/70 font-body capitalize">
                {user.role} Dashboard • BD TicketPro
              </p>
            </div>
          </div>

          <Button
            onClick={loadDashboardStats}
            variant="outline"
            size="sm"
            className="font-body hover:scale-105 transform transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tilesToShow.map((tile, index) => (
          <DashboardTile key={tile.title} {...tile} delay={index * 0.1} />
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="luxury-card border-0">
          <CardHeader>
            <CardTitle className="font-heading velvet-text">
              Quick Actions
            </CardTitle>
            <CardDescription className="font-body">
              Frequently used features for your role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={handleViewTickets}
                className="p-4 border border-border/30 rounded-lg cursor-pointer bg-gradient-to-br from-cream-100 to-cream-200 hover:from-cream-200 hover:to-cream-300 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Ticket className="h-8 w-8 text-primary mb-2 animate-float" />
                <h3 className="font-heading font-semibold velvet-text">
                  View Tickets
                </h3>
                <p className="text-sm text-foreground/70 font-body">
                  Browse available tickets
                </p>
              </motion.div>

              {hasPermission("create_batches") && (
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleBuyTickets}
                  className="p-4 border border-border/30 rounded-lg cursor-pointer bg-gradient-to-br from-cream-100 to-cream-200 hover:from-cream-200 hover:to-cream-300 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <ShoppingCart
                    className="h-8 w-8 text-primary mb-2 animate-float"
                    style={{ animationDelay: "0.5s" }}
                  />
                  <h3 className="font-heading font-semibold velvet-text">
                    Buy Tickets
                  </h3>
                  <p className="text-sm text-foreground/70 font-body">
                    Add new inventory
                  </p>
                </motion.div>
              )}

              <motion.div
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={handleManageBookings}
                className="p-4 border border-border/30 rounded-lg cursor-pointer bg-gradient-to-br from-cream-100 to-cream-200 hover:from-cream-200 hover:to-cream-300 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Package
                  className="h-8 w-8 text-primary mb-2 animate-float"
                  style={{ animationDelay: "1s" }}
                />
                <h3 className="font-heading font-semibold velvet-text">
                  Manage Bookings
                </h3>
                <p className="text-sm text-foreground/70 font-body">
                  Process customer requests
                </p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <Card className="luxury-card border-0">
          <CardHeader>
            <CardTitle className="font-heading velvet-text">
              Recent Activity
            </CardTitle>
            <CardDescription className="font-body">
              Latest updates and transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  action: "Dashboard loaded",
                  details: "System statistics updated",
                  time: "Just now",
                },
                {
                  action: "Session started",
                  details: `${user.name} logged in`,
                  time: "1 minute ago",
                },
                {
                  action: "System ready",
                  details: "BD TicketPro initialized",
                  time: "2 minutes ago",
                },
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="flex items-center justify-between py-3 border-b border-border/20 last:border-b-0 hover:bg-gradient-to-r hover:from-cream-100/50 hover:to-transparent rounded-lg px-2 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-luxury-gold to-luxury-bronze rounded-full animate-glow"></div>
                    <div>
                      <p className="font-body font-medium text-sm text-foreground">
                        {activity.action}
                      </p>
                      <p className="font-body text-xs text-foreground/60">
                        {activity.details}
                      </p>
                    </div>
                  </div>
                  <span className="font-body text-xs text-foreground/50">
                    {activity.time}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
