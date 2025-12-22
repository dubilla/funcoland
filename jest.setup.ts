import "@testing-library/jest-dom";

// Set test environment variables
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
// NEXTAUTH_URL is auto-detected in tests
process.env.NEXTAUTH_SECRET = "test-secret";
