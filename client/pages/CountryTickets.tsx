import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plane,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Eye,
  ShoppingCart,
  Filter,
  Search,
  Users,
  Badge as BadgeIcon,
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

interface TicketData {
  id: string;
  airline: string;
  flightNumber: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  sellingPrice: number;
  buyingPrice?: number;
  status: "available" | "booked" | "locked" | "sold";
  availableSeats: number;
  totalSeats: number;
  aircraft: string;
  terminal: string;
}

export default function CountryTickets() {
  const { country } = useParams<{ country: string }>();
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [airlineFilter, setAirlineFilter] = useState("all");
  const [priceSort, setPriceSort] = useState("asc");

  const showBuyingPrice = hasPermission("view_buying_price");

  // Country information mapping
  const countryInfo = {
    ksa: { name: "Saudi Arabia", flag: "🇸🇦", code: "KSA" },
    uae: { name: "United Arab Emirates", flag: "🇦🇪", code: "UAE" },
    qatar: { name: "Qatar", flag: "🇶🇦", code: "QAT" },
    kuwait: { name: "Kuwait", flag: "🇰🇼", code: "KWT" },
    oman: { name: "Oman", flag: "🇴🇲", code: "OMN" },
    bahrain: { name: "Bahrain", flag: "🇧🇭", code: "BHR" },
    jordan: { name: "Jordan", flag: "🇯🇴", code: "JOR" },
    lebanon: { name: "Lebanon", flag: "🇱🇧", code: "LBN" },
  };

  const currentCountry =
    countryInfo[country?.toLowerCase() as keyof typeof countryInfo];

  // Mock ticket data for the specific country
  const tickets: TicketData[] = [
    {
      id: "1",
      airline: "Air Arabia",
      flightNumber: "G9 123",
      departureDate: "Dec 25, 2024",
      departureTime: "14:30",
      arrivalTime: "18:45",
      duration: "4h 15m",
      sellingPrice: 22000,
      buyingPrice: 18000,
      status: "available",
      availableSeats: 15,
      totalSeats: 20,
      aircraft: "Airbus A320",
      terminal: "Terminal 1",
    },
    {
      id: "2",
      airline: "Emirates",
      flightNumber: "EK 582",
      departureDate: "Dec 26, 2024",
      departureTime: "09:15",
      arrivalTime: "13:30",
      duration: "4h 15m",
      sellingPrice: 45000,
      buyingPrice: 38000,
      status: "available",
      availableSeats: 8,
      totalSeats: 12,
      aircraft: "Boeing 777",
      terminal: "Terminal 3",
    },
    {
      id: "3",
      airline: "Flydubai",
      flightNumber: "FZ 571",
      departureDate: "Dec 27, 2024",
      departureTime: "16:45",
      arrivalTime: "21:00",
      duration: "4h 15m",
      sellingPrice: 28000,
      buyingPrice: 23000,
      status: "locked",
      availableSeats: 3,
      totalSeats: 8,
      aircraft: "Boeing 737",
      terminal: "Terminal 2",
    },
    {
      id: "4",
      airline: "Saudi Airlines",
      flightNumber: "SV 803",
      departureDate: "Dec 28, 2024",
      departureTime: "11:20",
      arrivalTime: "15:35",
      duration: "4h 15m",
      sellingPrice: 19500,
      buyingPrice: 16000,
      status: "sold",
      availableSeats: 0,
      totalSeats: 5,
      aircraft: "Airbus A321",
      terminal: "Terminal 1",
    },
    {
      id: "5",
      airline: "Qatar Airways",
      flightNumber: "QR 639",
      departureDate: "Dec 29, 2024",
      departureTime: "20:10",
      arrivalTime: "00:25",
      duration: "4h 15m",
      sellingPrice: 52000,
      buyingPrice: 44000,
      status: "available",
      availableSeats: 6,
      totalSeats: 10,
      aircraft: "Boeing 787",
      terminal: "Terminal 3",
    },
  ];

  const airlines = [...new Set(tickets.map((t) => t.airline))];

  const filteredTickets = tickets
    .filter((ticket) => {
      const matchesSearch =
        ticket.airline.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.flightNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;
      const matchesAirline =
        airlineFilter === "all" || ticket.airline === airlineFilter;

      return matchesSearch && matchesStatus && matchesAirline;
    })
    .sort((a, b) => {
      if (priceSort === "asc") return a.sellingPrice - b.sellingPrice;
      return b.sellingPrice - a.sellingPrice;
    });

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
            Sold Out
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleBookTicket = (ticketId: string) => {
    console.log("Booking ticket:", ticketId);
    // This would open the booking dialog
  };

  const handleViewDetails = (ticketId: string) => {
    console.log("View ticket details:", ticketId);
    // This would show detailed ticket information
  };

  if (!currentCountry) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-heading font-bold text-foreground mb-4">
          Country Not Found
        </h1>
        <p className="text-foreground/70 font-body mb-6">
          The requested country could not be found.
        </p>
        <Link to="/countries">
          <Button className="velvet-button text-primary-foreground font-body">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Countries
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/countries">
              <Button variant="outline" size="sm" className="font-body">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="text-4xl">{currentCountry.flag}</div>
              <div>
                <h1 className="text-3xl font-heading font-bold velvet-text">
                  {currentCountry.name} Flights
                </h1>
                <p className="text-foreground/70 font-body">
                  Available flights to {currentCountry.name}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="hidden lg:flex items-center space-x-6 luxury-card p-4 rounded-lg border-0">
            <div className="text-center">
              <p className="text-xl font-heading font-bold text-green-600 velvet-text">
                {filteredTickets.filter((t) => t.status === "available").length}
              </p>
              <p className="text-xs font-body text-foreground/60">Available</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-heading font-bold text-blue-600 velvet-text">
                {filteredTickets.reduce((sum, t) => sum + t.availableSeats, 0)}
              </p>
              <p className="text-xs font-body text-foreground/60">
                Total Seats
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-heading font-bold text-primary velvet-text">
                {airlines.length}
              </p>
              <p className="text-xs font-body text-foreground/60">Airlines</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="luxury-card border-0">
          <CardHeader>
            <CardTitle className="font-heading velvet-text flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter Flights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-foreground/40" />
                <Input
                  placeholder="Search flights..."
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

              <Select value={priceSort} onValueChange={setPriceSort}>
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Sort by price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Price: Low to High</SelectItem>
                  <SelectItem value="desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <span className="font-body text-sm text-foreground/70">
                  {filteredTickets.length} flights found
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Flight Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {filteredTickets.map((ticket, index) => (
          <motion.div
            key={ticket.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
          >
            <Card
              className={`luxury-card border-0 h-full ${ticket.status === "sold" ? "opacity-75" : ""} hover:shadow-2xl transition-all duration-300 group`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-luxury-gold/20 to-luxury-bronze/20 rounded-full">
                      <Plane className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-heading text-lg velvet-text">
                        {ticket.airline}
                      </CardTitle>
                      <CardDescription className="font-body text-sm">
                        {ticket.flightNumber}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(ticket.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Flight Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-foreground/40" />
                      <span className="font-body text-sm text-foreground">
                        {ticket.departureDate}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-foreground/40" />
                      <span className="font-body text-sm text-foreground">
                        {ticket.departureTime}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-foreground/40" />
                      <span className="font-body text-sm text-foreground">
                        {ticket.terminal}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BadgeIcon className="h-4 w-4 text-foreground/40" />
                      <span className="font-body text-sm text-foreground">
                        {ticket.aircraft}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Journey Info */}
                <div className="bg-gradient-to-r from-cream-100 to-cream-200 rounded-lg p-3">
                  <div className="flex justify-between items-center text-sm font-body">
                    <span className="text-foreground">Dhaka (DAC)</span>
                    <div className="flex items-center space-x-2 text-foreground/60">
                      <div className="w-8 border-t border-foreground/30"></div>
                      <Plane className="h-4 w-4" />
                      <div className="w-8 border-t border-foreground/30"></div>
                    </div>
                    <span className="text-foreground">
                      {currentCountry.code}
                    </span>
                  </div>
                  <div className="text-center mt-1">
                    <span className="text-xs text-foreground/60 font-body">
                      {ticket.duration}
                    </span>
                  </div>
                </div>

                {/* Seats and Pricing */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-foreground/40" />
                    <span className="font-body text-sm text-foreground">
                      {ticket.availableSeats}/{ticket.totalSeats} seats
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-heading font-bold text-lg text-green-600">
                        ৳{ticket.sellingPrice.toLocaleString()}
                      </span>
                    </div>
                    {showBuyingPrice && (
                      <div className="text-xs text-foreground/60 font-body">
                        Cost: ৳{ticket.buyingPrice?.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    onClick={() => handleViewDetails(ticket.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1 font-body hover:scale-105 transform transition-all duration-200"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Details
                  </Button>
                  {ticket.status === "available" && (
                    <Button
                      onClick={() => handleBookTicket(ticket.id)}
                      size="sm"
                      className="flex-1 velvet-button text-primary-foreground font-body hover:scale-105 transform transition-all duration-200"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Book Now
                    </Button>
                  )}
                  {ticket.status === "sold" && (
                    <Button
                      disabled
                      size="sm"
                      className="flex-1 font-body"
                      variant="outline"
                    >
                      Sold Out
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* No Results */}
      {filteredTickets.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">✈️</div>
          <h3 className="text-xl font-heading font-bold text-foreground mb-2">
            No flights found
          </h3>
          <p className="text-foreground/60 font-body">
            Try adjusting your filters to see more results
          </p>
        </motion.div>
      )}
    </div>
  );
}
