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
  supportWhatsApp: "https://wa.me/2347000782672",
  verifyHost: "nrs.gov.ng",
} as const;

/**
 * Gateway reasons are written to follow "The NRS says …", so they start
 * lower-case. Two of the three S10 variants use them as a sentence of their
 * own, which is how "the NRS does not recognise Lekki Beverages Ltd's TIN."
 * shipped with a lower-case T.
 */
function sentence(text: string): string {
  return text ? `${text[0].toUpperCase()}${text.slice(1)}` : text;
}

/** Repeated verbatim across screens. These three carry the trust script. */
export const TRUST = {
  free: "Stampa is free for suppliers — you will never be asked to pay.",
  saved: "Your invoice is saved.",
  notOurNumber: `Stampa did not issue this number. Anyone can check it at ${BRAND.verifyHost}.`,
  antiScam: `Nobody should ever ask you to pay to register. If someone does, call ${BRAND.supportPhone}.`,
} as const;

export const copy = {
  /** The escape hatch, repeated on every dead end. */
  callUs: (phone: string) => `Call ${phone}`,

  // ---- S1 Invite landing ----
  invite: {
    cardLabel: (buyer: string) => `Invitation from ${buyer}`,
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
      no_account: "We do not have an account for this number yet. Ask your customer to invite you.",
      /**
       * The invite link was forwarded and somebody else finished the signup.
       * Never says who: the second person is not entitled to know the first.
       */
      invite_taken: `This invitation is already in use by another number. Call us on ${BRAND.supportPhone}.`,
    },
  },

  // ---- S3 OTP ----
  otp: {
    heading: "Enter the code",
    sentTo: (phone: string) => `Sent to ${phone}.`,
    change: "Change",
    label: "6-digit code",
    cta: "Continue",
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
    cardLabel: "Your business details",
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
    search: {
      label: "Find an invoice",
      placeholder: "Customer, number or item",
      submit: "Find",
      clear: "Show all",
      /** Said out loud on the phone by support, so it names the count first. */
      found: (count: number) => (count === 1 ? "1 invoice found." : `${count} invoices found.`),
      emptyHeading: "Nothing matches that.",
      emptyBody: "Check the spelling, or show all your invoices.",
    },
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
    vatAdded: (percent: string) => `VAT ${percent}% is added for you. You never type it.`,
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
    sms: "Send by SMS",
    copyLink: "Copy",
    copied: "Copied",
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
      why: (reason: string, buyer: string) =>
        `${sentence(reason.replace("your customer's", `${buyer}'s`))}.`,
      next: "This is on your customer's side, not yours. We have told them. We will message you as soon as it is fixed.",
      cta: "Tell me when it is fixed",
      acknowledged: "We will message you when your customer fixes it.",
    },
    neither: {
      heading: "Not stamped yet.",
      finalHeading: "Not stamped.",
      why: (reason: string) => `${sentence(reason)}. This one is with them, not with you.`,
      next: (caseNumber: string) =>
        `We are retrying automatically and we will message you. Case ${caseNumber}.`,
      /**
       * Said only once the retries are spent. The screen must stop promising a
       * retry that is not coming — a supplier who waits on a message that
       * never arrives has been lied to, which is worse than being asked to
       * make a phone call.
       */
      exhausted: (caseNumber: string) =>
        `We tried six times and stopped. Call us with case ${caseNumber} and we will send it by hand.`,
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
    draftHeading: "Not sent yet.",
    draftWhy: "This invoice is saved but has not been sent to the NRS.",
    draftCta: "Review and send",
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
    deleteCardLabel: "What deletion does",
    deleteBody:
      "We will delete your profile, your drafts and your contact details immediately.",
    deleteLaw:
      "Invoices that have already been stamped are tax records. The law requires us to keep them for six years, so those stay. They are no longer linked to your account, and you can download them now.",
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
    overviewEmptyBody: "It takes one CSV and about a minute.",
    overviewExposed: "Vendors not yet compliant",
    overviewLive: "Vendors live on Stampa",
    overviewReceived: "Stamped invoices received",
    overviewWhere: "Where your suppliers are",
    overviewLiveLine: (count: number) => `${count} finished and can send stamped invoices`,
    overviewOpenedLine: (count: number) => `${count} opened the link and stopped`,
    overviewInvitedLine: (count: number) => `${count} invited and have not opened it`,
    overviewMostRecent: (when: string) => `Most recent ${when}.`,
    overviewSeeAll: (count: number) => `See all ${count}`,
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
    /** Said when the vendor master has no import date we can vouch for. */
    exposureMethodUndated: (count: number) =>
      `Based on ${count} vendors in your vendor master and NRS transmission records.`,
    exposureGeneratedAt: (when: string) => `Produced ${when}.`,
    exposureUncheckable: (count: number) =>
      count === 1
        ? "1 vendor could not be checked because their TIN is missing or malformed."
        : `${count} vendors could not be checked because their TIN is missing or malformed.`,
    exposureSeeList: "See the list",
    exposureCta: "Invite these suppliers",
    exposureClear: (total: number) => `Good news — all ${total} vendors are compliant.`,
    exposureLabel: "Input VAT exposure report",
    exposureClearLabel: "Exposure report",
    exposureClearBody:
      "Every vendor we could check has transmitted at least one stamped invoice through Stampa.",
    exposureSpendYours: "Spend figures are the ones in your own upload.",
    exposureSpendAssumed: (perVendor: string) =>
      `Your upload carried no spend column, so this uses a stated assumption of ${perVendor} of annual spend per vendor. Upload a file with a spend column and this becomes your own number.`,
    exposureRate:
      "One quarter of annual spend at the 7.5% standard rate. Vendors with no usable TIN are counted as uncheckable, not as exposed.",
    exposureCompliant: "Compliant",
    exposureNotCompliant: "Not compliant",
    exposureUncheckableLabel: "Could not be checked",
    /**
     * Names the whole again rather than saying "of them". Beside a headline
     * about exposed vendors, "3 of them" reads as three of the two.
     */
    exposureRemaining: (count: number, total: number) =>
      count === 1
        ? `1 of your ${total} vendors has not finished signing up.`
        : `${count} of your ${total} vendors have not finished signing up.`,
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

    signInLabel: "Work email",
    signInErrors: {
      empty: "Enter your work email address.",
      malformed: "That does not look like an email address.",
      not_work_email: "Use your work email.",
      expired: "That link has expired. We will send you another one.",
      used: "That link has already been used. Ask for a new one.",
      invalid: "That link is not valid. Ask for a new one.",
    },

    uploadLabel: "Vendor master",
    uploadKeepHeading: "What we keep",
    uploadHint: "Any column order. We match the headers ourselves and show you what we matched.",
    uploadErrors: {
      no_file: "Choose a file first.",
      too_large: "That file is over 5MB. Split it, or send it to us and we will load it.",
      empty: "That file has no rows in it.",
      unreadable: "We could not read that file. Save it as CSV and try again.",
      expired: "That upload timed out. Choose the file again — it only takes a moment.",
    },

    /** Column names, shared by the mapping screen and every console table. */
    fields: {
      businessName: "Vendor name",
      phone: "Phone number",
      tin: "TIN",
      address: "Address",
      vendorCode: "Vendor code",
      category: "Category",
      bankName: "Bank",
      bankLast4: "Account number",
      annualSpend: "Annual spend",
    },
    mappingSkipped: "Rows we had to skip",
    mappingPreviewHeading: "First five rows, as we read them",
    mappingPreview: "First five rows of the vendor master as parsed",
    mappingChooseAnother: "Choose a different file",
    mappingDiscard: "Discard this upload",
    mappingMoreProblems: (count: number) =>
      count === 1
        ? "And 1 more. Everything else still imports."
        : `And ${count} more. Everything else still imports.`,

    suppliersSearch: "Search suppliers",
    suppliersSearchHint: "Name, phone or vendor code",
    suppliersSearchCta: "Search",
    suppliersFilterAll: "All",
    suppliersFilterNotInvited: "Not invited",
    suppliersNoMatch: "No suppliers match that filter.",
    suppliersClearFilter: "Clear the filter",
    suppliersCaption: "Suppliers and their status",
    detailStatus: "Status",
    suppliersColumns: {
      vendor: "Vendor",
      code: "Code",
      phone: "Phone",
      tin: "TIN",
      status: "Status",
      stamped: "Stamped",
    },

    detailInvited: "Invited",
    detailOpened: "Opened the link",
    detailActivated: "Finished signing up",
    detailLink: "Their link",
    detailPaidInto: "Paid into",
    detailInvoicesHeading: "Their invoices to you",
    detailInvoicesCaption: "Invoices from this supplier",
    detailInvoicesEmpty: "Nothing yet.",
    detailInvoicesEmptyLive: "They have finished signing up but have not sent an invoice.",
    detailInvoicesEmptyNotLive: "They have not finished signing up.",
    detailBack: "Back to suppliers",
    detailBankSource:
      "From your vendor master. Change it there and re-upload — it cannot be edited here, by you or by the supplier.",
    detailNudgeNote: (buyer: string) =>
      `Sends the invitation again in ${buyer}'s name, on WhatsApp with SMS behind it.`,
    notProvided: "Not provided",
    tinMissing: "missing",
    notYet: "Not yet",
    noneSent: "None sent",
    notInYourFile: "Not in your file",

    invoicesCaption: "Stamped invoices received from your suppliers",
    invoicesEmptyBody: "They appear here the moment a supplier's invoice is stamped by the NRS.",
    /**
     * The currency lives in the header, not in every cell. A column of twenty
     * rows each prefixed "NGN" is noise; a column headed "Total (NGN)" is a
     * financial table. Figures standing alone in prose still carry it.
     */
    invoicesColumns: {
      reference: "NRS reference",
      invoice: "Invoice",
      supplier: "Supplier",
      supplierTin: "Supplier TIN",
      vat: "VAT (NGN)",
      total: "Total (NGN)",
      stamped: "Stamped",
    },
    invoicesSummary: (count: number, vat: string) =>
      count === 1
        ? `1 stamped invoice · input VAT ${vat}`
        : `${count} stamped invoices · input VAT ${vat}`,

    /** Stand-ins for a company whose name we somehow do not have. */
    yourCompany: "Your company",
    yourCompanyLower: "your company",
    inviteWho: "Who to invite",
    invitePreview: "Preview",
    invitePreviewLabel: "The message your suppliers will receive",
    inviteNoneSelected: "Tick at least one supplier.",
    inviteAllLive: "Every supplier is already live.",
    inviteUploadFirst: "Upload your vendor list first.",
    inviteCancel: "Cancel",
    inviteChannels:
      "Sent on WhatsApp with SMS behind it. You will see which ones did not reach a number.",

    settingsHeading: "Settings",
    settingsCompanySection: "Company",
    settingsCompany: "Registered name",
    settingsSlug: "Invite code prefix",
    settingsNameNote: (phone: string) =>
      `Your registered name appears at the top of every invitation your suppliers receive. Call ${phone} to change it. We check it against your CAC record first. A supplier deciding whether to trust the link is reading that line.`,
    settingsPlanSection: "Plan",
    settingsPlan: "Plan",
    settingsCap: "Active suppliers",
    settingsCapValue: (live: number, cap: number) => `${live} of ${cap}`,
    settingsBillingNote:
      "We invoice you by email and you pay by bank transfer. There is no card on file and the product never takes one. Suppliers are never charged anything.",
    settingsData: "Your data",
    settingsReupload: "Re-upload vendor master",
    settingsReuploadNote:
      "Re-uploading updates bank details and is the only way they change. Every change is recorded with who did it and when.",
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

  // ---- Navigation and chrome ----
  nav: {
    help: "Help",
    home: "Home",
    signOut: "Sign out",
    console: "Console",
    overview: "Overview",
    suppliers: "Suppliers",
    invoices: "Invoices",
    settings: "Settings",
  },

  /**
   * Strings only a screen reader ever reaches. They are in the catalogue for
   * the same reason the visible ones are: a translator who cannot see them
   * cannot translate them, and an untranslated aria-label is a screen reader
   * dropping into English mid-sentence.
   */
  a11y: {
    supplierHome: `${BRAND.name} home`,
    consoleHome: `${BRAND.name} console`,
    filterByStatus: "Filter by status",
    /** Read before the stamp card, so the amount is announced as an amount. */
    stampedCard: (number: string, amountInWords: string) =>
      `Stamped, invoice ${number}, ${amountInWords}`,
    reviewCard: (number: string) => `Invoice ${number}`,
    /** Announced while a route's skeleton is on screen. */
    loading: "Loading",
  },

  // ---- Shared table chrome ----
  table: {
    truncated: (visible: number, total: number) =>
      `Showing ${visible} of ${total}. Narrow the filter to see the rest.`,
  },

  // ---- Status chips. Six only (Phase 15.1). ----
  status: {
    stamped: "Stamped",
    waiting: "Waiting",
    rejected: "Not stamped",
    offline: "Offline",
    draft: "Draft",
    disputed: "Disputed",
    notInvited: "Not invited",
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
