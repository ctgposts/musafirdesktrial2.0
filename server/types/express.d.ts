import { User } from "../database/models";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}