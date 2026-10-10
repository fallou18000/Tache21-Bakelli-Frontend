import { request } from './client.js'

const testProspects = [
  {
    id: 1,
    nom: 'Awa Diop',
    societe: 'Teranga Distribution',
    telephone: '+221 77 123 45 67',
    email: 'awa.diop@example.com',
    statut: 'Nouveau',
    origine: 'site web',
    entreprise_id: 1,
    commercial_id: 1,
    entreprise: 'Easy Call',
    commercial_responsable: 'Moussa Ndiaye',
    derniere_interaction: null,
    prochaine_action_date: '2026-10-12T09:00:00',
    prochaine_action_type: 'Premier appel',
  },
  {
    id: 2,
    nom: 'Mamadou Fall',
    societe: 'SunuTech',
    telephone: '+221 76 234 56 78',
    email: 'mamadou.fall@example.com',
    statut: 'À contacter',
    origine: 'salon professionnel',
    entreprise_id: 1,
    commercial_id: 2,
    entreprise: 'Easy Call',
    commercial_responsable: 'Fatou Ba',
    derniere_interaction: '2026-10-08T14:30:00',
    prochaine_action_date: '2026-10-10T10:00:00',
    prochaine_action_type: 'Rappel',
  },
  {
    id: 3,
    nom: 'Fatou Sarr',
    societe: 'Sahel Énergie',
    telephone: '+221 70 345 67 89',
    email: 'fatou.sarr@example.com',
    statut: 'Intéressé',
    origine: 'recommandation',
    entreprise_id: 1,
    commercial_id: 1,
    entreprise: 'Easy Call',
    commercial_responsable: 'Moussa Ndiaye',
    derniere_interaction: '2026-10-09T11:15:00',
    prochaine_action_date: '2026-10-14T15:00:00',
    prochaine_action_type: 'Présentation de l’offre',
  },
  {
    id: 4,
    nom: 'Ibrahima Sow',
    societe: 'Baobab Services',
    telephone: '+221 78 456 78 90',
    email: 'ibrahima.sow@example.com',
    statut: 'Nouveau',
    origine: 'fichier acheté',
    entreprise_id: 1,
    commercial_id: 2,
    entreprise: 'Easy Call',
    commercial_responsable: 'Fatou Ba',
    derniere_interaction: null,
    prochaine_action_date: null,
    prochaine_action_type: null,
  },
  {
    id: 5,
    nom: 'Mariama Diallo',
    societe: 'Jokko Market',
    telephone: '+221 75 567 89 01',
    email: 'mariama.diallo@example.com',
    statut: 'Rendez-vous',
    origine: 'site web',
    entreprise_id: 1,
    commercial_id: 1,
    entreprise: 'Easy Call',
    commercial_responsable: 'Moussa Ndiaye',
    derniere_interaction: '2026-10-07T16:45:00',
    prochaine_action_date: '2026-10-13T13:30:00',
    prochaine_action_type: 'Rendez-vous',
  },
]

const testCommerciaux = [
  { id: 1, nom: 'Moussa Ndiaye' },
  { id: 2, nom: 'Fatou Ba' },
]

export const isProspectsDemoMode = !import.meta.env.VITE_API_URL

export function getProspects() {
  if (isProspectsDemoMode) return Promise.resolve(testProspects)

  return request('/prospects')
}

export function getCommerciaux() {
  if (isProspectsDemoMode) return Promise.resolve(testCommerciaux)

  return request('/users')
}
