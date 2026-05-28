/**
 * templateEngine.ts
 *
 * Pure TypeScript engine for personalising outreach email templates.
 * All functions are stateless and side-effect-free — safe to call from
 * server components, API routes, or client-side preview panels.
 *
 * Variable syntax: {{snake_case_key}}
 * Unknown tokens are left verbatim so a malformed template never silently
 * discards content and is easy to spot during QA.
 */

import type { Physician } from '@/types'

// ─── Public types ────────────────────────────────────────────────────────────

/**
 * Metadata for a single supported template variable.
 * The array of these is exported as TEMPLATE_VARIABLES so UI components
 * (variable pickers, tooltip helpers, etc.) can render without hard-coding
 * token strings.
 */
export interface TemplateVariable {
  /** Full token as it appears in a template, e.g. `{{doctor_name}}` */
  key: string
  /** Short human-readable label, e.g. "Doctor Name" */
  label: string
  /** One-line explanation shown in tooltips or variable-picker descriptions */
  description: string
}

// ─── Supported-variable catalogue ────────────────────────────────────────────

/**
 * Ordered list of every token the engine recognises.
 *
 * Consume this in the campaign-builder UI to render a variable picker so
 * users never have to remember exact token spellings.
 *
 * @example
 * TEMPLATE_VARIABLES.map(v => (
 *   <button key={v.key} onClick={() => insertToken(v.key)}>{v.label}</button>
 * ))
 */
export const TEMPLATE_VARIABLES: readonly TemplateVariable[] = [
  {
    key:         '{{doctor_name}}',
    label:       'Doctor Name',
    description: 'Formal last-name salutation — e.g. "Dr. Smith"',
  },
  {
    key:         '{{first_name}}',
    label:       'First Name',
    description: "Physician's given name — e.g. \"Alice\"",
  },
  {
    key:         '{{last_name}}',
    label:       'Last Name',
    description: "Physician's surname — e.g. \"Smith\"",
  },
  {
    key:         '{{full_name}}',
    label:       'Full Name',
    description: 'Formal full salutation — e.g. "Dr. Alice Smith"',
  },
  {
    key:         '{{specialty}}',
    label:       'Specialty',
    description: 'Primary medical specialty — e.g. "Cardiology"',
  },
  {
    key:         '{{sub_specialty}}',
    label:       'Sub-specialty',
    description: 'Sub-specialty when available, otherwise falls back to primary specialty',
  },
  {
    key:         '{{affiliation}}',
    label:       'Affiliation',
    description: 'Hospital or practice name — e.g. "Mayo Clinic"',
  },
  {
    key:         '{{city}}',
    label:       'City',
    description: "Physician's city — e.g. \"Rochester\"",
  },
  {
    key:         '{{state}}',
    label:       'State',
    description: 'Two-letter state abbreviation — e.g. "MN"',
  },
  {
    key:         '{{npi}}',
    label:       'NPI',
    description: '10-digit National Provider Identifier',
  },
] as const

// ─── Internal resolver map ────────────────────────────────────────────────────

/**
 * Maps every known token to a function that extracts its value from a
 * Physician record. Built once at module load — O(1) lookup per token.
 *
 * Keeping resolvers here (rather than inline in replaceTemplateVars) means
 * new tokens only require a single-line addition to this object.
 */
type ResolverMap = Readonly<Record<string, (p: Physician) => string>>

const RESOLVERS: ResolverMap = {
  '{{doctor_name}}':   (p) => `Dr. ${p.lastName}`,
  '{{first_name}}':    (p) => p.firstName,
  '{{last_name}}':     (p) => p.lastName,
  '{{full_name}}':     (p) => `Dr. ${p.firstName} ${p.lastName}`,
  '{{specialty}}':     (p) => p.specialty,
  // Fall back to primary specialty when sub-specialty is absent
  '{{sub_specialty}}': (p) => p.subSpecialty ?? p.specialty,
  '{{affiliation}}':   (p) => p.affiliation,
  '{{city}}':          (p) => p.city,
  '{{state}}':         (p) => p.state,
  '{{npi}}':           (p) => p.npi,
}

/** Matches every `{{...}}` token in a string, including unknown ones. */
const TOKEN_RE = /\{\{[^}]+\}\}/g

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Replaces all supported `{{variable}}` tokens in `template` with their
 * resolved values from `physician`. Tokens that are not in the known set are
 * left unchanged — no error is thrown, no content is silently dropped.
 *
 * The function is pure: it never mutates its arguments and has no side effects.
 *
 * @param template  - Raw email subject or body string that may contain tokens
 * @param physician - Physician record used to resolve token values
 * @returns         A new string with all known tokens substituted
 *
 * @example
 * const body = 'Dear {{doctor_name}},\nYour NPI {{npi}} is on file.'
 * replaceTemplateVars(body, physician)
 * // → 'Dear Dr. Johnson,\nYour NPI 1234567890 is on file.'
 *
 * @example Unknown token is preserved
 * replaceTemplateVars('Hello {{unknown}}', physician)
 * // → 'Hello {{unknown}}'
 */
export function replaceTemplateVars(template: string, physician: Physician): string {
  return template.replace(TOKEN_RE, (token) => {
    const resolve = RESOLVERS[token]
    return resolve ? resolve(physician) : token
  })
}

/**
 * Wraps every `{{variable}}` token in the template with a `<mark>` tag so
 * the preview panel can highlight them visually. Both known and unknown tokens
 * are wrapped — this lets authors see any typos at a glance.
 *
 * @param template - Raw template string (subject or body)
 * @returns        HTML string with tokens wrapped in
 *                 `<mark class="template-var">{{...}}</mark>`
 *
 * @example
 * highlightTemplateVars('Hi {{doctor_name}}, welcome to {{unknown}}!')
 * // → 'Hi <mark class="template-var">{{doctor_name}}</mark>, welcome to <mark class="template-var">{{unknown}}</mark>!'
 */
export function highlightTemplateVars(template: string): string {
  return template.replace(
    TOKEN_RE,
    (token) => `<mark class="template-var">${token}</mark>`,
  )
}
