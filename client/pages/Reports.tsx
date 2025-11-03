import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Ticket,
  Users,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  PieChart,
  LineChart,
  Globe,
  Plane,
  Clock,
  AlertCircle,
} from "lucide-react";

interface ReportData {
  salesReport: {
    totalRevenue: number;
    totalBookings: number;
    avgTicketPrice: number;
    profitMargin: number;
    dailySales: Array<{ date: string; amount: number; bookings: number }>;
  };
  countryReport: {
    topCountries: Array<{ country: string; bookings: number; revenue: number }>;
  };
  agentReport: {
    topAgents: Array<{ agent: string; bookings: number; revenue: number }>;
  };
  paymentReport: {
    paymentMethods: Array<{ method: string; count: number; amount: number }>;
    pendingPayments: number;
    completedPayments: number;
  };
}

export default function Reports() {
  const { user, hasPermission } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [reportType, setReportType] = useState("overview");

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Mock data - in real app, fetch from API
      const mockData: ReportData = {
        salesReport: {
          totalRevenue: 2850000,
          totalBookings: 156,
          avgTicketPrice: 18269,
          profitMargin: 18.5,
          dailySales: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: Math.floor(Math.random() * 150000) + 50000,
            bookings: Math.floor(Math.random() * 10) + 2,
          })).reverse(),
        },
        countryReport: {
          topCountries: [
            { country: "UAE", bookings: 45, revenue: 820000 },
            { country: "Saudi Arabia", bookings: 38, revenue: 695000 },
            { country: "Malaysia", bookings: 32, revenue: 580000 },
            { country: "Thailand", bookings: 28, revenue: 510000 },
            { country: "Singapore", bookings: 13, revenue: 245000 },
          ],
        },
        agentReport: {
          topAgents: [
            { agent: "Rahman Travel Agency", bookings: 23, revenue: 420000 },
            { agent: "Sundarban Tours", bookings: 18, revenue: 325000 },
            { agent: "Golden Travel", bookings: 15, revenue: 275000 },
            { agent: "Dream Holidays", bookings: 12, revenue: 220000 },
            { agent: "Sky Way Travel", bookings: 10, revenue: 185000 },
          ],
        },
        paymentReport: {
          paymentMethods: [
            { method: "Cash", count: 78, amount: 1425000 },
            { method: "Bank Transfer", count: 45, amount: 825000 },
            { method: "Mobile Banking", count: 23, amount: 420000 },
            { method: "Credit Card", count: 10, amount: 180000 },
          ],
          pendingPayments: 12,
          completedPayments: 144,
        },
      };

      setReportData(mockData);
    } catch (error) {
      console.error("Failed to load report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: string) => {
    // Mock export functionality
    alert(`Exporting report as ${format.toUpperCase()}...`);
  };

  if (!hasPermission("view_profit")) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to view reports.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-lg">Loading reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Reports</h1>
          <p className="text-gray-600">Comprehensive analytics and insights</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="startDate">From:</Label>
            <Input
              id="startDate"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="endDate">To:</Label>
            <Input
              id="endDate"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-auto"
            />
          </div>
          <Button onClick={loadReportData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold">৳{reportData?.salesReport.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +12.5% from last month
                  </p>
                </div>
                <DollarSign className="h-12 w-12 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold">{reportData?.salesReport.totalBookings}</p>
                  <p className="text-sm text-blue-600 flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +8.3% from last month
                  </p>
                </div>
                <Ticket className="h-12 w-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Ticket Price</p>
                  <p className="text-2xl font-bold">৳{reportData?.salesReport.avgTicketPrice.toLocaleString()}</p>
                  <p className="text-sm text-purple-600 flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +3.7% from last month
                  </p>
                </div>
                <BarChart3 className="h-12 w-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Profit Margin</p>
                  <p className="text-2xl font-bold">{reportData?.salesReport.profitMargin}%</p>
                  <p className="text-sm text-orange-600 flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +1.2% from last month
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Reports */}
      <Tabs value={reportType} onValueChange={setReportType}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="countries">Countries</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportReport("pdf")}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportReport("excel")}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Daily Sales Trend
              </CardTitle>
              <CardDescription>Revenue and booking trends over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Chart visualization would go here</p>
                  <p className="text-sm text-gray-500">Sales trend over {reportData?.salesReport.dailySales.length} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="countries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Top Performing Countries
              </CardTitle>
              <CardDescription>Countries ranked by booking volume and revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Avg. Price</TableHead>
                    <TableHead>Market Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData?.countryReport.topCountries.map((country, index) => (
                    <TableRow key={country.country}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </div>
                          {country.country}
                        </div>
                      </TableCell>
                      <TableCell>{country.bookings}</TableCell>
                      <TableCell>৳{country.revenue.toLocaleString()}</TableCell>
                      <TableCell>৳{Math.round(country.revenue / country.bookings).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {((country.bookings / (reportData?.salesReport.totalBookings || 1)) * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Performing Agents
              </CardTitle>
              <CardDescription>Travel agents ranked by performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Avg. Deal Size</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData?.agentReport.topAgents.map((agent, index) => (
                    <TableRow key={agent.agent}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs text-blue-600">
                            {index + 1}
                          </div>
                          {agent.agent}
                        </div>
                      </TableCell>
                      <TableCell>{agent.bookings}</TableCell>
                      <TableCell>৳{agent.revenue.toLocaleString()}</TableCell>
                      <TableCell>৳{Math.round(agent.revenue / agent.bookings).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={index < 2 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {index < 2 ? "Excellent" : index < 4 ? "Good" : "Average"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Payment Methods
                </CardTitle>
                <CardDescription>Distribution of payment methods used</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData?.paymentReport.paymentMethods.map((method) => (
                    <div key={method.method} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="font-medium">{method.method}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">৳{method.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{method.count} transactions</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Payment Status
                </CardTitle>
                <CardDescription>Overview of payment completion status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="font-medium">Completed Payments</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{reportData?.paymentReport.completedPayments}</p>
                      <p className="text-sm text-gray-600">
                        {((reportData?.paymentReport.completedPayments || 0) / ((reportData?.paymentReport.completedPayments || 0) + (reportData?.paymentReport.pendingPayments || 0)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span className="font-medium">Pending Payments</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-yellow-600">{reportData?.paymentReport.pendingPayments}</p>
                      <p className="text-sm text-gray-600">
                        {((reportData?.paymentReport.pendingPayments || 0) / ((reportData?.paymentReport.completedPayments || 0) + (reportData?.paymentReport.pendingPayments || 0)) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Transactions</span>
                      <span className="font-bold">
                        {(reportData?.paymentReport.completedPayments || 0) + (reportData?.paymentReport.pendingPayments || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
