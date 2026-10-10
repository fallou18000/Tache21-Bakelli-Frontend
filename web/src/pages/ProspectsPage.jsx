import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Search, UsersRound } from 'lucide-react'
import {
  getCommerciaux,
  getProspects,
  isProspectsDemoMode,
} from '../api/prospects.api.js'

const prospectStatuses = [
  'Nouveau',
  'À contacter',
  'Contacté',
  'Intéressé',
  'Rendez-vous',
  'Proposition',
  'Négociation',
  'Gagné',
  'Perdu',
]

function extractProspects(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.prospects)) return response.prospects
  return []
}

function extractCommerciaux(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.users)) return response.users
  return []
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function ProspectsPage() {
  const [prospects, setProspects] = useState([])
  const [commerciaux, setCommerciaux] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [commercialFilter, setCommercialFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [commercialError, setCommercialError] = useState('')

  useEffect(() => {
    let active = true

    getProspects()
      .then((response) => {
        if (active) setProspects(extractProspects(response))
      })
      .catch(() => {
        if (active) setError('Impossible de charger les prospects pour le moment.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    getCommerciaux()
      .then((response) => {
        if (active) setCommerciaux(extractCommerciaux(response))
      })
      .catch(() => {
        if (active) setCommercialError('Impossible de charger la liste des commerciaux.')
      })

    return () => {
      active = false
    }
  }, [])

  const commercialOptions = useMemo(
    () => [...new Map(commerciaux
      .filter(({ id, nom }) => (id !== undefined && id !== null) || nom)
      .map((commercial) => {
        const filterValue = commercial.id !== undefined && commercial.id !== null
          ? `id:${commercial.id}`
          : `name:${commercial.nom}`
        return [
          filterValue,
          commercial.nom || `Commercial #${commercial.id}`,
        ]
      }))],
    [commerciaux],
  )
  const filteredProspects = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('fr')

    return prospects.filter((prospect) => {
      const prospectCommercialFilter = prospect.commercial_id !== undefined && prospect.commercial_id !== null
        ? `id:${prospect.commercial_id}`
        : `name:${prospect.commercial_responsable || ''}`
      const matchesSearch = !term || [
        prospect.nom,
        prospect.societe,
        prospect.telephone,
        prospect.email,
        prospect.statut,
        prospect.origine,
        prospect.entreprise,
        prospect.commercial_responsable,
      ].some((value) => String(value ?? '').toLocaleLowerCase('fr').includes(term))

      return matchesSearch
        && (!statusFilter || prospect.statut === statusFilter)
        && (!commercialFilter || prospectCommercialFilter === commercialFilter)
    })
  }, [prospects, search, statusFilter, commercialFilter])

  return (
    <div className="prospects-page">
      <main className="workspace">
        <header className="page-header">
          <div>
            <h1>Prospects du Portefeuille</h1>
            <p className="page-subtitle">Suivi des comptes et fiches prospects attribuees à l'équipe commerciale</p>
          </div>
          <div className="result-count" aria-live="polite">
            {loading
              ? 'Chargement…'
              : `${filteredProspects.length} prospect${filteredProspects.length > 1 ? 's' : ''} affiché${filteredProspects.length > 1 ? 's' : ''}`}
          </div>
        </header>

        <section className="filters" aria-label="Filtres des prospects">
          <label className="search-box">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Rechercher un prospect..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Rechercher un prospect"
            />
          </label>
          <select
            value={commercialFilter}
            onChange={(event) => setCommercialFilter(event.target.value)}
            aria-label="Filtrer par commercial"
          >
            <option value="">Tous les commerciaux</option>
            {commercialOptions.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filtrer par statut"
          >
            <option value="">Tous les statuts</option>
            {prospectStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </section>

        {commercialError && <div className="api-error" role="alert"><AlertCircle size={17} />{commercialError}</div>}

        {isProspectsDemoMode && (
          <div className="api-demo" role="status">
            Données de démonstration — aucune donnée n’a été enregistrée dans la base.
          </div>
        )}

        {error && <div className="api-error" role="alert"><AlertCircle size={17} />{error}</div>}

        <section className="table-panel" aria-label="Liste des prospects">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Société</th>
                  <th>Téléphone</th>
                  <th>E-mail</th>
                  <th>Statut</th>
                  <th>Origine</th>
                  <th>Entreprise</th>
                  <th>Commercial responsable</th>
                  <th>Dernière interaction</th>
                  <th>Prochaine action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="table-message" colSpan="10">Chargement des prospects…</td></tr>
                ) : filteredProspects.length === 0 ? (
                  <tr>
                    <td className="table-message" colSpan="10">
                      {error
                        ? <><AlertCircle size={20} /><strong>Données indisponibles</strong><p>Vérifiez la connexion à l’API puis réessayez.</p></>
                        : <><UsersRound size={20} /><strong>Aucun prospect trouvé</strong><p>Modifiez la recherche ou les filtres.</p></>}
                    </td>
                  </tr>
                ) : filteredProspects.map((prospect, index) => (
                  <tr key={prospect.id ?? index}>
                    <td><strong>{prospect.nom || '—'}</strong></td>
                    <td>{prospect.societe || '—'}</td>
                    <td>{prospect.telephone || '—'}</td>
                    <td>{prospect.email || '—'}</td>
                    <td><span className="status-pill neutral">{prospect.statut || '—'}</span></td>
                    <td>{prospect.origine || '—'}</td>
                    <td>{prospect.entreprise || (prospect.entreprise_id ? `Entreprise #${prospect.entreprise_id}` : '—')}</td>
                    <td>
                      <span className="owner-pill">
                        <UsersRound size={14} />
                        {prospect.commercial_responsable
                          || (prospect.commercial_id ? `Commercial #${prospect.commercial_id}` : '—')}
                      </span>
                    </td>
                    <td>{formatDate(prospect.derniere_interaction)}</td>
                    <td>
                      <span className="next-action">{prospect.prochaine_action_type || '—'}</span>
                      {prospect.prochaine_action_date && <small>{formatDate(prospect.prochaine_action_date)}</small>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default ProspectsPage
