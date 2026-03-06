import { z } from "zod";

const EnvSchema = z.object({
  NEXT_PUBLIC_API_BASE: z.string().url().optional(),
  NEXT_PUBLIC_BACKEND_URL: z.string().url().optional()
});

function normalizeBaseUrl(raw: string): string {
  // Remove trailing slash to avoid double slashes in requests.
  return raw.replace(/\/+$/, "");
}

// PUBLIC_INTERFACE
export function getApiBaseUrl(): string {
  /**
   * Returns the backend API base URL used for all REST calls.
   *
   * Contract:
   * - Inputs: Reads NEXT_PUBLIC_API_BASE or NEXT_PUBLIC_BACKEND_URL
   * - Output: URL string without trailing slash
   * - Errors: throws if neither env var is provided or values are invalid URLs
   */
  const parsed = EnvSchema.safeParse({
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL
  });

  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }

  const url = parsed.data.NEXT_PUBLIC_API_BASE ?? parsed.data.NEXT_PUBLIC_BACKEND_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_API_BASE (or NEXT_PUBLIC_BACKEND_URL) for backend API calls.");
  }
  return normalizeBaseUrl(url);
}
