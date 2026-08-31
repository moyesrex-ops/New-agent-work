/**
 * The message catalogue (Phase 14.6).
 *
 * Every user-visible string lives here, transcribed from the Phase 14.3 copy
 * deck without paraphrase. Two reasons, and the second is the load-bearing one:
 *
 *   1. v1 ships in English but is built for translation, so nothing is
 *      concatenated and every variable is a named parameter.
 *   2. Copy that lives beside a component drifts from the deck. Copy that
 *      lives in one file can be diffed against it.
 *
 * A literal user-facing sentence in a component is a review blocker.
 */

export const BRAND = {
  name: "Stampa",
  supportPhone: "0700-STAMPA",
  supportHours: "8am–8pm",
  verifyHost: "nrs.gov.ng",
} as const;

/** Repeated verbatim across screens. These three carry the trust script. */
export const TRUST = {
  free: "Stampa is free for suppliers — you will never be asked to pay.",
  saved: "Your invoice is saved.",
  notOurNumber: `Stampa did not issue this number. Anyone can check it at ${BRAND.verifyHost}.`,
  antiScam: `Nobody should ever ask you to pay to register. If someone does, call ${BRAND.supportPhone}.`,
} as const;

export const copy = {
  // ---- S1 Invite landing ----
  invite: {
    heading: (buyer: string) => `${buyer} asked you to send your invoices through Stampa.`,
    body: (buyer: string) =>
      `From July 2026 ${buyer} can only pay invoices that carry a government reference number. Stampa gets that number for you.`,
    duration: "It takes about ninety seconds.",
    free: "It is free for suppliers — you will never be asked to pay.",
    cta: "Get started",
    doubt: `Not sure about this? Call us on ${BRAND.supportPhone}.`,
    invalidHeading: "This link is not active.",
    invalidBody: "Ask your customer for a new one.",
    expiredHeading: "This link has expired.",
    expiredBody: "Ask your customer to send you a new one. It only takes them a moment.",
  },

  // ---- S2 Phone entry ----
  phone: {
    heading: "What is your phone number?",
    hint: "We will send you a 6-digit code.",
    label: "Phone number",
    placeholder: "0803 000 0000",
    cta: "Send code",
    privacy: "We use your number to sign you in. We never share it.",
    errors: {
      empty: "Enter your phone number.",
      not_nigerian: "Enter a Nigerian phone number.",
      wrong_length: "A Nigerian mobile number has 11 digits.",
      not_a_mobile: "That does not look like a mobile number.",
      rate_limited: "Too many codes requested. Wait fifteen minutes, or call us.",
    },
  },

  // ---- S3 OTP ----
  otp: {
    heading: "Enter the code",
    sentTo: (phone: string) => `Sent to ${phone}.`,
    change: "Change",
    label: "6-digit code",
    resendPrompt: "Did not arrive?",
    resend: "Resend",
    resendIn: (seconds: number) => `Resend in ${seconds}s`,
    voice: "Call me instead",
    errors: {
      wrong_code: "That code is not right. Check the last message.",
      expired: "That code has expired. Ask for a new one.",
      no_challenge: "Ask for a new code.",
      locked_out: `Too many tries. Wait a few minutes, or call us on ${BRAND.supportPhone}.`,
    },
  },

  // ---- S4 Confirm business ----
  confirm: {
    heading: "Is this your business?",
    source: (buyer: string) => `${buyer} sent us these details.`,
    businessName: "Business name",
    tin: "TIN",
    address: "Address",
    paidInto: "Paid into",
    bankLocked:
      "Your bank details come from your customer and cannot be changed here. If they are wrong, tell your customer directly. This protects you from fraud.",
    cta: "This is correct",
    wrong: "Something is wrong",
    missingTin: "We do not have your TIN. Add it so your invoices can be stamped.",
  },

  // ---- S5 Home ----
  home: {
    title: "Your invoices",
    cta: "New invoice",
    emptyHeading: "No invoices yet.",
    emptyBody: "Your first one takes about ninety seconds.",
    cached: (when: string) => `Showing your saved list from ${when}.`,
  },

  // ---- S6 / S7 New invoice ----
  invoice: {
    newHeading: "New invoice",
    to: "To",
    locked: "locked",
    what: "What did you supply?",
    whatPlaceholder: "Aluminium railings",
    quantity: "Quantity",
    unitPrice: "Price each",
    subtotal: "Subtotal",
    vat: (percent: string) => `VAT ${percent}%`,
    total: "Total",
    review: "Review",
    reviewHeading: "Check before you send",
    reviewBody: "This is exactly what goes to the NRS.",
    send: "Send to NRS",
    back: "Change something",
    showAll: "Show all",
    confirmLarge: (amount: string) => `This invoice is for ${amount}. Is that right?`,
    errors: {
      description: "Say what you supplied.",
      quantity: "Enter how many.",
      unitPrice: "Enter the price for one.",
      zeroTotal: "The total cannot be zero.",
    },
    disabledReason: "Fill in what you supplied, the quantity and the price.",
  },

  // ---- S8 Sending ----
  sending: {
    heading: "Sending to NRS",
    estimate: "This takes about 20 seconds.",
    permission: "Your invoice is saved. You can close the app — we will message you when it is done.",
    slowHeading: "Taking longer than usual.",
    slowBody:
      "The NRS is slow right now. We are still trying and we will message you when it is done. Nothing is lost.",
  },

  // ---- S9 Stamped ----
  stamped: {
    heading: "Stamped.",
    invoiceLine: (number: string, buyer: string) => `Invoice ${number} to ${buyer}`,
    including: (vat: string) => `including VAT ${vat}`,
    reference: "NRS reference",
    at: (when: string) => `Stamped ${when}`,
    disclaimer: TRUST.notOurNumber,
    share: "Send on WhatsApp",
    download: "Download PDF",
    shared: "Sent to your customer",
    qrFailed: "Read the reference number below to check it.",
    shareText: (params: { number: string; supplier: string; amount: string; irn: string }) =>
      `Invoice ${params.number} from ${params.supplier}. ${params.amount}. NRS reference ${params.irn}. Verify at ${BRAND.verifyHost}.`,
    simulated:
      "Demo mode: this reference came from a test gateway, not from the NRS. It is not a valid tax record.",
  },

  // ---- S10 Not stamped, three causes ----
  notStamped: {
    supplier: {
      heading: "Not stamped.",
      why: (reason: string) => `The NRS says ${reason}.`,
      next: "Check the amounts, then send again.",
      cta: "Edit invoice",
    },
    buyer: {
      heading: "Not stamped.",
      why: (reason: string, buyer: string) => `${reason.replace("your customer's", `${buyer}'s`)}.`,
      next: "This is on your customer's side, not yours. We have told them. We will message you as soon as it is fixed.",
      cta: "Tell me when it is fixed",
      acknowledged: "We will message you when your customer fixes it.",
    },
    neither: {
      heading: "Not stamped yet.",
      why: (reason: string) => `${reason[0].toUpperCase()}${reason.slice(1)}. This one is with them, not with you.`,
      next: (caseNumber: string) =>
        `We are retrying automatically and we will message you. Case ${caseNumber}.`,
      cta: "Call us",
    },
    saved: TRUST.saved,
  },

  // ---- S11 Offline ----
  offline: {
    banner: "No network. Saved. We will send it when you are back online.",
    heading: "No network.",
    body: "Saved. We will send it when you are back online.",
  },

  // ---- S12 Invoice detail ----
  detail: {
    share: "Share",
    reshare: "Send again",
    lines: "What you supplied",
  },

  // ---- S13 Help ----
  help: {
    heading: "Need help?",
    call: (phone: string, hours: string) => `Call ${phone}, ${hours}.`,
    whatsapp: "Message us on WhatsApp",
    reply: "We usually reply in a few minutes.",
    freeHeading: "Stampa is free for suppliers.",
    freeBody: TRUST.antiScam,
    closed: "We are closed now. Send a message and we will reply from 8am.",
  },

  // ---- S14 / S15 Account ----
  account: {
    heading: "Your account",
    dataHeading: "Your data",
    download: "Download everything",
    downloadBody: "Every stamped invoice as a PDF, plus a CSV of the lot.",
    signOut: "Sign out",
    deleteLink: "Delete my account",
    deleteHeading: "Delete your account",
    deleteBody:
      "We will delete your profile, your drafts and your contact details immediately.",
    deleteLaw:
      "Invoices that have already been stamped are tax records. The law requires them to be kept for six years, so those stay — but they are no longer linked to your account, and you can download them now.",
    deleteFirst: "Download everything first",
    deleteConfirmLabel: "Type DELETE to confirm",
    deleteCta: "Delete my account",
    deleteBlocked:
      "One of your invoices is still being sent to the NRS. We cannot delete your account until that finishes. Try again in a few minutes.",
    deleted: "Your account is deleted. Thank you for using Stampa.",
  },

  // ---- Notifications (Flow 6). Every one deep-links to the screen that
  // resolves it. None of them ever says "you have an update". ----
  notify: {
    stamped: (params: { number: string; buyer: string; amount: string; irn: string }) =>
      `Stamped. ${params.number} to ${params.buyer}, ${params.amount}. ${params.irn}.`,
    rejectedSupplier: (params: { number: string; reason: string }) =>
      `${params.number} was not stamped. The NRS says ${params.reason}. Open it, fix the amounts and send again. Nothing is lost.`,
    rejectedBuyer: (params: { number: string; buyer: string }) =>
      `${params.number} was not stamped. The problem is on ${params.buyer}'s side, not yours. We have told them and we will message you when it is fixed.`,
    rejectedNeither: (params: { number: string; caseNumber: string }) =>
      `${params.number} is not stamped yet. The NRS is not responding. We are retrying and we will message you. Case ${params.caseNumber}.`,
    nudge: (buyer: string) =>
      `You opened the ${buyer} invoice link but did not finish. It takes about ninety seconds and it is free. Pick up where you left off:`,
    otp: (code: string) => `${code} is your Stampa code. We will never ask you for it.`,
  },

  // ---- Buyer console ----
  buyer: {
    signInHeading: "Sign in",
    signInBody: "We will email you a link. No password.",
    signInCta: "Send magic link",
    signInSent: (email: string) => `Check ${email} for your link.`,
    signInWorkEmail: "Use your work email.",
    overviewHeading: "Overview",
    overviewEmpty: "Upload your vendor list to see your exposure.",
    uploadHeading: "Upload your vendor list",
    uploadBody: "CSV or XLSX. We read it, keep eight fields, and delete the file.",
    uploadCta: "Upload",
    uploadSample: "Download a sample CSV",
    uploadRowError: (row: number, problem: string) => `Row ${row}: ${problem}`,
    mappingHeading: "Check the columns",
    mappingBody: "We matched these automatically. Change any that are wrong.",
    mappingCta: "Confirm mapping",
    mappingMissing: (column: string) => `We could not find a column for ${column}.`,
    mappingRecovered: (count: number) =>
      count === 1
        ? "1 TIN had a leading zero restored."
        : `${count} TINs had a leading zero restored.`,
    exposureHeading: (exposed: number, total: number) =>
      `${exposed} of your ${total} vendors have never sent a compliant invoice.`,
    exposureSubhead: "Estimated input VAT at risk this quarter",
    exposureMethod: (count: number, date: string) =>
      `Based on ${count} vendors uploaded on ${date} and NRS transmission records.`,
    exposureUncheckable: (count: number) =>
      count === 1
        ? "1 vendor could not be checked because their TIN is missing or malformed."
        : `${count} vendors could not be checked because their TIN is missing or malformed.`,
    exposureSeeList: "See the list",
    exposureCta: "Invite these suppliers",
    exposureClear: (total: number) => `Good news — all ${total} vendors are compliant.`,
    suppliersHeading: "Suppliers",
    suppliersEmpty: "No suppliers yet.",
    inviteHeading: (count: number) => (count === 1 ? "Invite 1 supplier" : `Invite ${count} suppliers`),
    inviteBody: (buyer: string) =>
      `They will receive this from ${buyer}, on WhatsApp and SMS.`,
    inviteMessage: (buyer: string, link: string) =>
      `${buyer}: From now on we can only pay invoices with an NRS reference number. Use this free link to send yours: ${link}. It takes about ninety seconds. You will never be asked to pay for it.`,
    inviteEdit: "Edit message",
    inviteCta: "Send invitations",
    inviteSent: (count: number) => (count === 1 ? "1 invitation sent." : `${count} invitations sent.`),
    inviteFailed: (count: number) =>
      count === 1 ? "1 could not be sent." : `${count} could not be sent.`,
    invoicesHeading: "Inbound invoices",
    invoicesEmpty: "No stamped invoices yet.",
    exportCta: "Export CSV",
    nudge: "Nudge",
    nudged: "Nudged",
  },

  // ---- Operator console ----
  operator: {
    banner: "OPERATOR — actions are logged",
    metricsHeading: "Today",
    northStar: "Invoices stamped",
    failuresHeading: "Failure queue",
    failuresEmpty: "Nothing failed. Check again after the next batch.",
    retry: "Retry",
    retryGroup: (count: number) => `Retry all ${count}`,
    lookupHeading: "Lookup",
    lookupPlaceholder: "Phone, TIN, invoice number or IRN",
    lookupEmpty: "Nothing matched. Try the invoice number.",
    reasonLabel: "Why are you opening this record?",
    reasonRequired: "A reason is required. It is written to the audit log.",
    correctTin: "Correct TIN",
    flagsHeading: "Flags",
    suspend: "Suspend",
    dismiss: "Dismiss",
    auditHeading: "Audit log",
  },

  // ---- Status chips. Six only (Phase 15.1). ----
  status: {
    stamped: "Stamped",
    waiting: "Waiting",
    rejected: "Not stamped",
    offline: "Offline",
    draft: "Draft",
    disputed: "Disputed",
    invited: "Invited",
    opened: "Opened",
    live: "Live",
    stuck: "Stuck",
  },

  // ---- Framework-level errors, in brand voice rather than a stack trace ----
  errors: {
    notFoundHeading: "That page is not here.",
    notFoundBody: "The link may be old. Go back to your invoices, or call us.",
    notFoundCta: "Go to my invoices",
    serverHeading: "Something broke on our side.",
    serverBody: "Not on yours. Nothing you saved is lost. Try again in a moment.",
    serverCta: "Try again",
    generic: "That did not work. Try again, or call us.",
  },
} as const;

/** Dates and times are locale-correct from v1: "14 Sep 2026", "10:42 WAT". */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Fixed to West Africa Time (UTC+1). Nigeria does not observe DST. */
function toWat(date: Date): Date {
  return new Date(date.getTime() + 60 * 60 * 1000);
}

export function formatDate(date: Date): string {
  const wat = toWat(date);
  return `${wat.getUTCDate()} ${MONTHS[wat.getUTCMonth()]} ${wat.getUTCFullYear()}`;
}

export function formatDateTime(date: Date): string {
  const wat = toWat(date);
  const hours = wat.getUTCHours().toString().padStart(2, "0");
  const minutes = wat.getUTCMinutes().toString().padStart(2, "0");
  return `${formatDate(date)}, ${hours}:${minutes} WAT`;
}

export function formatRelative(date: Date, now: Date = new Date()): string {
  const minutes = Math.round((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  return formatDate(date);
}
