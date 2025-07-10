import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

// Extract user info from Cloudflare Access headers
function extractUserFromHeaders(req: any) {
  const cfAccessJwt = req.headers['cf-access-jwt-assertion'];
  if (!cfAccessJwt) return null;

  try {
    // In production, you would verify the JWT signature
    // For now, we'll decode the payload (base64 decode the middle part)
    const payload = cfAccessJwt.split('.')[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    const claims = JSON.parse(decoded);
    
    return {
      id: claims.sub || claims.email,
      email: claims.email,
      firstName: claims.given_name || claims.name?.split(' ')[0] || '',
      lastName: claims.family_name || claims.name?.split(' ').slice(1).join(' ') || '',
      profileImageUrl: claims.picture || null,
    };
  } catch (error) {
    console.error('Error extracting user from Cloudflare Access headers:', error);
    return null;
  }
}

async function upsertUser(userInfo: any) {
  return await storage.upsertUser({
    id: userInfo.id,
    email: userInfo.email,
    firstName: userInfo.firstName,
    lastName: userInfo.lastName,
    profileImageUrl: userInfo.profileImageUrl,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Cloudflare Access authentication middleware
  app.use(async (req: any, res, next) => {
    const userInfo = extractUserFromHeaders(req);
    if (userInfo) {
      try {
        const user = await upsertUser(userInfo);
        req.user = user;
        req.session.userId = user.id;
      } catch (error) {
        console.error('Error upserting user:', error);
      }
    }
    next();
  });

  // Redirect to Cloudflare Access protected endpoint
  app.get("/api/login", (req, res) => {
    // In a real Cloudflare Access setup, this would redirect to the protected resource
    // For now, we'll simulate the login by redirecting to the home page
    res.redirect("/");
  });

  app.get("/api/logout", (req: any, res) => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  // Check if user is authenticated via Cloudflare Access
  const userInfo = extractUserFromHeaders(req);
  
  if (!userInfo) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Ensure user exists in database
  try {
    const user = await storage.getUser(userInfo.id);
    if (!user) {
      const newUser = await upsertUser(userInfo);
      req.user = newUser;
    } else {
      req.user = user;
    }
    return next();
  } catch (error) {
    console.error('Error checking user authentication:', error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
