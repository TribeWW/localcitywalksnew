/**
 * Spike: answer main-contact Language question as "es" on product 15683
 * and check whether booking.activityBookings[].guidedLanguages is populated.
 *
 * Discovers question from checkout options (questionId "language").
 * Confirms on bokuntest so the booking is visible in Bókun UI.
 *
 * Usage:
 *   node --env-file-if-exists=.env.local scripts/spike-bokun-language-question.mjs
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";

const PRODUCT_ID = process.env.BOKUN_SPIKE_PRODUCT_ID ?? "15683";
const LANGUAGE_VALUE = process.env.BOKUN_SPIKE_LANGUAGE ?? "es";
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

function signedApiPath(apiPath, queryParams) {
  if (!queryParams || Object.keys(queryParams).length === 0) return apiPath;
  return `${apiPath}?${new URLSearchParams(queryParams).toString()}`;
}

function bokunUrl(base, apiPath, queryParams) {
  const baseUrl = `${base}${apiPath}`;
  if (!queryParams) return baseUrl;
  return `${baseUrl}?${new URLSearchParams(queryParams).toString()}`;
}

async function bokunFetch(method, apiPath, { body, query, base } = {}) {
  if (!base) throw new Error("bokunFetch requires base");
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
  const file = path.join(OUT_DIR, `bokun-language-question-${name}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log(`Wrote ${file}`);
}

function toIsoDate(epochMs) {
  return new Date(epochMs).toISOString().slice(0, 10);
}

function resolveAdultCategoryId(pricingCategories) {
  const match = pricingCategories?.find((category) => {
    const ticket = category.ticketCategory?.toUpperCase();
    const title = category.title?.trim().toUpperCase();
    return ticket === "ADULT" || title === "ADULT";
  });
  return match?.id ?? null;
}

function findLanguageQuestion(optionsBody) {
  const main = optionsBody?.questions?.mainContactDetails ?? [];
  return (
    main.find(
      (q) =>
        q?.questionId === "language" ||
        String(q?.label ?? "")
          .trim()
          .toLowerCase() === "language",
    ) ?? null
  );
}

const productPath = `/activity.json/${PRODUCT_ID}`;
let productRes = null;
let activeBase = null;

for (const base of bokunBaseUrls()) {
  const res = await bokunFetch("GET", productPath, {
    base,
    query: { lang: "EN", currency: "EUR" },
  });
  console.log(`Product GET ${base} → ${res.status}`);
  if (res.ok) {
    productRes = res;
    activeBase = base;
    break;
  }
}

if (!productRes?.ok || !activeBase) {
  console.error("Product fetch failed");
  process.exit(1);
}

if (!activeBase.includes("bokuntest")) {
  console.error("Refusing to confirm outside bokuntest:", activeBase);
  process.exit(1);
}

console.log("Product:", productRes.json?.title);

const adultCategoryId = resolveAdultCategoryId(
  productRes.json.pricingCategories,
);
if (adultCategoryId == null) {
  console.error("No adult pricing category");
  process.exit(1);
}

const start = new Date();
start.setUTCDate(start.getUTCDate() + 3);
const end = new Date(start);
end.setUTCDate(end.getUTCDate() + 21);

const availRes = await bokunFetch(
  "GET",
  `/activity.json/${PRODUCT_ID}/availabilities`,
  {
    base: activeBase,
    query: {
      start: toIsoDate(start.getTime()),
      end: toIsoDate(end.getTime()),
      currency: "EUR",
      lang: "EN",
      includeSoldOut: "false",
    },
  },
);

const slots = (Array.isArray(availRes.json) ? availRes.json : []).filter(
  (row) => row && !row.soldOut && !row.unavailable,
);
const slot = slots[0];
if (!slot) {
  console.error("No available slots");
  process.exit(1);
}

const date = toIsoDate(slot.date);
const startTimeId = slot.startTimeId;
const rateId = slot.defaultRateId ?? productRes.json.defaultRateId;

const bookingRequest = {
  externalBookingReference: `lcw-spike-lang-q-${Date.now()}`,
  mainContactDetails: [
    { questionId: "firstName", values: ["Spike"] },
    { questionId: "lastName", values: ["LangQuestion"] },
    { questionId: "email", values: ["spike-lang-q@localcitywalks.com"] },
    { questionId: "phoneNumber", values: ["+34600000000"] },
    { questionId: "language", values: [LANGUAGE_VALUE] },
  ],
  activityBookings: [
    {
      activityId: Number(PRODUCT_ID),
      rateId,
      date,
      startTimeId,
      pickup: false,
      dropoff: false,
      passengers: [{ pricingCategoryId: adultCategoryId }],
      extras: [],
    },
  ],
};

console.log("\n--- Slot ---");
console.log({ date, startTimeId, rateId, language: LANGUAGE_VALUE });

const optionsRes = await bokunFetch(
  "POST",
  "/checkout.json/options/booking-request",
  {
    base: activeBase,
    body: bookingRequest,
    query: { currency: "EUR" },
  },
);

writeFixture("01-options-request", bookingRequest);
writeFixture("02-options-response", {
  status: optionsRes.status,
  ok: optionsRes.ok,
  body: optionsRes.json,
});

if (!optionsRes.ok) {
  console.error("Options failed", optionsRes.status);
  console.error(JSON.stringify(optionsRes.json, null, 2).slice(0, 2000));
  process.exit(1);
}

const languageQuestion = findLanguageQuestion(optionsRes.json);
writeFixture("03-language-question", languageQuestion);

if (!languageQuestion) {
  console.error('No main-contact question with questionId/label "language"');
  process.exit(1);
}

const optionValues = (languageQuestion.answerOptions ?? []).map((o) => o.value);
if (!optionValues.includes(LANGUAGE_VALUE)) {
  console.error(
    `Language value "${LANGUAGE_VALUE}" not in answerOptions`,
    optionValues.filter(Boolean).slice(0, 20),
  );
  process.exit(1);
}

console.log("Language question:", {
  questionId: languageQuestion.questionId,
  label: languageQuestion.label,
  dataFormat: languageQuestion.dataFormat,
  required: languageQuestion.required,
  answeredWith: LANGUAGE_VALUE,
});

const reserveOption = (optionsRes.json?.options ?? []).find((option) => {
  const methods =
    option?.paymentMethods?.allowedMethods ?? option?.allowedMethods ?? [];
  return methods.includes("RESERVE_FOR_EXTERNAL_PAYMENT");
});

if (!reserveOption?.type || typeof reserveOption.amount !== "number") {
  console.error("Reserve option unavailable or missing amount");
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

console.log("\n--- Reserve ---", submitRes.status, submitRes.ok ? "OK" : "FAIL");

if (!submitRes.ok) {
  console.error(JSON.stringify(submitRes.json, null, 2).slice(0, 2000));
  process.exit(1);
}

const parentCode = submitRes.json?.booking?.confirmationCode;
const productCode =
  submitRes.json?.booking?.activityBookings?.[0]?.productConfirmationCode;

if (!parentCode) {
  console.error("No confirmation code");
  process.exit(1);
}

const confirmBody = {
  amount: reserveOption.amount,
  currency: reserveOption.currency || "EUR",
  sendNotificationToMainContact: false,
  showPricesInNotification: false,
  externalBookingReference: bookingRequest.externalBookingReference,
  transactionDetails: {
    transactionDate: new Date().toISOString().slice(0, 19).replace("T", " "),
    transactionId: `lcw-spike-lang-q-${Date.now()}`,
    cardBrand: "VISA",
    last4: "4242",
  },
};

const confirmRes = await bokunFetch(
  "POST",
  `/checkout.json/confirm-reserved/${parentCode}`,
  {
    base: activeBase,
    body: confirmBody,
  },
);

writeFixture("06-confirm-request", confirmBody);
writeFixture("07-confirm-response", {
  status: confirmRes.status,
  ok: confirmRes.ok,
  body: confirmRes.json,
});

console.log("--- Confirm ---", confirmRes.status, confirmRes.ok ? "OK" : "FAIL");

const activityBookingRes = await bokunFetch(
  "GET",
  `/booking.json/activity-booking/${productCode ?? parentCode}`,
  { base: activeBase },
);

writeFixture("08-activity-booking", {
  status: activityBookingRes.status,
  ok: activityBookingRes.ok,
  body: activityBookingRes.json,
});

const bookingGetRes = await bokunFetch(
  "GET",
  `/booking.json/booking/${parentCode}`,
  { base: activeBase, query: { currency: "EUR", lang: "EN" } },
);

writeFixture("09-booking", {
  status: bookingGetRes.status,
  ok: bookingGetRes.ok,
  body: bookingGetRes.json,
});

const guidedOnSubmit =
  submitRes.json?.booking?.activityBookings?.[0]?.guidedLanguages ?? null;
const guidedOnConfirm =
  confirmRes.json?.booking?.activityBookings?.[0]?.guidedLanguages ?? null;
const guidedOnActivity = activityBookingRes.json?.guidedLanguages ?? null;
const guidedOnBooking =
  bookingGetRes.json?.activityBookings?.[0]?.guidedLanguages ?? null;

const customerLanguage =
  bookingGetRes.json?.customer?.language ??
  confirmRes.json?.booking?.customer?.language ??
  null;

const bookingFields =
  activityBookingRes.json?.bookingFields ??
  bookingGetRes.json?.activityBookings?.[0]?.bookingFields ??
  null;

const verification = {
  productId: PRODUCT_ID,
  productTitle: productRes.json?.title ?? null,
  languageQuestionId: languageQuestion.questionId,
  languageAnswered: LANGUAGE_VALUE,
  parentConfirmationCode: parentCode,
  productConfirmationCode: productCode ?? null,
  reserveOk: submitRes.ok,
  confirmOk: confirmRes.ok,
  guidedLanguagesOnSubmit: guidedOnSubmit,
  guidedLanguagesOnConfirm: guidedOnConfirm,
  guidedLanguagesOnActivityBooking: guidedOnActivity,
  guidedLanguagesOnBooking: guidedOnBooking,
  customerLanguage,
  bookingFields,
  guidedLanguagesPopulated: [guidedOnSubmit, guidedOnConfirm, guidedOnActivity, guidedOnBooking].some(
    (value) =>
      Array.isArray(value) &&
      value.some(
        (row) =>
          row &&
          typeof row === "object" &&
          String(row.language ?? "")
            .toLowerCase()
            .startsWith(LANGUAGE_VALUE.toLowerCase()),
      ),
  ),
};

writeFixture("10-verification", verification);

console.log("\n--- Result ---");
console.log(JSON.stringify(verification, null, 2));
console.log(
  verification.guidedLanguagesPopulated
    ? "\nPASS: guidedLanguages populated after Language question answer"
    : "\nFAIL: Language question answered, but guidedLanguages still empty",
);
console.log(
  `\nBooking should be visible in Bókun test: ${parentCode} / ${productCode}`,
);

process.exit(verification.guidedLanguagesPopulated ? 0 : 2);
