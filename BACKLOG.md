# Funcoland - Product Backlog

## Infrastructure & Quality

### Testing Infrastructure
- [ ] Set up Jest and React Testing Library
- [ ] Add Vitest for faster unit testing (optional alternative)
- [ ] Configure test database with test environment variables
- [ ] Add test scripts to package.json (test, test:watch, test:coverage)
- [ ] Write initial test suite for critical paths:
  - User authentication flow
  - Game addition and status updates
  - Queue management operations
- [ ] Set up Prisma test helpers for database cleanup

### CI/CD Pipeline
- [ ] Create GitHub Actions workflow for CI
  - Run linting (ESLint + TypeScript)
  - Run type checking
  - Run test suite
  - Run build verification
- [ ] Add branch protection rules (require CI to pass)
- [ ] Set up PR template for consistent reviews

### Vercel Deployment
- [ ] Connect repository to Vercel
- [ ] Configure environment variables in Vercel dashboard
  - DATABASE_URL (production Postgres)
  - NEXTAUTH_URL
  - NEXTAUTH_SECRET
  - IGDB/RAWG API credentials
- [ ] Set up preview deployments for PRs
- [ ] Configure production domain (if applicable)
- [ ] Test database migrations in production environment

---

## Feature Development (Prioritized)

### 1. Tag System ✅
**Goal**: Enable cross-cutting categorization beyond queues

- [x] Database: Create Tag model with many-to-many relationship to Game
- [x] Database: Add migration for tags and GameTag junction table
- [x] API: Create tag CRUD endpoints (create, read, update, delete)
- [x] API: Add tag assignment/removal for games
- [x] UI: Tag selector when adding/editing games
- [x] UI: Tag badges on game cards
- [x] Feature: Tag-based queue filtering

**Not implemented (nice to have):**
- [ ] UI: Standalone tag management page (create/edit/delete tags)
- [ ] Feature: Predefined tag suggestions (RPG, Action, Multiplayer, Short Game, etc.)

### 2. Weekly Play Time Calculator
**Goal**: Show "time until playing" based on weekly availability

- [ ] Database: Add weeklyPlayHours field to User model
- [ ] Database: Migration for user play time settings
- [ ] API: Endpoint to update user weekly play time
- [ ] Service: Calculate "weeks until game" for queued games
  - Formula: (sum of games ahead in queue) ÷ (weeklyHours × 60)
- [ ] UI: User settings page for weekly play time
- [ ] UI: Display "You'll reach this in X weeks" on game cards in queue
- [ ] UI: Queue summary showing total weeks to complete
- [ ] Feature: Adjustable play time per queue (e.g., "8hrs/week for RPGs, 2hrs/week for puzzle games")
- [ ] Feature: Historical tracking of actual play time vs. estimated

### 3. Improved Queue & Category Management
**Goal**: Better organization and filtering of game collections

- [ ] UI: Queue detail page showing all games with stats
- [ ] UI: Drag-and-drop reordering of games in queue
- [ ] UI: Bulk actions (move multiple games to queue, update statuses)
- [ ] UI: Queue filtering by status, tag, time remaining
- [ ] Feature: Queue templates (e.g., "Short Games Queue", "Co-op Games")
- [ ] Feature: Smart queues (auto-populate based on tags/criteria)
- [ ] Feature: Queue sharing/export as text list
- [ ] Feature: Archive completed queues

### 4. Game Detail Pages
**Goal**: Rich view of individual games with all metadata

- [ ] Route: Create /games/[id] dynamic route
- [ ] UI: Game detail page layout
  - Cover image (large)
  - Title, publisher, developer, release date
  - Description
  - Time to beat (main + completionist)
  - Current status and progress
  - Rating (user's personal rating)
  - Notes section
  - Tags
  - Queue membership
- [ ] UI: Quick actions (update status, add to queue, rate)
- [ ] Feature: Link to external sources (IGDB, HowLongToBeat, Steam)
- [ ] Feature: Similar game recommendations

---

## Future Enhancements (Nice to Have)

### User Experience
- [ ] Dashboard customization (reorder widgets, show/hide sections)
- [ ] Dark mode toggle
- [ ] Keyboard shortcuts for common actions
- [ ] Bulk import from Steam/Epic/GOG libraries
- [ ] Export data to CSV/JSON

### Social Features
- [ ] Public profile pages
- [ ] Share queues with friends
- [ ] Game recommendations based on friends' ratings
- [ ] Activity feed (friends' game completions)

### Analytics & Insights
- [ ] Completion rate statistics
- [ ] Genre/tag distribution charts
- [ ] Time tracking accuracy (estimated vs. actual)
- [ ] Monthly/yearly completion reports
- [ ] Average rating by genre/tag

### Advanced Queue Features
- [ ] Queue randomizer (pick next game randomly)
- [ ] Priority system (high/medium/low priority within queue)
- [ ] Seasonal queues (summer games, holiday games)
- [ ] Challenge mode (complete X games in Y weeks)

---

## Technical Debt & Improvements

- [ ] Add input validation with Zod schemas
- [ ] Implement rate limiting for API routes
- [ ] Add API request caching for external services
- [ ] Optimize database queries (add indexes, use query optimization)
- [ ] Add error boundary components for better error handling
- [ ] Implement loading states and skeletons
- [ ] Add toast notifications for user actions
- [ ] Set up monitoring and error tracking (Sentry)
- [ ] Add API documentation (OpenAPI/Swagger)
- [ ] Implement proper logging system
