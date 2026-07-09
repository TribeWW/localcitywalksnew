/**
 * One-off spike for LOC-1100 — Bókun checkout options + reserve flow.
 *
 * Verifies:
 * - Checkout options questions (main contact + booking questions)
 * - Reserve submit fails when phone is required but omitted
 * - Activity booking `note` field accepts special-request text
 *
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

function createSpikeExternalRef(suffix) {
  return `lcw-spike-${suffix}-${Date.now()}`;
}

function buildMainContactDetails({ includePhone = true } = {}) {
  const details = [
    { questionId: "firstName", values: ["Spike"] },
    { questionId: "lastName", values: ["Test"] },
    { questionId: "email", values: ["spike-test@localcitywalks.com"] },
  ];

  if (includePhone) {
    details.push({ questionId: "phoneNumber", values: ["+34600000000"] });
  }

  return details;
}

/**
 * Pulls question-like arrays from checkout options responses for fixture logging.
 * Bókun may nest questions under options, activityBookings, or top-level keys.
 */
function extractCheckoutOptionsQuestions(optionsBody) {
  const extracted = {
    topLevelQuestions: optionsBody?.questions ?? null,
    mainContactQuestions: optionsBody?.mainContactDetails ?? null,
    bookingAnswers: optionsBody?.bookingAnswers ?? null,
    perOption: [],
    perActivityBooking: [],
  };

  for (const option of optionsBody?.options ?? []) {
    extracted.perOption.push({
      type: option?.type,
      questions: option?.questions ?? null,
      paymentQuestions: option?.paymentQuestions ?? null,
      bookingAnswers: option?.bookingAnswers ?? null,
      activityBookings: (option?.activityBookings ?? []).map((row) => ({
        activityId: row?.activityId,
        questions: row?.questions ?? null,
        answers: row?.answers ?? null,
      })),
    });
  }

  for (const row of optionsBody?.activityBookings ?? []) {
    extracted.perActivityBooking.push({
      activityId: row?.activityId,
      questions: row?.questions ?? null,
      answers: row?.answers ?? null,
    });
  }

  return extracted;
}

function logOptionsQuestions(label, optionsBody) {
  const extracted = extractCheckoutOptionsQuestions(optionsBody);
  console.log(`\n--- Checkout options questions (${label}) ---`);
  console.log(
    "Top-level questions:",
    extracted.topLevelQuestions ? "present" : "none",
  );
  console.log(
    "Main contact questions:",
    extracted.mainContactQuestions ? "present" : "none",
  );
  console.log(
    "Booking answers template:",
    extracted.bookingAnswers ? "present" : "none",
  );

  for (const row of extracted.perOption) {
    const questionCount = Array.isArray(row.questions)
      ? row.questions.length
      : 0;
    const activityQuestionCount = row.activityBookings.reduce(
      (sum, activity) =>
        sum +
        (Array.isArray(activity.questions) ? activity.questions.length : 0),
      0,
    );
    console.log(
      `Option ${row.type}: ${questionCount} option-level question(s), ${activityQuestionCount} activity question(s)`,
    );
  }

  return extracted;
}

function resolveCheckoutOption(optionsBody) {
  const options = optionsBody?.options ?? [];
  const checkoutOption = options[0]?.type;
  const allowedMethods =
    options[0]?.paymentMethods?.allowedMethods ??
    options[0]?.allowedMethods ??
    [];
  const hasReserve = allowedMethods.includes("RESERVE_FOR_EXTERNAL_PAYMENT");

  return {
    options,
    checkoutOption,
    allowedMethods,
    hasReserve,
    amount: options[0]?.amount,
  };
}

async function fetchCheckoutOptions(activeBase, bookingRequest) {
  const optionsPath = "/checkout.json/options/booking-request";
  return bokunFetch("POST", optionsPath, {
    base: activeBase,
    body: bookingRequest,
    query: { currency: "EUR" },
  });
}

async function submitReserveCheckout(
  activeBase,
  bookingRequest,
  checkoutOption,
) {
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

  return { submitBody, submitRes };
}

async function abortReservedBooking(activeBase, confirmationCode) {
  const path = `/booking.json/${confirmationCode}/abort-reserved`;
  return bokunFetch("POST", path, { base: activeBase });
}

async function fetchActivityBooking(activeBase, productConfirmationCode) {
  const path = `/booking.json/activity-booking/${productConfirmationCode}`;
  return bokunFetch("GET", path, { base: activeBase });
}

function findNoteInPayload(payload, needle) {
  const hits = [];

  function walk(value, pathParts) {
    if (value == null) return;

    if (typeof value === "string") {
      if (needle && value.includes(needle)) {
        hits.push({ path: pathParts.join("."), value });
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, [...pathParts, String(index)]));
      return;
    }

    if (typeof value === "object") {
      for (const [key, nested] of Object.entries(value)) {
        if (
          (key === "note" || key === "notes" || key === "body") &&
          typeof nested === "string" &&
          needle &&
          nested.includes(needle)
        ) {
          hits.push({ path: [...pathParts, key].join("."), value: nested });
        }
        walk(nested, [...pathParts, key]);
      }
    }
  }

  walk(payload, []);
  return hits;
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

const phoneRequiredFromProduct =
  productRes.json?.mainContactFields?.some(
    (field) => field.field === "PHONE_NUMBER" && field.required,
  ) ||
  productRes.json?.requiredCustomerFields?.includes("phoneNumber") ||
  false;

console.log("Product requires phone:", phoneRequiredFromProduct);

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
  phoneRequiredFromProduct,
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

// --- 3. Build shared activity booking skeleton ---
const passengers = expandPassengers(participants, categoryMapping);

function buildActivityBooking({ note } = {}) {
  const row = {
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
    row.guidedLanguage = slotGuidedLanguage;
  }

  if (note) {
    row.note = note;
  }

  return row;
}

function buildBookingRequest({ includePhone = true, note, externalRef } = {}) {
  return {
    externalBookingReference:
      externalRef ?? createSpikeExternalRef(includePhone ? "full" : "nophone"),
    mainContactDetails: buildMainContactDetails({ includePhone }),
    activityBookings: [buildActivityBooking({ note })],
  };
}

// --- 4. Checkout options (discover questions + payment methods) ---
const bookingRequest = buildBookingRequest({
  includePhone: false,
  externalRef: createSpikeExternalRef("options-initial"),
});
bookingRequest.mainContactDetails = [];

let optionsRes = await fetchCheckoutOptions(activeBase, bookingRequest);

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

const initialQuestions = logOptionsQuestions(
  "initial (no contact answers)",
  optionsRes.json,
);
writeFixture("04b-checkout-options-questions-initial", initialQuestions);

bookingRequest.mainContactDetails = buildMainContactDetails({
  includePhone: true,
});
writeFixture("03-checkout-options-request", bookingRequest);

const {
  checkoutOption,
  allowedMethods,
  hasReserve,
  amount: checkoutAmount,
} = resolveCheckoutOption(optionsRes.json);

console.log("Checkout option:", checkoutOption);
console.log("Allowed methods:", allowedMethods);
console.log("Has RESERVE_FOR_EXTERNAL_PAYMENT:", hasReserve);

const isTestEnv = activeBase.includes("bokuntest");

// --- 5. Missing phone reserve test ---
const missingPhoneRequest = buildBookingRequest({
  includePhone: false,
  externalRef: createSpikeExternalRef("missing-phone"),
});

const missingPhoneOptionsRes = await fetchCheckoutOptions(
  activeBase,
  missingPhoneRequest,
);

writeFixture("09-missing-phone-options-request", missingPhoneRequest);
writeFixture("09-missing-phone-options-response", {
  status: missingPhoneOptionsRes.status,
  ok: missingPhoneOptionsRes.ok,
  body: missingPhoneOptionsRes.json,
});

const missingPhoneQuestions = logOptionsQuestions(
  "missing phone (first/last/email only)",
  missingPhoneOptionsRes.json,
);

writeFixture("09b-missing-phone-options-questions", missingPhoneQuestions);

let missingPhoneSubmitRes = null;
let missingPhoneSubmitBody = null;
let missingPhoneConfirmationCode = null;
let missingPhoneAbortRes = null;

if (hasReserve && isTestEnv && missingPhoneOptionsRes.ok) {
  const missingPhoneOption = resolveCheckoutOption(missingPhoneOptionsRes.json);
  if (missingPhoneOption.checkoutOption) {
    ({ submitBody: missingPhoneSubmitBody, submitRes: missingPhoneSubmitRes } =
      await submitReserveCheckout(
        activeBase,
        missingPhoneRequest,
        missingPhoneOption.checkoutOption,
      ));

    if (missingPhoneSubmitRes?.ok) {
      missingPhoneConfirmationCode =
        missingPhoneSubmitRes.json?.booking?.confirmationCode?.trim() || null;

      if (missingPhoneConfirmationCode) {
        missingPhoneAbortRes = await abortReservedBooking(
          activeBase,
          missingPhoneConfirmationCode,
        );
      }
    }
  }
}

writeFixture("09c-missing-phone-submit-request", missingPhoneSubmitBody);
writeFixture("09d-missing-phone-submit-response", {
  status: missingPhoneSubmitRes?.status ?? null,
  ok: missingPhoneSubmitRes?.ok ?? null,
  body: missingPhoneSubmitRes?.json ?? null,
  expectedFailure: phoneRequiredFromProduct,
  observedFailure: missingPhoneSubmitRes ? !missingPhoneSubmitRes.ok : null,
  unexpectedSuccessConfirmationCode: missingPhoneConfirmationCode,
  unexpectedSuccessAborted: missingPhoneAbortRes?.ok ?? null,
});
writeFixture("09e-missing-phone-abort-response", {
  status: missingPhoneAbortRes?.status ?? null,
  ok: missingPhoneAbortRes?.ok ?? null,
  body: missingPhoneAbortRes?.json ?? null,
  confirmationCode: missingPhoneConfirmationCode,
});

console.log("\n--- Missing phone reserve test ---");
console.log("Product requires phone:", phoneRequiredFromProduct);
console.log(
  "Reserve without phone:",
  missingPhoneSubmitRes
    ? missingPhoneSubmitRes.ok
      ? "SUCCEEDED (unexpected if phone required)"
      : `FAILED (${missingPhoneSubmitRes.status})`
    : "skipped",
);
if (missingPhoneConfirmationCode) {
  console.log(
    "Unexpected reserve aborted:",
    missingPhoneAbortRes?.ok ? "yes" : "no",
    missingPhoneConfirmationCode,
  );
}

// --- 6. Activity booking `note` field test ---
const NOTE_TEST_TEXT =
  "LCW spike special request: please accommodate gluten-free tasting.";
const noteTestRequest = buildBookingRequest({
  includePhone: true,
  note: NOTE_TEST_TEXT,
  externalRef: createSpikeExternalRef("note-test"),
});

let noteTestOptionsRes = null;
let noteTestSubmitRes = null;
let noteTestSubmitBody = null;
let noteTestActivityBookingRes = null;
let noteVerification = {
  noteSent: NOTE_TEST_TEXT,
  reserveSucceeded: null,
  productConfirmationCode: null,
  parentConfirmationCode: null,
  noteHits: [],
  noteVisibleAfterReserve: false,
};

if (hasReserve && isTestEnv) {
  noteTestOptionsRes = await fetchCheckoutOptions(activeBase, noteTestRequest);
  writeFixture("10-note-test-options-request", noteTestRequest);
  writeFixture("10-note-test-options-response", {
    status: noteTestOptionsRes.status,
    body: noteTestOptionsRes.json,
  });

  const noteOption = resolveCheckoutOption(noteTestOptionsRes.json);
  if (noteTestOptionsRes.ok && noteOption.checkoutOption) {
    ({ submitBody: noteTestSubmitBody, submitRes: noteTestSubmitRes } =
      await submitReserveCheckout(
        activeBase,
        noteTestRequest,
        noteOption.checkoutOption,
      ));

    noteVerification.reserveSucceeded = noteTestSubmitRes.ok;
    noteVerification.parentConfirmationCode =
      noteTestSubmitRes.json?.booking?.confirmationCode ?? null;
    noteVerification.productConfirmationCode =
      noteTestSubmitRes.json?.booking?.activityBookings?.[0]
        ?.productConfirmationCode ?? null;

    if (noteTestSubmitRes.ok) {
      const lookupCode =
        noteVerification.productConfirmationCode ??
        noteVerification.parentConfirmationCode;

      if (lookupCode) {
        noteTestActivityBookingRes = await fetchActivityBooking(
          activeBase,
          lookupCode,
        );
        noteVerification.noteHits = findNoteInPayload(
          noteTestActivityBookingRes.json,
          NOTE_TEST_TEXT,
        );
        noteVerification.noteVisibleAfterReserve =
          noteVerification.noteHits.length > 0;
      }

      if (noteVerification.parentConfirmationCode) {
        const abortRes = await abortReservedBooking(
          activeBase,
          noteVerification.parentConfirmationCode,
        );
        writeFixture("10-note-test-abort-response", {
          status: abortRes.status,
          ok: abortRes.ok,
          body: abortRes.json,
        });
      }
    }
  }
}

writeFixture("10-note-test-submit-request", noteTestSubmitBody);
writeFixture("10-note-test-submit-response", {
  status: noteTestSubmitRes?.status ?? null,
  ok: noteTestSubmitRes?.ok ?? null,
  body: noteTestSubmitRes?.json ?? null,
});
writeFixture("10-note-test-activity-booking", {
  status: noteTestActivityBookingRes?.status ?? null,
  ok: noteTestActivityBookingRes?.ok ?? null,
  body: noteTestActivityBookingRes?.json ?? null,
  verification: noteVerification,
});

console.log("\n--- Activity booking note test ---");
console.log("Note sent on request:", NOTE_TEST_TEXT);
console.log(
  "Reserve with note:",
  noteTestSubmitRes
    ? noteTestSubmitRes.ok
      ? "SUCCEEDED"
      : `FAILED (${noteTestSubmitRes.status})`
    : "skipped",
);
console.log(
  "Note visible on activity booking GET:",
  noteVerification.noteVisibleAfterReserve,
);
if (noteVerification.noteHits.length > 0) {
  console.log(
    "Note hit paths:",
    noteVerification.noteHits.map((hit) => hit.path),
  );
}

// --- 7. Happy-path reserve + confirm (original spike) ---
if (hasReserve && isTestEnv) {
  const happyPathRequest = buildBookingRequest({
    includePhone: true,
    externalRef: createSpikeExternalRef("happy-path"),
  });

  const happyOptionsRes = await fetchCheckoutOptions(
    activeBase,
    happyPathRequest,
  );
  const happyOption = resolveCheckoutOption(happyOptionsRes.json);

  if (happyOptionsRes.ok && happyOption.checkoutOption) {
    const { submitBody, submitRes } = await submitReserveCheckout(
      activeBase,
      happyPathRequest,
      happyOption.checkoutOption,
    );

    writeFixture("05-checkout-submit-request", submitBody);
    writeFixture("06-checkout-submit-response", {
      status: submitRes.status,
      body: submitRes.json,
    });

    if (submitRes.ok) {
      const confirmationCode = submitRes.json?.booking?.confirmationCode;
      if (!confirmationCode) {
        console.error("Reserve succeeded but no confirmation code in response");
        console.error(JSON.stringify(submitRes.json, null, 2).slice(0, 2000));
        process.exit(1);
      }

      const confirmPath = `/checkout.json/confirm-reserved/${confirmationCode}`;
      const confirmationAmount = happyOption.amount ?? checkoutAmount;
      if (typeof confirmationAmount !== "number") {
        console.error(
          "Cannot confirm reserved booking: checkout option amount missing",
        );
        console.error(JSON.stringify(happyOption.options[0] ?? null, null, 2));
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

      console.log("\n--- Happy-path confirm ---");
      console.log("Confirm reserved:", confirmRes.status);
      if (confirmRes.ok) {
        const productCode =
          confirmRes.json?.booking?.activityBookings?.[0]
            ?.productConfirmationCode;
        console.log("Product confirmation code:", productCode);
      }
    } else {
      console.error("Happy-path reserve failed", submitRes.status);
      console.error(JSON.stringify(submitRes.json, null, 2).slice(0, 2000));
      process.exit(1);
    }
  }
} else {
  console.log(
    "Skipping happy-path reserve step (no RESERVE method or not test domain)",
  );
}

console.log("\nSpike complete.");
