import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  Ticket as TicketIcon,
  Eye,
  Calendar,
  Clock,
  Plane,
  DollarSign,
  Lock,
  CheckCircle,
  Search,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

interface TicketRowProps {
  ticket: {
    id: string;
    sl: number;
    airline: string;
    departureDate: string;
    departureDay: string;
    departureTime: string;
    sellingPrice: number;
    buyingPrice?: number;
    status: "available" | "booked" | "locked" | "sold";
    lockStatus?: string;
  };
  showBuyingPrice: boolean;
  onView: (ticketId: string) => void;
  onBook: (ticketId: string) => void;
}

function TicketRow({
  ticket,
  showBuyingPrice,
  onView,
  onBook,
}: TicketRowProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Available
          </Badge>
        );
      case "booked":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Booked
          </Badge>
        );
      case "locked":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Locked
          </Badge>
        );
      case "sold":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            Sold
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const isDisabled = ticket.status === "sold";

  return (
    <motion.tr
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-b border-border/20 hover:bg-gradient-to-r hover:from-cream-100/50 hover:to-transparent transition-all duration-300 ${isDisabled ? "opacity-60" : ""}`}
    >
      <td className="px-4 py-3 font-body text-sm text-foreground">
        {ticket.sl}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <Plane className="h-4 w-4 text-foreground/40" />
          <span className="font-body font-medium text-sm text-foreground">
            {ticket.airline}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-foreground/40" />
          <div>
            <div className="font-body font-medium text-sm text-foreground">
              {ticket.departureDate}
            </div>
            <div className="font-body text-xs text-foreground/50">
              {ticket.departureDay}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-foreground/40" />
          <span className="font-body text-sm text-foreground">
            {ticket.departureTime}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-body font-semibold text-sm text-green-600">
            ৳{ticket.sellingPrice.toLocaleString()}
          </span>
        </div>
      </td>
      {showBuyingPrice && (
        <td className="px-4 py-3">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-red-600" />
            <span className="font-body font-semibold text-sm text-red-600">
              ৳{ticket.buyingPrice?.toLocaleString() || "N/A"}
            </span>
          </div>
        </td>
      )}
      <td className="px-4 py-3">{getStatusBadge(ticket.status)}</td>
      <td className="px-4 py-3">
        {ticket.lockStatus && (
          <div className="flex items-center space-x-1 text-xs text-foreground/50">
            <Lock className="h-3 w-3" />
            <span>{ticket.lockStatus}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(ticket.id)}
            className="font-body text-xs hover:scale-105 transform transition-all duration-200"
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          {!isDisabled && (
            <Button
              size="sm"
              onClick={() => onBook(ticket.id)}
              className="font-body text-xs velvet-button hover:scale-105 transform transition-all duration-200"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Book
            </Button>
          )}
          {isDisabled && (
            <Badge
              variant="outline"
              className="bg-red-50 text-red-700 border-red-200 text-xs"
            >
              SOLD OUT
            </Badge>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

export default function Tickets() {
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [airlineFilter, setAirlineFilter] = useState("all");

  const showBuyingPrice = hasPermission("view_buying_price");

  // Mock data - in a real app, this would come from API
  const tickets = [
    {
      id: "1",
      sl: 1,
      airline: "Air Arabia",
      departureDate: "Dec 25, 2024",
      departureDay: "Wednesday",
      departureTime: "14:30",
      sellingPrice: 22000,
      buyingPrice: 18000,
      status: "available" as const,
    },
    {
      id: "2",
      sl: 2,
      airline: "Emirates",
      departureDate: "Dec 26, 2024",
      departureDay: "Thursday",
      departureTime: "09:15",
      sellingPrice: 45000,
      buyingPrice: 38000,
      status: "booked" as const,
    },
    {
      id: "3",
      sl: 3,
      airline: "Flydubai",
      departureDate: "Dec 27, 2024",
      departureDay: "Friday",
      departureTime: "16:45",
      sellingPrice: 28000,
      buyingPrice: 23000,
      status: "locked" as const,
      lockStatus: "Expires in 18h",
    },
    {
      id: "4",
      sl: 4,
      airline: "Saudi Airlines",
      departureDate: "Dec 28, 2024",
      departureDay: "Saturday",
      departureTime: "11:20",
      sellingPrice: 19500,
      buyingPrice: 16000,
      status: "sold" as const,
    },
    {
      id: "5",
      sl: 5,
      airline: "Qatar Airways",
      departureDate: "Dec 29, 2024",
      departureDay: "Sunday",
      departureTime: "20:10",
      sellingPrice: 52000,
      buyingPrice: 44000,
      status: "available" as const,
    },
  ];

  const airlines = [...new Set(tickets.map((t) => t.airline))];

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.airline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.departureDate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;
    const matchesAirline =
      airlineFilter === "all" || ticket.airline === airlineFilter;

    return matchesSearch && matchesStatus && matchesAirline;
  });

  const handleView = (ticketId: string) => {
    console.log("View ticket:", ticketId);
    // This would open the booking dialog
  };

  const handleBook = (ticketId: string) => {
    console.log("Book ticket:", ticketId);
    // This would open the booking dialog
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-luxury-gold to-luxury-bronze rounded-full animate-glow animate-float">
            <TicketIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold velvet-text">
              All Tickets
            </h1>
            <p className="text-foreground/70 font-body">
              Manage and book flight tickets
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="luxury-card border-0">
          <CardHeader>
            <CardTitle className="font-heading flex items-center space-x-2 velvet-text">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
            <CardDescription className="font-body">
              Search and filter tickets by various criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-foreground/40" />
                <Input
                  placeholder="Search airline or date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 font-body"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>

              <Select value={airlineFilter} onValueChange={setAirlineFilter}>
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Filter by airline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Airlines</SelectItem>
                  {airlines.map((airline) => (
                    <SelectItem key={airline} value={airline}>
                      {airline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <span className="font-body text-sm text-foreground/70">
                  {filteredTickets.length} tickets found
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tickets Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card className="luxury-card border-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-cream-100 to-cream-200 border-b border-border/30">
                  <tr>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                      SL
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                      Airline
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                      Departure Date
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                      Selling Price
                    </th>
                    {showBuyingPrice && (
                      <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                        Buying Price
                      </th>
                    )}
                    <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                      Booking Status
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                      Lock Status
                    </th>
                    <th className="px-4 py-3 text-left font-heading font-semibold text-sm text-foreground velvet-text">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <TicketRow
                      key={ticket.id}
                      ticket={ticket}
                      showBuyingPrice={showBuyingPrice}
                      onView={handleView}
                      onBook={handleBook}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="text-center luxury-card border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-heading font-bold text-green-600 velvet-text">
              {filteredTickets.filter((t) => t.status === "available").length}
            </div>
            <div className="text-sm font-body text-foreground/60">
              Available
            </div>
          </CardContent>
        </Card>

        <Card className="text-center luxury-card border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-heading font-bold text-blue-600 velvet-text">
              {filteredTickets.filter((t) => t.status === "booked").length}
            </div>
            <div className="text-sm font-body text-foreground/60">Booked</div>
          </CardContent>
        </Card>

        <Card className="text-center luxury-card border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-heading font-bold text-yellow-600 velvet-text">
              {filteredTickets.filter((t) => t.status === "locked").length}
            </div>
            <div className="text-sm font-body text-foreground/60">Locked</div>
          </CardContent>
        </Card>

        <Card className="text-center luxury-card border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-heading font-bold text-foreground/60 velvet-text">
              {filteredTickets.filter((t) => t.status === "sold").length}
            </div>
            <div className="text-sm font-body text-foreground/60">Sold</div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
