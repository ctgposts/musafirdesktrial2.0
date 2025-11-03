import { Router, Request, Response } from "express";
import {
  TicketRepository,
  TicketBatchRepository,
  CountryRepository,
  ActivityLogRepository,
} from "../database/models";
import {
  authenticate,
  requirePermission,
  hasPermission,
} from "../middleware/auth";
import { z } from "zod";

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all tickets
router.get("/", async (req: Request, res: Response) => {
  try {
    const { country, status, airline, limit = 50, offset = 0 } = req.query;

    let tickets = TicketRepository.findAll();

    // Apply filters
    if (country) {
      tickets = tickets.filter(
        (ticket) => ticket.batch.country_code === country,
      );
    }

    if (status) {
      tickets = tickets.filter((ticket) => ticket.status === status);
    }

    if (airline) {
      tickets = tickets.filter((ticket) =>
        ticket.batch.airline_name
          .toLowerCase()
          .includes((airline as string).toLowerCase()),
      );
    }

    // Apply pagination
    const startIndex = parseInt(offset as string);
    const endIndex = startIndex + parseInt(limit as string);
    const paginatedTickets = tickets.slice(startIndex, endIndex);

    // Remove buying price if user doesn't have permission
    const userCanViewBuyingPrice = hasPermission(
      req.user!.role,
      "view_buying_price",
    );
    if (!userCanViewBuyingPrice) {
      paginatedTickets.forEach((ticket) => {
        if (ticket.batch) {
          delete ticket.batch.buying_price;
        }
      });
    }

    res.json({
      success: true,
      message: "Tickets retrieved successfully",
      data: {
        tickets: paginatedTickets,
        total: tickets.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    console.error("Get tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get tickets by country
router.get("/country/:countryCode", async (req: Request, res: Response) => {
  try {
    const { countryCode } = req.params;
    const { status, airline } = req.query;

    let tickets = TicketRepository.findByCountry(countryCode.toUpperCase());

    // Apply filters
    if (status) {
      tickets = tickets.filter((ticket) => ticket.status === status);
    }

    if (airline) {
      tickets = tickets.filter((ticket) =>
        ticket.batch.airline_name
          .toLowerCase()
          .includes((airline as string).toLowerCase()),
      );
    }

    // Remove buying price if user doesn't have permission
    const userCanViewBuyingPrice = hasPermission(
      req.user!.role,
      "view_buying_price",
    );
    if (!userCanViewBuyingPrice) {
      tickets.forEach((ticket) => {
        if (ticket.batch) {
          delete ticket.batch.buying_price;
        }
      });
    }

    res.json({
      success: true,
      message: "Country tickets retrieved successfully",
      data: {
        tickets,
        country: countryCode,
        total: tickets.length,
      },
    });
  } catch (error) {
    console.error("Get country tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get single ticket by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ticket = TicketRepository.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Remove buying price if user doesn't have permission
    const userCanViewBuyingPrice = hasPermission(
      req.user!.role,
      "view_buying_price",
    );
    if (!userCanViewBuyingPrice && ticket.batch) {
      delete ticket.batch.buying_price;
    }

    res.json({
      success: true,
      message: "Ticket retrieved successfully",
      data: { ticket },
    });
  } catch (error) {
    console.error("Get ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Update ticket status
router.patch("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!["available", "booked", "locked", "sold"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Check permissions for certain status changes
    if (status === "sold" && !hasPermission(req.user!.role, "confirm_sales")) {
      return res.status(403).json({
        success: false,
        message: "Permission required to mark tickets as sold",
      });
    }

    const ticket = TicketRepository.findById(id);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const success = TicketRepository.updateStatus(
      id,
      status,
      status === "sold" ? req.user!.id : undefined,
    );

    if (success) {
      // Log activity
      ActivityLogRepository.create({
        user_id: req.user!.id,
        action: "update_ticket_status",
        entity_type: "ticket",
        entity_id: id,
        details: JSON.stringify({
          old_status: ticket.status,
          new_status: status,
        }),
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get("User-Agent"),
      });

      res.json({
        success: true,
        message: "Ticket status updated successfully",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to update ticket status",
      });
    }
  } catch (error) {
    console.error("Update ticket status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get dashboard statistics
router.get("/dashboard/stats", async (req: Request, res: Response) => {
  try {
    const stats = TicketRepository.getDashboardStats();

    // Remove profit info if user doesn't have permission
    const userCanViewProfit = hasPermission(req.user!.role, "view_profit");
    if (!userCanViewProfit) {
      delete stats.estimatedProfit;
    }

    res.json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get countries with ticket counts
router.get("/countries/stats", async (req: Request, res: Response) => {
  try {
    const countries = CountryRepository.findAll();
    const stats = TicketBatchRepository.getStatsByCountry();

    const countriesWithStats = countries.map((country) => {
      const countryStats = stats.find(
        (stat) => stat.country_code === country.code,
      );
      return {
        ...country,
        totalTickets: countryStats?.total_tickets || 0,
        availableTickets: countryStats?.available_tickets || 0,
      };
    });

    res.json({
      success: true,
      message: "Countries with statistics retrieved successfully",
      data: { countries: countriesWithStats },
    });
  } catch (error) {
    console.error("Get countries stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;
