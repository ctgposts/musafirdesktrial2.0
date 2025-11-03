import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plane, MapPin, Ticket, RefreshCw, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { apiClient } from "../services/api";

interface Country {
  code: string;
  name: string;
  flag: string;
  totalTickets: number;
  availableTickets: number;
}

interface CountryCardProps {
  country: Country;
  index: number;
}

function CountryCard({ country, index }: CountryCardProps) {
  const availabilityPercentage =
    country.totalTickets > 0
      ? (country.availableTickets / country.totalTickets) * 100
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link to={`/tickets/${country.code.toLowerCase()}`}>
        <Card className="h-full luxury-card hover:shadow-2xl transition-all duration-300 cursor-pointer group border-0 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/5 to-luxury-bronze/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="text-center pb-2 relative z-10">
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
              {country.flag}
            </div>
            <CardTitle className="font-heading text-lg velvet-text group-hover:text-primary transition-colors">
              {country.name}
            </CardTitle>
            <CardDescription className="font-body text-sm text-foreground/60">
              {country.code}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 relative z-10">
            {/* Ticket Availability */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-body text-sm text-foreground/70">
                  Available
                </span>
                <span className="font-heading font-semibold text-primary">
                  {country.availableTickets}
                </span>
              </div>

              <div className="w-full bg-gradient-to-r from-cream-200 to-cream-300 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-luxury-gold to-luxury-bronze h-2 rounded-full transition-all duration-300 animate-glow"
                  style={{ width: `${availabilityPercentage}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-xs font-body text-foreground/50">
                <span>Total: {country.totalTickets}</span>
                <span>{availabilityPercentage.toFixed(0)}% available</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/30">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-gradient-to-br from-blue-100 to-blue-200 rounded animate-float">
                  <Plane className="h-3 w-3 text-blue-600" />
                </div>
                <span className="font-body text-xs text-foreground/70">
                  Multiple Airlines
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <div
                  className="p-1 bg-gradient-to-br from-green-100 to-green-200 rounded animate-float"
                  style={{ animationDelay: "0.5s" }}
                >
                  <Ticket className="h-3 w-3 text-green-600" />
                </div>
                <span className="font-body text-xs text-foreground/70">
                  View Tickets
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function Countries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCountries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getCountries();
      setCountries(data.countries || []);
    } catch (err) {
      console.error("Failed to load countries:", err);
      setError("Failed to load countries data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCountries();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="font-body text-foreground">
            Loading countries...
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
          Error Loading Countries
        </h3>
        <p className="text-foreground/70 font-body mb-4">{error}</p>
        <Button
          onClick={loadCountries}
          className="velvet-button text-primary-foreground font-body"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const totalAvailable = countries.reduce(
    (sum, country) => sum + country.availableTickets,
    0,
  );
  const totalTickets = countries.reduce(
    (sum, country) => sum + country.totalTickets,
    0,
  );

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
            <div className="p-3 bg-gradient-to-br from-luxury-gold to-luxury-bronze rounded-full animate-glow animate-float">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold velvet-text">
                Countries
              </h1>
              <p className="text-foreground/70 font-body">
                Browse tickets by destination country
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              onClick={loadCountries}
              variant="outline"
              size="sm"
              className="font-body hover:scale-105 transform transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            {/* Summary Stats */}
            <div className="hidden md:flex items-center space-x-6 luxury-card p-4 rounded-lg border-0 backdrop-blur-md">
              <div className="text-center">
                <p className="text-2xl font-heading font-bold text-primary velvet-text">
                  {totalAvailable}
                </p>
                <p className="text-xs font-body text-foreground/60">
                  Available
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-heading font-bold text-foreground velvet-text">
                  {totalTickets}
                </p>
                <p className="text-xs font-body text-foreground/60">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-heading font-bold text-blue-600 velvet-text">
                  {countries.length}
                </p>
                <p className="text-xs font-body text-foreground/60">
                  Countries
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="md:hidden grid grid-cols-3 gap-4"
      >
        <Card className="text-center p-4 luxury-card border-0">
          <div className="text-xl font-heading font-bold text-primary velvet-text">
            {totalAvailable}
          </div>
          <div className="text-xs font-body text-foreground/60">Available</div>
        </Card>
        <Card className="text-center p-4 luxury-card border-0">
          <div className="text-xl font-heading font-bold text-foreground velvet-text">
            {totalTickets}
          </div>
          <div className="text-xs font-body text-foreground/60">Total</div>
        </Card>
        <Card className="text-center p-4 luxury-card border-0">
          <div className="text-xl font-heading font-bold text-blue-600 velvet-text">
            {countries.length}
          </div>
          <div className="text-xs font-body text-foreground/60">Countries</div>
        </Card>
      </motion.div>

      {/* Countries Grid */}
      {countries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {countries.map((country, index) => (
            <CountryCard key={country.code} country={country} index={index} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="text-6xl mb-4">🌍</div>
          <h3 className="text-xl font-heading font-bold text-foreground mb-2">
            No countries found
          </h3>
          <p className="text-foreground/60 font-body">
            Countries data will appear here once tickets are added to the system
          </p>
        </motion.div>
      )}

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-center py-8"
      >
        <p className="font-body text-sm text-foreground/50">
          Click on any country to view available tickets and make bookings
        </p>
      </motion.div>
    </div>
  );
}
