import { request } from './client.js'

const roles = [
  { id: 1, nom: 'Commercial' },
  { id: 2, nom: 'Manager' },
]

const departements = [
  { id: 1, nom: 'Ventes', entreprise_id: 1 },
]

const equipes = [
  { id: 1, nom: 'Équipe Dakar', departement_id: 1 },
]

const users = [
  { id: 1, nom: 'Fatou Ndiaye', email: 'fatou.ndiaye@example.com', telephone: '+221 77 450 12 89', role_id: 1, equipe_id: 1, manager_id: 4 },
  { id: 2, nom: 'Moussa Diatta', email: 'moussa.diatta@example.com', telephone: '+221 76 321 45 67', role_id: 1, equipe_id: 1, manager_id: 4 },
  { id: 3, nom: 'Awa Fall', email: 'awa.fall@example.com', telephone: '+221 70 892 14 33', role_id: 1, equipe_id: 1, manager_id: 4 },
  { id: 4, nom: 'Aminata Diop', email: 'aminata.diop@example.com', telephone: '+221 78 333 44 55', role_id: 2, equipe_id: 1, manager_id: null },
]

const objectifs = [
  { id: 1, type: 'appels', valeur_cible: 10, periode: 'jour', user_id: 1, fixe_par: 4 },
  { id: 2, type: 'appels', valeur_cible: 8, periode: 'jour', user_id: 2, fixe_par: 4 },
  { id: 3, type: 'appels', valeur_cible: 10, periode: 'jour', user_id: 3, fixe_par: 4 },
]

const prospects = [
  { id: 1, nom: 'Moussa Ndiaye', societe: 'Dakar Distribution', telephone: '+221 78 301 44 20', email: 'moussa.ndiaye.pro@example.com', statut: 'Proposition', origine: 'recommandation', entreprise_id: 1, commercial_id: 1 },
  { id: 2, nom: 'Awa Fall', societe: 'Teranga Services', telephone: '+221 76 892 14 33', email: 'awa.fall.pro@example.com', statut: 'À contacter', origine: 'site web', entreprise_id: 1, commercial_id: 1 },
  { id: 3, nom: 'Cheikh Tall', societe: 'Wari Express', telephone: '+221 76 990 12 34', email: 'cheikh.tall@example.com', statut: 'Proposition', origine: 'salon', entreprise_id: 1, commercial_id: 1 },
  { id: 4, nom: 'Sokhna Ba', societe: 'Baobab Conseil', telephone: '+221 77 222 33 44', email: 'sokhna.ba@example.com', statut: 'Gagné', origine: 'recommandation', entreprise_id: 1, commercial_id: 1 },
  { id: 5, nom: 'Ibrahima Sarr', societe: 'SunuTech', telephone: '+221 75 101 20 30', email: 'ibrahima.sarr@example.com', statut: 'Intéressé', origine: 'site web', entreprise_id: 1, commercial_id: 2 },
  { id: 6, nom: 'Mariama Kane', societe: 'Jokko Market', telephone: '+221 77 112 23 34', email: 'mariama.kane@example.com', statut: 'Négociation', origine: 'salon', entreprise_id: 1, commercial_id: 2 },
  { id: 7, nom: 'Oumar Diallo', societe: 'Sahel Énergie', telephone: '+221 70 234 56 78', email: 'oumar.diallo@example.com', statut: 'Gagné', origine: 'recommandation', entreprise_id: 1, commercial_id: 2 },
  { id: 8, nom: 'Adama Sow', societe: 'Sen Commerce', telephone: '+221 76 345 67 89', email: 'adama.sow@example.com', statut: 'Proposition', origine: 'site web', entreprise_id: 1, commercial_id: 2 },
  { id: 9, nom: 'Khady Diouf', societe: 'Teranga Habitat', telephone: '+221 78 456 78 90', email: 'khady.diouf@example.com', statut: 'Rendez-vous', origine: 'salon', entreprise_id: 1, commercial_id: 3 },
  { id: 10, nom: 'Mamadou Faye', societe: 'Sunu Logistique', telephone: '+221 77 567 89 01', email: 'mamadou.faye@example.com', statut: 'Proposition', origine: 'site web', entreprise_id: 1, commercial_id: 3 },
  { id: 11, nom: 'Aïssatou Cissé', societe: 'Baobab Services', telephone: '+221 70 678 90 12', email: 'aissatou.cisse@example.com', statut: 'Gagné', origine: 'recommandation', entreprise_id: 1, commercial_id: 3 },
  { id: 12, nom: 'Abdoulaye Diop', societe: 'Dakar Mobilité', telephone: '+221 76 789 01 23', email: 'abdoulaye.diop@example.com', statut: 'À contacter', origine: 'fichier acheté', entreprise_id: 1, commercial_id: 3 },
]

function createCalls(userId, count, rendezVousCount, durationPerCall) {
  return Array.from({ length: count }, (_, index) => {
    const callsPerWeek = Math.ceil(count / 4)
    const weeksAgo = 3 - Math.floor(index / callsPerWeek)
    const dayOffset = weeksAgo * 7 + (index % callsPerWeek)
    const appointment = index < rendezVousCount

    return {
      id: userId * 100 + index + 1,
      numero: '+221 33 800 00 00',
      date_heure: new Date(Date.now() - dayOffset * 86400000 - index * 1800000).toISOString(),
      duree: durationPerCall + (index % 3) * 30,
      sens: 'sortant',
      resultat: appointment ? 'rendez-vous' : index % 3 === 0 ? 'contact établi' : 'sans réponse',
      note: null,
      user_id: userId,
      prospect_id: prospects.find((prospect) => prospect.commercial_id === userId)?.id ?? null,
    }
  })
}

const appels = [
  ...createCalls(1, 22, 4, 570),
  ...createCalls(2, 19, 3, 552),
  ...createCalls(3, 24, 5, 638),
]

const relances = [
  { id: 1, date_prevue: new Date(Date.now() + 86400000).toISOString(), type: 'Rappel', fait: false, appel_id: 101, prospect_id: 1 },
  { id: 2, date_prevue: new Date(Date.now() + 172800000).toISOString(), type: 'Présentation', fait: false, appel_id: 201, prospect_id: 6 },
  { id: 3, date_prevue: new Date(Date.now() + 259200000).toISOString(), type: 'Rappel', fait: false, appel_id: 301, prospect_id: 10 },
]

const testEquipe = { users, roles, equipes, departements, objectifs, prospects, appels, relances }

export const isEquipeDemoMode = !import.meta.env.VITE_API_URL

export function getEquipe() {
  if (isEquipeDemoMode) return Promise.resolve(testEquipe)

  return request('/equipe')
}
