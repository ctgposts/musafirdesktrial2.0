import serverless from "serverless-http";
import { createServer } from "../server";

// Create the Express server
const app = createServer();

// Export the serverless function
export default serverless(app);

// Vercel builder needs named exports for API routes
export const config = {
  api: {
    bodyParser: true,
  },
};