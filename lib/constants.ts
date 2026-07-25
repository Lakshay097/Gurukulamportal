// Group keys
export const GROUP_KEYS = {
  ADMIN_CENTRAL: 'admin-central',
  INTERNAL_STAFF: 'internal-staff',
  OTHER_INTERNAL: 'other-internal',
} as const;

// Group color tiers
export const COLOR_TIERS = {
  ADMIN: 'admin',
  INTERNAL: 'internal',
  OTHER: 'other',
} as const;

// School status
export const SCHOOL_STATUS = {
  OPERATIONAL: 'Operational',
  UNDER_CONSTRUCTION: 'Under Construction',
  PRE_LAUNCH: 'Pre-Launch',
} as const;

// CBSE status
export const CBSE_STATUS = {
  PROVISIONAL: 'Provisional',
  PERMANENT: 'Permanent',
} as const;

// Fire NOC status
export const FIRE_NOC_STATUS = {
  GREEN: 'green',
  AMBER: 'amber',
  RED: 'red',
} as const;

// Facilities
export const FACILITIES = [
  'Science Labs',
  'Library',
  'Sports Complex',
  'Auditorium',
  'Smart Classrooms',
  'Transport',
  'Hostel',
  'Health Room',
] as const;

// Document section types
export const DOC_SECTION_TYPES = {
  SOP: 'SOP',
  DRAFT: 'Draft',
  DUE_DILIGENCE: 'DueDiligence',
  AGREEMENT: 'Agreement',
  LOI: 'LOI',
  SCHOOL_OPTION: 'SchoolOption',
  CBSE_RULES: 'CBSERules',
} as const;

// Document type labels
export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  [DOC_SECTION_TYPES.SOP]: 'Standard Operating Procedures',
  [DOC_SECTION_TYPES.DRAFT]: 'Draft Documents',
  [DOC_SECTION_TYPES.DUE_DILIGENCE]: 'Due Diligence Reports',
  [DOC_SECTION_TYPES.AGREEMENT]: 'Agreements',
  [DOC_SECTION_TYPES.LOI]: 'Letters of Intent',
  [DOC_SECTION_TYPES.SCHOOL_OPTION]: 'School Options',
  [DOC_SECTION_TYPES.CBSE_RULES]: 'CBSE Rules',
};

// Document section status
export const DOC_SECTION_STATUS = {
  AVAILABLE: 'available',
  COMING_SOON: 'coming-soon',
} as const;

// Permission rule resource types
export const RESOURCE_TYPES = {
  DOCUMENT_SECTION: 'document_section',
  NAV_ITEM: 'nav_item',
  SCHOOL_FIELD: 'school_field',
} as const;

// Permission rule access levels
export const ACCESS_LEVELS = {
  VIEW: 'view',
  EDIT: 'edit',
  NONE: 'none',
} as const;

// Empty state variants
export const EMPTY_STATE_VARIANTS = {
  COMING_SOON: 'coming-soon',
  RESTRICTED: 'restricted',
  ERROR: 'error',
} as const;

// School slugs
export const SCHOOL_SLUGS = [
  'jaipur',
  'gurugram',
  'suratgarh',
  'varanasi',
  'gwalior',
  'bhopal',
  'ranchi',
  'lucknow',
  'motihari',
  'muzaffarpur',
  'faridabad',
  'indore',
] as const;

// Root Drive folder ID - should be set in environment variables
export const ROOT_DRIVE_FOLDER_ID = process.env.ROOT_DRIVE_FOLDER_ID || '';

