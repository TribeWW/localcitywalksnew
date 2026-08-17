/**
 * Spike: can checkout write guidedLanguages in response shape B?
 *
 * Shape B:
 *   activityBookings[].guidedLanguages = [{ type: null, language: "es" }]
 *
 * Flow (test env only):
 * 1. Product + availability
 * 2. options/booking-request with shape B
 * 3. submit RESERVE_FOR_EXTERNAL_PAYMENT
 * 4. GET activity booking — inspect guidedLanguages
 * 5. abort reserved booking
 *
 * Usage: node --env-file-if-exists=.env.local scripts/spike-bokun-guided-language-b.mjs
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";

const PRODUCT_ID = process.env.BOKUN_SPIKE_PRODUCT_ID ?? "15686";
const OUT_DIR = path.join(
  process.cwd(),
  "documentation/investigation/fixtures",
);

const accessKey = process.env.BOKUN_ACCESS_KEY;
const secretKey = process.env.BOKUN_SECRET_KEY;
const domain = process.env.BOKUN_DOMAIN;

if (!accessKey || !secretKey || !domain) {
  console.error("Missing BOKUN_ACCESS_KEY, BOKUN_SECRET_KEY, or BOKUN_DOMAIN");
  process.exit(1);
}

function generateSignature(date, method, apiPath) {
  const encodedPath = apiPath
    .split("?")
    .map((part, index) => (index === 0 ? encodeURI(part) : part))
    .join("?");
  const stringToSign = date + accessKey + method + encodedPath;
  return crypto
    .createHmac("sha1", secretKey)
    .update(stringToSign)
    .digest("base64");
}

function bokunHeaders(method, apiPath) {
  const date = new Date()
    .toISOString()
    .replace(/T/, " ")
    .replace(/\..+/, "")
    .slice(0, 19);
  return {
    "X-Bokun-Date": date,
    "X-Bokun-AccessKey": accessKey,
    "X-Bokun-Signature": generateSignature(date, method, apiPath),
    "Content-Type": "application/json;charset=UTF-8",
  };
}

function bokunBaseUrls() {
  return [`https://${domain}.bokuntest.com`, `https://${domain}.bokun.io`];
}

function bokunUrl(base, apiPath, queryParams) {
  const baseUrl = `${base}${apiPath}`;
  if (!queryParams) return baseUrl;
  return `${baseUrl}?${new URLSearchParams(queryParams).toString()}`;
}

function signedApiPath(apiPath, queryParams) {
  if (!queryParams || Object.keys(queryParams).length === 0) return apiPath;
  return `${apiPath}?${new URLSearchParams(queryParams).toString()}`;
}

async function bokunFetch(method, apiPath, { body, query, base } = {}) {
  if (!base) {
    throw new Error("bokunFetch requires base");
  }
  const pathWithQuery = signedApiPath(apiPath, query);
  const url = bokunUrl(base, apiPath, query);
  const headers = bokunHeaders(method, pathWithQuery);
  const res = await fetch(url, {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json };
}

function writeFixture(name, data) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `bokun-guided-language-b-${name}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`Wrote ${file}`);
}

function toIsoDate(epochMs) {
  return new Date(epochMs).toISOString().slice(0, 10);
}

function resolveCategoryMapping(pricingCategories) {
  const aliases = {
    adults: ["ADULT"],
    youth: ["TEENAGER", "YOUTH"],
    children: ["CHILD"],
    infants: ["INFANT"],
  };
  const mapping = {};
  for (const [field, list] of Object.entries(aliases)) {
    const match = pricingCategories?.find((category) => {
      const ticket = category.ticketCategory?.toUpperCase();
      const title = category.title?.trim().toUpperCase();
      return list.some((alias) => ticket === alias || title === alias);
    });
    if (match) mapping[field] = match.id;
  }
  return mapping.adults != null ? mapping : null;
}

function expandPassengers(participants, categoryIds) {
  const passengers = [];
  for (const [field, categoryId] of Object.entries(categoryIds)) {
    if (categoryId == null) continue;
    const count = participants[field] ?? 0;
    for (let i = 0; i < count; i++) {
      passengers.push({ pricingCategoryId: categoryId });
    }
  }
  return passengers;
}

function pickLanguageCode(slot, product) {
  const fromSlot = (slot.guidedLanguages ?? [])
    .map((code) => (typeof code === "string" ? code.trim() : ""))
    .filter(Boolean);
  const fromProduct =
    product.guidanceTypes?.find((g) => g.guidanceType === "GUIDED")
      ?.languages ?? [];
  const candidates = [...fromSlot, ...fromProduct]
    .map((code) => String(code).trim())
    .filter(Boolean);

  const preferred =
    candidates.find((code) => code.toLowerCase().startsWith("es")) ??
    candidates.find((code) => !code.toLowerCase().startsWith("en")) ??
    candidates[0] ??
    "es";

  return preferred;
}

function extractGuidedLanguages(payload) {
  const hits = [];

  function walk(value, pathParts) {
    if (value == null) return;
    if (Array.isArray(value)) {
      if (
        pathParts[pathParts.length - 1] === "guidedLanguages" ||
        pathParts[pathParts.length - 1] === "guidedLanguage"
      ) {
        hits.push({ path: pathParts.join("."), value });
      }
      value.forEach((item, index) => walk(item, [...pathParts, String(index)]));
      return;
    }
    if (typeof value === "object") {
      for (const [key, nested] of Object.entries(value)) {
        if (key === "guidedLanguages" || key === "guidedLanguage") {
          hits.push({ path: [...pathParts, key].join("."), value: nested });
        }
        walk(nested, [...pathParts, key]);
      }
    }
  }

  walk(payload, []);
  return hits;
}

const participants = { adults: 1, youth: 0, children: 0, infants: 0 };

const productPath = `/activity.json/${PRODUCT_ID}`;
let productRes = null;
let activeBase = null;

for (const base of bokunBaseUrls()) {
  const res = await bokunFetch("GET", productPath, { base });
  console.log(`Product GET ${base} → ${res.status}`);
  if (res.ok) {
    productRes = res;
    activeBase = base;
    break;
  }
  if (!productRes || res.status !== 401) {
    productRes = res;
  }
}

if (!productRes?.ok || !activeBase) {
  console.error("Product fetch failed");
  process.exit(1);
}

if (!activeBase.includes("bokuntest")) {
  console.error(
    "Refusing to run language spike outside bokuntest:",
    activeBase,
  );
  process.exit(1);
}

const categoryMapping = resolveCategoryMapping(
  productRes.json.pricingCategories,
);
if (!categoryMapping) {
  console.error("No adult pricing category mapping");
  process.exit(1);
}

const start = new Date();
start.setUTCDate(start.getUTCDate() + 7);
const end = new Date(start);
end.setUTCDate(end.getUTCDate() + 21);

const availPath = `/activity.json/${PRODUCT_ID}/availabilities`;
const availRes = await bokunFetch("GET", availPath, {
  base: activeBase,
  query: {
    start: toIsoDate(start.getTime()),
    end: toIsoDate(end.getTime()),
    currency: "EUR",
    lang: "EN",
    includeSoldOut: "false",
  },
});

const slots = Array.isArray(availRes.json)
  ? availRes.json.filter((row) => row && !row.soldOut && !row.unavailable)
  : [];

if (!availRes.ok || !slots[0]) {
  console.error("No available slots");
  writeFixture("00-avail-failure", {
    status: availRes.status,
    body: availRes.json,
  });
  process.exit(1);
}

const slot = slots[0];
const date = toIsoDate(slot.date);
const startTimeId = slot.startTimeId;
const rateId = slot.defaultRateId ?? productRes.json.defaultRateId;
const languageCode = pickLanguageCode(slot, productRes.json);
const passengers = expandPassengers(participants, categoryMapping);

/** Shape B — response-like objects */
const guidedLanguagesShapeB = [{ type: null, language: languageCode }];

const activityBooking = {
  activityId: Number(PRODUCT_ID),
  rateId,
  date,
  startTimeId,
  pickup: false,
  dropoff: false,
  passengers,
  extras: [],
  guidedLanguages: guidedLanguagesShapeB,
};

const bookingRequest = {
  externalBookingReference: `lcw-spike-lang-b-${Date.now()}`,
  mainContactDetails: [
    { questionId: "firstName", values: ["Spike"] },
    { questionId: "lastName", values: ["LangB"] },
    { questionId: "email", values: ["spike-lang-b@localcitywalks.com"] },
    { questionId: "phoneNumber", values: ["+34600000000"] },
  ],
  activityBookings: [activityBooking],
};

console.log("\n--- Shape B request ---");
console.log("Base:", activeBase);
console.log("Product:", PRODUCT_ID);
console.log("Slot:", { date, startTimeId, rateId });
console.log("guidedLanguages sent:", JSON.stringify(guidedLanguagesShapeB));

writeFixture("01-request-activity-booking", activityBooking);
writeFixture("02-booking-request", bookingRequest);

const optionsRes = await bokunFetch(
  "POST",
  "/checkout.json/options/booking-request",
  {
    base: activeBase,
    body: bookingRequest,
    query: { currency: "EUR" },
  },
);

writeFixture("03-options-response", {
  status: optionsRes.status,
  ok: optionsRes.ok,
  body: optionsRes.json,
});

if (!optionsRes.ok) {
  console.error("Options failed", optionsRes.status);
  console.error(JSON.stringify(optionsRes.json, null, 2).slice(0, 2000));
  process.exit(1);
}

const reserveOption = (optionsRes.json?.options ?? []).find((option) => {
  const methods =
    option?.paymentMethods?.allowedMethods ?? option?.allowedMethods ?? [];
  return methods.includes("RESERVE_FOR_EXTERNAL_PAYMENT");
});

if (!reserveOption?.type) {
  console.error("RESERVE_FOR_EXTERNAL_PAYMENT not offered");
  process.exit(1);
}

const submitBody = {
  checkoutOption: reserveOption.type,
  paymentMethod: "RESERVE_FOR_EXTERNAL_PAYMENT",
  source: "DIRECT_REQUEST",
  directBooking: bookingRequest,
  sendNotificationToMainContact: false,
  externalBookingReference: bookingRequest.externalBookingReference,
};

const submitRes = await bokunFetch("POST", "/checkout.json/submit", {
  base: activeBase,
  body: submitBody,
  query: { currency: "EUR" },
});

writeFixture("04-submit-request", submitBody);
writeFixture("05-submit-response", {
  status: submitRes.status,
  ok: submitRes.ok,
  body: submitRes.json,
});

console.log("\n--- Reserve ---");
console.log("Submit:", submitRes.status, submitRes.ok ? "OK" : "FAIL");

const parentCode = submitRes.json?.booking?.confirmationCode ?? null;
const productCode =
  submitRes.json?.booking?.activityBookings?.[0]?.productConfirmationCode ??
  null;
const submitGuided =
  submitRes.json?.booking?.activityBookings?.[0]?.guidedLanguages ?? null;

console.log("Parent confirmation:", parentCode);
console.log("Product confirmation:", productCode);
console.log(
  "guidedLanguages on submit response:",
  JSON.stringify(submitGuided),
);

let activityBookingRes = null;
if (submitRes.ok && (productCode || parentCode)) {
  activityBookingRes = await bokunFetch(
    "GET",
    `/booking.json/activity-booking/${productCode ?? parentCode}`,
    { base: activeBase },
  );
  writeFixture("06-activity-booking", {
    status: activityBookingRes.status,
    ok: activityBookingRes.ok,
    body: activityBookingRes.json,
  });
}

const guidedHits = [
  ...extractGuidedLanguages(submitRes.json),
  ...extractGuidedLanguages(activityBookingRes?.json),
];

const activityGuided = activityBookingRes?.json?.guidedLanguages ?? null;
const expectedLanguagePrefix = languageCode.toLowerCase().slice(0, 2);

const verification = {
  shape: "B",
  languageSent: languageCode,
  requestGuidedLanguages: guidedLanguagesShapeB,
  optionsOk: optionsRes.ok,
  reserveOk: submitRes.ok,
  parentConfirmationCode: parentCode,
  productConfirmationCode: productCode,
  guidedLanguagesOnSubmit: submitGuided,
  guidedLanguagesOnActivityBooking: activityGuided,
  guidedLanguageHits: guidedHits,
  persisted:
    Array.isArray(activityGuided) &&
    activityGuided.some(
      (row) =>
        row &&
        typeof row === "object" &&
        String(row.language ?? "")
          .toLowerCase()
          .startsWith(expectedLanguagePrefix),
    ),
};

writeFixture("07-verification", verification);

if (parentCode) {
  const abortRes = await bokunFetch(
    "GET",
    `/booking.json/${parentCode}/abort-reserved`,
    { base: activeBase },
  );
  writeFixture("08-abort", {
    status: abortRes.status,
    ok: abortRes.ok,
    body: abortRes.json,
  });
  console.log("Abort:", abortRes.status, abortRes.ok ? "OK" : "FAIL");
}

console.log("\n--- Result ---");
console.log(JSON.stringify(verification, null, 2));
console.log(
  verification.persisted
    ? "\nPASS: shape B appears to persist guidedLanguages"
    : "\nFAIL: shape B did not persist guidedLanguages as expected",
);

process.exit(verification.persisted ? 0 : 2);
