// src/types/index.ts

export interface Physician {
  id:                  string
  npi:                 string
  firstName:           string
  lastName:            string
  specialty:           string
  subSpecialty:        string | null
  affiliation:         string
  city:                string
  state:               string
  email:               string
  npiRegistrationYear: number
  acceptingPatients:   boolean
  boardCertified:      boolean
  createdAt:           string
}

export interface PhysiciansResponse {
  data:     Physician[]
  total:    number
  filtered: number
}

export type FilterKey = 'specialty' | 'state' | 'affiliation' | 'yearFrom' | 'yearTo'

export interface FilterState {
  specialty:   string
  state:       string
  affiliation: string
  yearFrom:    string
  yearTo:      string
}
