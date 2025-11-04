import express from "express";
import cors from "cors";
import path from "path"; // ⬅️ নতুন ইম্পোর্ট
import { fileURLToPath } from "url"; // ⬅️ নতুন ইম্পোর্ট

import { initializeDatabase, seedDatabase } from "./database/schema";
import authRoutes from "./routes/auth";
import ticketRoutes from "./routes/tickets";
import ticketBatchRoutes from "./routes/ticket-batches";
import bookingRoutes from "./routes/bookings";
import userRoutes from "./routes/users";
import settingsRoutes from "./routes/settings";
// Import API routes
// ... (আপনার API routes ইম্পোর্ট)

export function createServer() {
  const app = express();

  // --- [Database Initialization] ---
  // ... (Database setup code remains the same)
  try {
    initializeDatabase();
    seedDatabase();
    console.log("Database initialized and seeded successfully");
  } catch (error) {
    console.error("Database initialization error:", error);
  }

  // --- [Middleware] ---
  // ... (Your existing middleware code remains the same)
  //--app.use(--
    cors({
      // ... (cors configuration)
    }),
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  // ... (logging middleware)

  // --- [API Routes] ---
  app.get("/api/ping", (req, _res) => {
    // ... (ping endpoint remains the same)
  });
  app.use("/api/auth", authRoutes);
  app.use("/api/tickets", ticketRoutes);
  app.use("/api/ticket-batches", ticketBatchRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/settings", settingsRoutes);

  // --- [Express App Export] ---
  return app;
}

// ⬅️ Vercel-এর জন্য এখানে আমরা একটি নতুন ফাংশন যোগ করব
// Vercel একটি 'default' এক্সপোর্ট আশা করে যা একটি Express অ্যাপ বা ফাংশন রিটার্ন করে
export default function handler() {
  const app = createServer();
  
  // ES Modules-এর জন্য __dirname সেটআপ
  // এটি dist/server/node-build.mjs ফাইলটি যেখানে আছে, তার পাথ দেবে।
  // সেখান থেকে আমাদের dist/spa ফোল্ডারে যেতে হবে।
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Vercel/Express-এ React ফাইল সার্ভ করার জন্য পাথের গণনা
  const spaPath = path.resolve(__dirname, '..', 'spa'); // '..' দিয়ে dist/server থেকে dist-এ এসে, তারপর spa তে
  
  // ১. স্ট্যাটিক ফাইল সার্ভ করা: (JS, CSS, images)
  // এটি Vercel/dist/spa ফোল্ডারের ফাইলগুলো রুট পাথে সার্ভ করবে
  app.use(express.static(spaPath));

  // ২. SPA ফলব্যাক (Catch-all Route):
  // এটি API রুট ছাড়া যেকোনো রিকোয়েস্ট index.html-এ পাঠাবে
  app.get("*", (req, res) => {
    // API routes are already handled, so if it reaches here, it must be a client route.
    if (req.path.startsWith('/api/')) {
        // If it somehow skips API handlers but starts with /api/, send a 404
        return res.status(404).json({
            success: false,
            message: "API endpoint not found after all route checks",
            path: req.path,
        });
    }

    // Send the main index.html file for client-side routing
    res.sendFile(path.resolve(spaPath, "index.html"));
  });

  return app;
}
