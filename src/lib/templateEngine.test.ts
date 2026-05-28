/**
 * Unit tests for templateEngine.ts
 *
 * Jest globals (describe / it / expect) are available without an explicit
 * import when @types/jest is installed. Test cases are also exported as a
 * plain array so they can be inspected or driven from other tooling without
 * requiring a Jest runtime.
 */

import { replaceTemplateVars, highlightTemplateVars, TEMPLATE_VARIABLES } from './templateEngine'
import type { Physician } from '@/types'

// ─── Shared fixture ───────────────────────────────────────────────────────────

const PHYSICIAN: Physician = {
  id:                  'test-uuid-001',
  npi:                 '1234567890',
  firstName:           'Alice',
  lastName:            'Johnson',
  specialty:           'Cardiology',
  subSpecialty:        'Interventional Cardiology',
  affiliation:         'Mayo Clinic',
  city:                'Rochester',
  state:               'MN',
  email:               'alice.johnson@mayo.edu',
  npiRegistrationYear: 2005,
  acceptingPatients:   true,
  boardCertified:      true,
  createdAt:           '2024-01-01T00:00:00.000Z',
}

// ─── Exported test cases ──────────────────────────────────────────────────────
// Exported so the suite can be re-used or introspected without a Jest runtime.

export const testCases: Array<{ name: string; run: () => void }> = [
  {
    name: 'replaces every known template variable in a single pass',
    run() {
      const tpl =
        '{{doctor_name}} | {{first_name}} | {{last_name}} | {{full_name}} | ' +
        '{{specialty}} | {{sub_specialty}} | {{affiliation}} | {{city}} | {{state}} | {{npi}}'

      expect(replaceTemplateVars(tpl, PHYSICIAN)).toBe(
        'Dr. Johnson | Alice | Johnson | Dr. Alice Johnson | ' +
        'Cardiology | Interventional Cardiology | Mayo Clinic | Rochester | MN | 1234567890',
      )
    },
  },

  {
    name: 'leaves unknown tokens verbatim instead of throwing or erasing them',
    run() {
      const result = replaceTemplateVars(
        'Hello {{typo_var}} and {{another_unknown}}',
        PHYSICIAN,
      )
      expect(result).toBe('Hello {{typo_var}} and {{another_unknown}}')
    },
  },

  {
    name: 'falls back to primary specialty when subSpecialty is null',
    run() {
      const noSub: Physician = { ...PHYSICIAN, subSpecialty: null }
      expect(replaceTemplateVars('Focus: {{sub_specialty}}', noSub)).toBe(
        'Focus: Cardiology',
      )
    },
  },

  {
    name: 'highlightTemplateVars wraps both known and unknown tokens in <mark> tags',
    run() {
      const input  = 'Hi {{doctor_name}}, your focus is {{specialty}}. See {{unknown}}.'
      const output = replaceTemplateVars
        ? highlightTemplateVars(input)
        : ''

      expect(highlightTemplateVars(input)).toBe(
        'Hi <mark class="template-var">{{doctor_name}}</mark>, ' +
        'your focus is <mark class="template-var">{{specialty}}</mark>. ' +
        'See <mark class="template-var">{{unknown}}</mark>.',
      )
    },
  },

  {
    name: 'TEMPLATE_VARIABLES exports metadata for all 10 supported tokens',
    run() {
      expect(TEMPLATE_VARIABLES).toHaveLength(10)

      const keys = TEMPLATE_VARIABLES.map((v) => v.key)
      const expectedKeys = [
        '{{doctor_name}}', '{{first_name}}', '{{last_name}}', '{{full_name}}',
        '{{specialty}}', '{{sub_specialty}}', '{{affiliation}}',
        '{{city}}', '{{state}}', '{{npi}}',
      ]
      expectedKeys.forEach((k) => expect(keys).toContain(k))

      // Every entry must have non-empty label and description
      TEMPLATE_VARIABLES.forEach(({ key, label, description }) => {
        expect(key.length).toBeGreaterThan(0)
        expect(label.length).toBeGreaterThan(0)
        expect(description.length).toBeGreaterThan(0)
      })
    },
  },
]

// ─── Jest runner ──────────────────────────────────────────────────────────────

describe('templateEngine', () => {
  testCases.forEach(({ name, run }) => it(name, run))
})
