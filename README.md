# LinkMe - Swiss-Styled Proximity Networking

LinkMe is a Next.js application enabling users to discover professional or personal connections within a specific geographic radius (500m - 2km).

## Tech Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Swiss Design System)
- **Database:** Supabase (PostgreSQL)
- **Auth:** NextAuth.js (Google OAuth)
- **Maps:** Implementation ready for Google Maps JS API

## Getting Started

### 1. Environment Setup
Create a `.env.local` file in the root:

```bash
DATABASE_URL=postgresql://postgres:111@Supabase111@db.rhgbghiznkqrvdbqufmq.supabase.co:5432/postgres
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-strong-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-key
```

### 2. Database Migration
Run the SQL commands found in `supabase/schema.sql` in your Supabase SQL Editor to set up the tables for Users, Profiles, Locations, Connections, and Messages.

### 3. Installation & Run
```bash
pnpm install
pnpm dev
```

## Developer Notes

### Proximity Logic
We use the Haversine formula to calculate spherical distance between the authenticated user and other users in the `locations` table.
- **Client:** Used for immediate UI sorting and display.
- **Server (`/api/fetch-nearby`):** Used for secure filtering. We fetch candidate locations and filter server-side to ensure privacy settings (Visibility: 'nearby' vs 'private') are respected before sending data to the client.

### Realtime Presence
Supabase Realtime is used to subscribe to `messages` table for chat. For location updates, we implement a throttle mechanism:
- Client sends update max once every 10s.
- Server records update.
- Clients subscribe to `locations` changes (filtered by RLS) to move markers on the map live.

### Styling (Swiss Style)
We adhere to a strict grid system.
- Font: Helvetica Neue / Inter.
- Colors: High contrast B&W with Swiss Red (#E53935) accents.
- Layout: Left-aligned typography, generous padding.

## Testing
Run unit tests for distance calculations:
```bash
pnpm test
```
