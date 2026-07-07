/**
 * Loads `.env.local` (and standard Vite env files) into `process.env`.
 *
 * Node 20-compatible alternative to `node --env-file-if-exists=.env.local`.
 */

import { loadEnv } from "vite";

Object.assign(
  process.env,
  loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), ""),
);
