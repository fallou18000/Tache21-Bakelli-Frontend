import { request } from './client.js'

const testActivites = {
  appels: [
    {
      id: 1,
      numero: '+221 77 123 45 67',
      date_heure: '2026-10-10T11:30:00',
      duree: 240,
      sens: 'sortant',
      resultat: 'interested',
      note: 'Intéressé par l’offre Business. Doit en parler au DG.',
      user_id: 1,
      prospect_id: 1,
    },
    {
      id: 2,
      numero: '+221 76 234 56 78',
      date_heure: '2026-10-10T10:45:00',
      duree: 0,
      sens: 'sortant',
      resultat: 'no_answer',
      note: null,
      user_id: 1,
      prospect_id: 2,
    },
    {
      id: 3,
      numero: '+221 33 800 00 00',
      date_heure: '2026-10-10T09:20:00',
      duree: 315,
      sens: 'entrant',
      resultat: 'interested',
      note: null,
      user_id: 1,
      prospect_id: 3,
    },
    {
      id: 4,
      numero: '+221 77 123 45 67',
      date_heure: '2026-10-09T16:10:00',
      duree: 180,
      sens: 'sortant',
      resultat: null,
      note: 'Envoi du résumé de l’offre par SMS.',
      user_id: 1,
      prospect_id: 1,
    },
  ],
  prospects: [
    { id: 1, nom: 'Mamadou Diop', societe: 'SenTech' },
    { id: 2, nom: 'Awa Fall', societe: 'Teranga Services' },
    { id: 3, nom: 'SenTech', societe: 'SenTech' },
  ],
  users: [
    { id: 1, nom: 'Fatou Ndiaye' },
  ],
}

export const isActivitesDemoMode = !import.meta.env.VITE_API_URL

export function getActivites() {
  if (isActivitesDemoMode) return Promise.resolve(testActivites)

  return request('/activites')
}
