import { findCountryByCode } from "@/data/country-codes";

export interface FormattedDocument {
  countryCode: string;
  documentNumber: string;
  flag: string;
  displayText: string;
  isValid: boolean;
}

/**
 * Parses a document ID in the format "BO-6416702" and returns formatted information
 * @param documentId - The document ID string from database (e.g., "BO-6416702")
 * @returns FormattedDocument object with parsed information
 */
export function parseDocumentId(documentId?: string | null): FormattedDocument {
  // Default return object for invalid/empty documents
  const defaultReturn: FormattedDocument = {
    countryCode: "",
    documentNumber: "",
    flag: "",
    displayText: "Pendiente",
    isValid: false,
  };

  if (!documentId || typeof documentId !== "string") {
    return defaultReturn;
  }

  // Check if the document follows the expected format "COUNTRY-NUMBER"
  const parts = documentId.split("-");
  if (parts.length !== 2) {
    return defaultReturn;
  }

  const [countryCode, documentNumber] = parts;

  // Validate country code and document number
  if (!countryCode || !documentNumber || countryCode.length !== 2) {
    return defaultReturn;
  }

  // Find the country information
  const country = findCountryByCode(countryCode.toUpperCase());
  if (!country) {
    return defaultReturn;
  }

  return {
    countryCode: countryCode.toUpperCase(),
    documentNumber,
    flag: country.flag,
    displayText: `${country.flag} ${countryCode.toUpperCase()}-${documentNumber}`,
    isValid: true,
  };
}

/**
 * Formats a document ID for display in the UI
 * @param documentId - The document ID string from database
 * @returns Formatted string ready for display
 */
export function formatDocumentForDisplay(documentId?: string | null): string {
  const parsed = parseDocumentId(documentId);
  return parsed.displayText;
}

/**
 * Gets just the country flag from a document ID
 * @param documentId - The document ID string from database
 * @returns Country flag emoji or empty string
 */
export function getDocumentCountryFlag(documentId?: string | null): string {
  const parsed = parseDocumentId(documentId);
  return parsed.isValid ? parsed.flag : "";
}

/**
 * Gets the document type name based on country code
 * @param countryCode - The country code (e.g., "BO", "US", "BR")
 * @returns Document type name in Spanish
 */
export function getDocumentTypeName(countryCode?: string): string {
  if (!countryCode) return "Documento";

  const documentTypes: Record<string, string> = {
    BO: "DNI",
    US: "SSN",
    BR: "CPF",
    AR: "DNI",
    PE: "DNI",
    CO: "CC",
    ES: "DNI/NIE",
    MX: "CURP",
    CL: "RUT",
    UY: "CI",
    PY: "CI",
    EC: "CI",
    VE: "CI",
    PA: "CI",
    CR: "CI",
    GT: "DPI",
    HN: "DNI",
    SV: "DUI",
    NI: "CI",
    CU: "CI",
    DO: "CI",
    HT: "CI",
    JM: "TRN",
    PR: "SSN",
    GB: "NI Number",
    DE: "Personalausweis",
    FR: "CNI",
    IT: "CI",
    PT: "CC",
    NL: "BSN",
    BE: "NN",
    CH: "ID",
    AT: "Personalausweis",
    SE: "Personnummer",
    NO: "Fødselsnummer",
    DK: "CPR",
    FI: "Henkilötunnus",
    PL: "PESEL",
    CZ: "OP",
    SK: "OP",
    HU: "Személyi",
    RO: "CNP",
    BG: "ЕГН",
    HR: "OIB",
    SI: "EMŠO",
    LT: "AK",
    LV: "PK",
    EE: "IK",
    IE: "PPS",
    LU: "ID",
    MT: "ID",
    CY: "ID",
    GR: "ΑΔΤ",
    TR: "TC",
    RU: "Паспорт",
    UA: "ID",
    BY: "ID",
    MD: "IDNP",
    RS: "JMBG",
    BA: "JMBG",
    ME: "JMBG",
    MK: "EMBG",
    AL: "ID",
    XK: "ID",
    CA: "SIN",
    AU: "TFN",
    NZ: "IRD",
    JP: "マイナンバー",
    KR: "주민등록번호",
    CN: "身份证",
    IN: "Aadhaar",
    PK: "CNIC",
    BD: "NID",
    LK: "NIC",
    TH: "ID",
    VN: "CCCD",
    MY: "MyKad",
    SG: "NRIC",
    PH: "ID",
    ID: "KTP",
    EG: "رقم قومي",
    SA: "هوية",
    AE: "Emirates ID",
    IL: "ת.ז.",
    ZA: "ID",
    NG: "NIN",
    KE: "ID",
    GH: "ID",
    ET: "ID",
    TZ: "ID",
    UG: "ID",
    RW: "ID",
    ZM: "ID",
    ZW: "ID",
    BW: "Omang",
    NA: "ID",
    SZ: "ID",
    LS: "ID",
    MW: "ID",
    MZ: "ID",
    AO: "BI",
    CD: "ID",
    CG: "ID",
    CM: "CNI",
    GA: "CNI",
    CF: "CNI",
    TD: "CNI",
    NE: "CNI",
    BF: "CNI",
    ML: "CNI",
    SN: "CNI",
    GM: "ID",
    GW: "BI",
    GN: "CNI",
    SL: "ID",
    LR: "ID",
    CI: "CNI",
    TG: "CNI",
    BJ: "CNI",
    DZ: "CNI",
    TN: "CIN",
    LY: "رقم قومي",
    MA: "CNI",
    MR: "CNI",
  };

  return documentTypes[countryCode.toUpperCase()] || "Documento";
}
