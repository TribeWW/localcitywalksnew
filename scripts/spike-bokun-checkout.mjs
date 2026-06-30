/**
 * One-off spike for LOC-1100 — Bókun checkout options + reserve flow.
 * Usage: node --env-file-if-exists=.env.local scripts/spike-bokun-checkout.mjs
 * Output: documentation/investigation/fixtures/bokun-checkout-spike-{step}.json
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

/**
 * Vendor test admin: https://{domain}.bokuntest.com/
 * Production API: https://{domain}.bokun.io/
 * (api.bokuntest.com is a separate generic sandbox — not LCW test channel)
 */
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
    throw new Error(
      "bokunFetch requires base URL (set activeBase from product probe)",
    );
  }
  const signPath = signedApiPath(apiPath, query);
  const url = bokunUrl(base, apiPath, query);
  const res = await fetch(url, {
    method,
    headers: bokunHeaders(method, signPath),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, ok: res.ok, json };
}

function writeFixture(name, data) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `bokun-checkout-spike-${name}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`Wrote ${file}`);
}

function toIsoDate(epochMs) {
  return new Date(epochMs).toISOString().slice(0, 10);
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

const TICKET_CATEGORY_ALIASES = {
  adults: ["ADULT"],
  youth: ["TEENAGER", "YOUTH"],
  children: ["CHILD"],
  infants: ["INFANT"],
};

/** Mirrors `resolveWidgetCategoryMapping` in calculate-booking-quote.ts */
function resolveCategoryMapping(pricingCategories) {
  const mapping = {};
  for (const [field, aliases] of Object.entries(TICKET_CATEGORY_ALIASES)) {
    const match = pricingCategories?.find((category) => {
      const ticket = category.ticketCategory?.toUpperCase();
      const title = category.title?.trim().toUpperCase();
      return aliases.some((alias) => ticket === alias || title === alias);
    });
    if (match) mapping[field] = match.id;
  }
  return mapping.adults != null ? mapping : null;
}

const participants = { adults: 2, youth: 0, children: 0, infants: 0 };

// --- 1. Product detail ---
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
    activeBase = base;
  }
}

function normalizeAvailabilities(json) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.availabilities)) return json.availabilities;
  return [];
}

if (!productRes?.ok) {
  console.error("Product fetch failed", productRes?.status);
  console.error(JSON.stringify(productRes?.json, null, 2)?.slice(0, 1500));
  process.exit(1);
}

const categoryMapping = resolveCategoryMapping(
  productRes.json.pricingCategories,
);
if (!categoryMapping) {
  console.error(
    "Could not resolve pricing category mapping from product detail",
  );
  process.exit(1);
}
console.log("Category mapping:", categoryMapping);

writeFixture("01-product-detail", {
  activeBase,
  productId: PRODUCT_ID,
  status: productRes.status,
  title: productRes.json?.title,
  bookingType: productRes.json?.bookingType,
  capacityType: productRes.json?.capacityType,
  defaultRateId: productRes.json?.defaultRateId,
  mainContactFields: productRes.json?.mainContactFields,
  requiredCustomerFields: productRes.json?.requiredCustomerFields,
  startTimes: productRes.json?.startTimes,
  pricingCategories: productRes.json?.pricingCategories,
  guidanceTypes: productRes.json?.guidanceTypes,
  categoryMapping,
});

// --- 2. Availabilities ---
const start = new Date();
start.setUTCDate(start.getUTCDate() + 1);
const end = new Date(start);
end.setUTCDate(end.getUTCDate() + 30);
const startStr = start.toISOString().slice(0, 10);
const endStr = end.toISOString().slice(0, 10);

const availPath = `/activity.json/${PRODUCT_ID}/availabilities`;
const availRes = await bokunFetch("GET", availPath, {
  base: activeBase,
  query: {
    start: startStr,
    end: endStr,
    lang: "EN",
    currency: "EUR",
    includeSoldOut: "false",
  },
});

const slots = normalizeAvailabilities(availRes.json).filter(
  (s) => !s.soldOut && !s.unavailable,
);
writeFixture("02-availabilities-sample", {
  status: availRes.status,
  range: { start: startStr, end: endStr },
  slotCount: slots.length,
  rawShape: Array.isArray(availRes.json) ? "array" : typeof availRes.json,
  firstSlot: slots[0] ?? null,
});

if (!availRes.ok) {
  console.error("Availability fetch failed", availRes.status);
  console.error(JSON.stringify(availRes.json, null, 2).slice(0, 2000));
  process.exit(1);
}

const slot = slots[0];
if (!slot) {
  console.error("No available slots in range");
  process.exit(1);
}
const date = toIsoDate(slot.date);
const startTimeId = slot.startTimeId;
const rateId = slot.defaultRateId ?? productRes.json.defaultRateId;
const slotGuidedLanguage =
  slot.guidedLanguages?.[0] ??
  productRes.json.guidanceTypes?.find((g) => g.guidanceType === "GUIDED")
    ?.languages?.[0];

// --- 3. Checkout options ---
const passengers = expandPassengers(participants, categoryMapping);

const activityBooking = {
  activityId: Number(PRODUCT_ID),
  rateId,
  date,
  startTimeId,
  pickup: false,
  dropoff: false,
  passengers,
  extras: [],
};
if (slotGuidedLanguage) {
  activityBooking.guidedLanguage = slotGuidedLanguage;
}

const bookingRequest = {
  externalBookingReference: `lcw-spike-${Date.now()}`,
  mainContactDetails: [],
  activityBookings: [activityBooking],
};

// --- 3. Checkout options (discover questions + payment methods) ---
const optionsPath = "/checkout.json/options/booking-request";
let optionsRes = await bokunFetch("POST", optionsPath, {
  base: activeBase,
  body: bookingRequest,
  query: { currency: "EUR" },
});

writeFixture("03-checkout-options-request-initial", bookingRequest);
writeFixture("04-checkout-options-response", {
  status: optionsRes.status,
  body: optionsRes.json,
});

if (!optionsRes.ok) {
  console.error("Checkout options failed", optionsRes.status);
  console.error(JSON.stringify(optionsRes.json, null, 2).slice(0, 2000));
  process.exit(1);
}

// Fill required main contact answers from options response
bookingRequest.mainContactDetails = [
  { questionId: "firstName", values: ["Spike"] },
  { questionId: "lastName", values: ["Test"] },
  { questionId: "email", values: ["spike-test@localcitywalks.com"] },
  { questionId: "phoneNumber", values: ["+34600000000"] },
];

writeFixture("03-checkout-options-request", bookingRequest);

const options = optionsRes.json?.options ?? [];
const checkoutOption = options[0]?.type;
const allowedMethods =
  options[0]?.paymentMethods?.allowedMethods ??
  options[0]?.allowedMethods ??
  [];
const hasReserve = allowedMethods.includes("RESERVE_FOR_EXTERNAL_PAYMENT");

console.log("Checkout option:", checkoutOption);
console.log("Allowed methods:", allowedMethods);
console.log("Has RESERVE_FOR_EXTERNAL_PAYMENT:", hasReserve);

// --- 4. Reserve + confirm (test domain only) ---
const isTestEnv = activeBase.includes("bokuntest");

if (hasReserve && isTestEnv) {
  const submitBody = {
    checkoutOption,
    paymentMethod: "RESERVE_FOR_EXTERNAL_PAYMENT",
    source: "DIRECT_REQUEST",
    directBooking: bookingRequest,
    sendNotificationToMainContact: false,
    externalBookingReference: bookingRequest.externalBookingReference,
  };

  const submitPath = "/checkout.json/submit";
  const submitRes = await bokunFetch("POST", submitPath, {
    base: activeBase,
    body: submitBody,
    query: { currency: "EUR" },
  });

  writeFixture("05-checkout-submit-request", submitBody);
  writeFixture("06-checkout-submit-response", {
    status: submitRes.status,
    body: submitRes.json,
  });

    const confirmPath = `/checkout.json/confirm-reserved/${confirmationCode}`;
    const confirmationAmount = options[0]?.amount;
    if (typeof confirmationAmount !== "number") {
      console.error("Cannot confirm reserved booking: checkout option amount missing");
      console.error(JSON.stringify(options[0] ?? null, null, 2));
      process.exit(1);
    }
    const confirmBody = {
      amount: confirmationAmount,
      currency: "EUR",
      sendNotificationToMainContact: true,
      transactionDetails: {
        transactionDate: new Date()
          .toISOString()
          .replace("T", " ")
          .slice(0, 19),
        transactionId: `pi_spike_${Date.now()}`,
        cardBrand: "visa",
        last4: "4242",
      },
    };          .replace("T", " ")
          .slice(0, 19),
        transactionId: `pi_spike_${Date.now()}`,
        cardBrand: "visa",
        last4: "4242",
      },
    };

    const confirmRes = await bokunFetch("POST", confirmPath, {
      base: activeBase,
      body: confirmBody,
      query: { currency: "EUR" },
    });

    writeFixture("07-confirm-reserved-request", confirmBody);
    writeFixture("08-confirm-reserved-response", {
      status: confirmRes.status,
      body: confirmRes.json,
    });

    console.log("Confirm reserved:", confirmRes.status);
    if (confirmRes.ok) {
      const productCode =
        confirmRes.json?.booking?.activityBookings?.[0]
          ?.productConfirmationCode;
      console.log("Product confirmation code:", productCode);
    }
  } else {
    console.error("Reserve failed or no confirmation code");
  }
} else {
  console.log("Skipping reserve step (no RESERVE method or not test domain)");
}

console.log("Spike complete.");
