import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { handleGoogleOAuthSignIn, handleGoogleOAuthSignUp, loginUser, createSessionUser } from "./auth";
import type { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Session setup
export function setupSession(app: Express) {
  // Trust proxy for HTTPS forwarding - required for secure cookies behind proxy
  app.set('trust proxy', 1);
  
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  // Configure session with production-optimized settings
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    name: 'joma.session.id', // Custom session name
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: "lax" as const,
      path: '/',
    },
  };

  // In production, ensure secure cookie configuration
  if (process.env.NODE_ENV === "production") {
    sessionConfig.cookie.secure = true;
    // Allow cookies to work across subdomains
    sessionConfig.cookie.domain = process.env.COOKIE_DOMAIN || undefined;
  }

  app.use(session(sessionConfig));
}

// Passport configuration
export function setupPassport(app: Express) {
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  // Google OAuth strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Use the actual Replit domain for callback URL
    const callbackURL = process.env.NODE_ENV === 'development' 
      ? `https://${process.env.REPLIT_DOMAINS}/auth/google/callback`
      : "/auth/google/callback";
    
    console.log(`Google OAuth configured with callback URL: ${callbackURL}`);
    
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: callbackURL,
      passReqToCallback: true
    }, async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth profile received:', profile.displayName);
        
        // Check the state parameter to determine if it's sign-in or sign-up
        const isSignUp = req.query.state === 'signup';
        
        let user;
        if (isSignUp) {
          user = await handleGoogleOAuthSignUp(profile._json);
        } else {
          user = await handleGoogleOAuthSignIn(profile._json);
        }
        
        return done(null, createSessionUser(user));
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }));
  } else {
    console.log('Google OAuth not configured - missing client ID or secret');
  }

  // Local email/password strategy
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      const user = await loginUser({ email, password });
      return done(null, createSessionUser(user));
    } catch (error) {
      return done(null, false, { message: (error as Error).message });
    }
  }));
}

// Auth routes
export function setupAuthRoutes(app: Express) {
  // Google OAuth routes - Sign In
  app.get('/auth/google/signin',
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      prompt: 'select_account',
      state: 'signin'
    })
  );

  // Google OAuth routes - Sign Up
  app.get('/auth/google/signup',
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      prompt: 'select_account',
      state: 'signup'
    })
  );

  app.get('/auth/google/callback',
    (req, res, next) => {
      passport.authenticate('google', (err, user, info) => {
        if (err) {
          console.error('Google OAuth error:', err);
          // Check if it's a sign-up related error
          if (err.message === 'Please sign up first') {
            return res.redirect('/?error=signup_required');
          } else if (err.message === 'Account already exists with this email') {
            return res.redirect('/?error=account_exists');
          }
          return res.redirect('/?error=auth_failed');
        }
        
        if (!user) {
          return res.redirect('/?error=auth_failed');
        }
        
        req.logIn(user, (err) => {
          if (err) {
            console.error('Login error:', err);
            return res.redirect('/?error=auth_failed');
          }
          return res.redirect('/');
        });
      })(req, res, next);
    }
  );

  // Local auth routes
  app.post('/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Authentication error' });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login error' });
        }
        return res.json({ user });
      });
    })(req, res, next);
  });

  // Logout route
  app.post('/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout error' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get current user
  app.get('/api/auth/user', async (req, res) => {
    if (req.user) {
      try {
        // Get full user data from database
        const { storage } = await import('./storage');
        const user = await storage.getUser(req.user.id);
        res.json(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  });
}