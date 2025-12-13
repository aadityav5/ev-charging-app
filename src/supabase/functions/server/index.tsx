import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase clients
const getSupabaseAdmin = () => createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const getSupabaseClient = () => createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-c1d16aa8/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== AUTH ROUTES ====================

// Sign up endpoint
app.post("/make-server-c1d16aa8/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const supabase = getSupabaseAdmin();
    
    // Create user with admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || email.split('@')[0] },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Error creating user during signup: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Initialize user profile in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || email.split('@')[0],
      createdAt: new Date().toISOString(),
      bookings: []
    });

    return c.json({ 
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name
      }
    });
  } catch (error) {
    console.log(`Unexpected error during signup: ${error}`);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Sync user profile (for Google OAuth and profile updates)
app.post("/make-server-c1d16aa8/auth/sync-profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseAdmin();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.log(`Authorization error while syncing profile: ${authError?.message}`);
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { id, name, email, phone } = await c.req.json();

    // Check if profile exists
    const existingProfile = await kv.get(`user:${user.id}`);

    if (existingProfile) {
      // Update existing profile with new data
      const updatedProfile = {
        ...existingProfile,
        name: name || existingProfile.name,
        email: email || existingProfile.email,
        phone: phone || existingProfile.phone || null,
        updatedAt: new Date().toISOString(),
      };
      await kv.set(`user:${user.id}`, updatedProfile);
      return c.json({ profile: updatedProfile });
    } else {
      // Create new profile (for OAuth users)
      const newProfile = {
        id: user.id,
        email: email || user.email,
        name: name || user.email?.split('@')[0] || 'User',
        phone: phone || null,
        createdAt: new Date().toISOString(),
        bookings: []
      };
      await kv.set(`user:${user.id}`, newProfile);
      return c.json({ profile: newProfile });
    }
  } catch (error) {
    console.log(`Error syncing profile: ${error}`);
    return c.json({ error: "Failed to sync profile" }, 500);
  }
});

// ==================== BOOKING ROUTES ====================

// Save booking endpoint (requires auth)
app.post("/make-server-c1d16aa8/bookings", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseAdmin();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.log(`Authorization error while saving booking: ${authError?.message}`);
      return c.json({ error: "Unauthorized" }, 401);
    }

    const bookingData = await c.req.json();
    
    // Generate booking ID
    const bookingId = `booking:${user.id}:${Date.now()}`;
    
    // Save booking with timestamp
    const booking = {
      ...bookingData,
      id: bookingId,
      userId: user.id,
      createdAt: new Date().toISOString()
    };
    
    await kv.set(bookingId, booking);
    
    // Update user's booking list
    const userData = await kv.get(`user:${user.id}`);
    if (userData) {
      const bookings = userData.bookings || [];
      bookings.unshift(bookingId); // Add to beginning
      userData.bookings = bookings.slice(0, 50); // Keep last 50 bookings
      await kv.set(`user:${user.id}`, userData);
    }

    return c.json({ success: true, booking });
  } catch (error) {
    console.log(`Error saving booking: ${error}`);
    return c.json({ error: "Failed to save booking" }, 500);
  }
});

// Get user's bookings (requires auth)
app.get("/make-server-c1d16aa8/bookings", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseAdmin();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.log(`Authorization error while fetching bookings: ${authError?.message}`);
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get user data with booking IDs
    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData || !userData.bookings || userData.bookings.length === 0) {
      return c.json({ bookings: [] });
    }

    // Fetch all bookings
    const bookings = await kv.mget(userData.bookings);
    
    // Filter out any null values and sort by date
    const validBookings = bookings
      .filter(b => b !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return c.json({ bookings: validBookings });
  } catch (error) {
    console.log(`Error fetching bookings: ${error}`);
    return c.json({ error: "Failed to fetch bookings" }, 500);
  }
});

// Get user profile (requires auth)
app.get("/make-server-c1d16aa8/profile", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseAdmin();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.log(`Authorization error while fetching profile: ${authError?.message}`);
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData) {
      // Create profile if it doesn't exist
      const newUserData = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        createdAt: new Date().toISOString(),
        bookings: []
      };
      await kv.set(`user:${user.id}`, newUserData);
      return c.json({ profile: newUserData });
    }

    return c.json({ profile: userData });
  } catch (error) {
    console.log(`Error fetching profile: ${error}`);
    return c.json({ error: "Failed to fetch profile" }, 500);
  }
});

// ==================== ADMIN ROUTES ====================

// Get all users (admin only)
app.get("/make-server-c1d16aa8/admin/users", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseAdmin();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.log(`Authorization error while fetching all users: ${authError?.message}`);
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get all users from KV store
    const allUsers = await kv.getByPrefix('user:');
    
    // Sort by creation date (newest first)
    const sortedUsers = allUsers.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    // Return user list with summary
    const userSummaries = sortedUsers.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || 'N/A',
      createdAt: user.createdAt,
      totalBookings: (user.bookings || []).length,
    }));

    return c.json({ users: userSummaries });
  } catch (error) {
    console.log(`Error fetching all users: ${error}`);
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

// Get specific user details with bookings (admin only)
app.get("/make-server-c1d16aa8/admin/users/:userId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const supabase = getSupabaseAdmin();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user?.id) {
      console.log(`Authorization error while fetching user details: ${authError?.message}`);
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = c.req.param('userId');
    
    // Get user data
    const userData = await kv.get(`user:${userId}`);
    
    if (!userData) {
      return c.json({ error: "User not found" }, 404);
    }

    // Get all bookings for this user
    let bookings = [];
    if (userData.bookings && userData.bookings.length > 0) {
      bookings = await kv.mget(userData.bookings);
      bookings = bookings
        .filter(b => b !== null)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return c.json({ 
      user: userData,
      bookings: bookings 
    });
  } catch (error) {
    console.log(`Error fetching user details: ${error}`);
    return c.json({ error: "Failed to fetch user details" }, 500);
  }
});

Deno.serve(app.fetch);