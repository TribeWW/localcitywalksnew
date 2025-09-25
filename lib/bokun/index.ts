import crypto from "crypto";
import { bokunConfig } from "./config";

/**
 * Core authentication utility for Bokun API
 * Generates HMAC SHA-1 signature required for API requests
 */
export function generateSignature(
  date: string,
  method: string,
  path: string,
  secretKey: string,
  accessKey: string
): string {
  // Ensure path is properly encoded
  const encodedPath = path
    .split("?")
    .map((part, index) => {
      // Don't encode the ? character
      return index === 0 ? encodeURI(part) : part;
    })
    .join("?");

  const stringToSign = date + accessKey + method + encodedPath;

  return crypto
    .createHmac("sha1", secretKey)
    .update(stringToSign)
    .digest("base64");
}

/**
 * Generates standardized headers for Bokun API requests
 */
export function generateBokunHeaders(
  method: string,
  path: string
): HeadersInit {
  const date = new Date()
    .toISOString()
    .replace(/T/, " ")
    .replace(/\..+/, "")
    .slice(0, 19);

  return {
    "X-Bokun-Date": date,
    "X-Bokun-AccessKey": bokunConfig.accessKey,
    "X-Bokun-Signature": generateSignature(
      date,
      method,
      path,
      bokunConfig.secretKey,
      bokunConfig.accessKey
    ),
    "Content-Type": "application/json;charset=UTF-8",
  };
}

/**
 * Creates a fully qualified Bokun API URL with optional query parameters
 */
export function createBokunUrl(
  path: string,
  queryParams?: Record<string, string>
): string {
  const baseUrl = `https://${bokunConfig.domain}.bokun.io${path}`;
  if (!queryParams) return baseUrl;

  const searchParams = new URLSearchParams(queryParams);
  return `${baseUrl}?${searchParams.toString()}`;
}
