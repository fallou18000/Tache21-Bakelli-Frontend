import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Search, UsersRound } from 'lucide-react'
import { getProspects } from '../api/client.js'

function readValue(record, keys) {
  for (const key of keys) {
    const value = record?.[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return ''
}

function displayValue(value) {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value && typeof value === 'object') {
    return value.name || value.nom || value.fullName || value.label || ''
  }
  return ''
}

function getProspectFields(prospect) {
  return {
    name: displayValue(readValue(prospect, ['nom', 'name', 'fullName', 'contactName', 'contact'])),
    phone: displayValue(readValue(prospect, ['telephone', 'phone', 'numeroTelephone', 'mobile'])),
    company: displayValue(readValue(prospect, ['entreprise', 'company', 'companyName', 'societe'])),
    city: displayValue(readValue(prospect, ['ville', 'city', 'localisation'])),
    status: displayValue(readValue(prospect, ['statut', 'status', 'etape'])),
    owner: displayValue(readValue(prospect, ['commercialAssigne', 'commercial', 'assignedTo', 'owner'])),
    lastInteraction: displayValue(readValue(prospect, ['derniereInteraction', 'lastInteraction', 'lastContact', 'interaction'])),
    nextAction: displayValue(readValue(prospect, ['prochaineAction', 'nextAction', 'action'])),
  }
}

function extractProspects(response) {
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.prospects)) return response.prospects
  if (Array.isArray(response?.items)) return response.items
  return []
}

function statusTone(status) {
  const normalized = String(status).toLowerCase()
  if (normalized.includes('int')) return 'green'
  if (normalized.includes('propos')) return 'blue'
  if (normalized.includes('relanc')) return 'orange'
  if (normalized.includes('rdv') || normalized.includes('rendez')) return 'cyan'
  return 'neutral'
}

function ProspectsPage() {
  const [prospects, setProspects] = useState([])
  const [search, setSearch] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

    return () => {
      active = false
    }
  }, [])

  const rows = useMemo(() => prospects.map((prospect) => ({
    source: prospect,
    ...getProspectFields(prospect),
  })), [prospects])

  const owners = [...new Set(rows.map((row) => row.owner).filter(Boolean))]
  const statuses = [...new Set(rows.map((row) => row.status).filter(Boolean))]
  const filteredRows = rows.filter((row) => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term || [row.name, row.phone, row.company, row.city]
      .some((value) => String(value).toLowerCase().includes(term))
    return matchesSearch
      && (!ownerFilter || row.owner === ownerFilter)
      && (!statusFilter || row.status === statusFilter)
  })

  return (
    <div className="prospects-page">
      <main className="workspace">
        <header className="page-header">
          <div>
            <h1>Prospects du Portefeuille</h1>
            <p className="page-subtitle">Suivi des comptes et fiches prospects attribuées à l’équipe commerciale</p>
          </div>
          <div className="result-count" aria-live="polite">
            {loading ? 'Chargement…' : `${filteredRows.length} prospect${filteredRows.length > 1 ? 's' : ''} affiché${filteredRows.length > 1 ? 's' : ''}`}
          </div>
        </header>

        <section className="filters" aria-label="Filtres des prospects">
          <label className="search-box">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Rechercher par prospect, entreprise..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Rechercher un prospect ou une entreprise"
            />
          </label>
          <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)} aria-label="Filtrer par commercial">
            <option value="">Tous les commerciaux</option>
            {owners.map((owner) => <option key={owner} value={owner}>{owner}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrer par statut">
            <option value="">Tous les statuts</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </section>

        {error && <div className="api-error" role="alert"><AlertCircle size={17} />{error}</div>}

        <section className="table-panel" aria-label="Liste des prospects">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Entreprise &amp; ville</th>
                  <th>Statut</th>
                  <th>Commercial assigné</th>
                  <th>Dernière interaction</th>
                  <th>Prochaine action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="table-message" colSpan="6">Chargement des prospects…</td></tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td className="table-message" colSpan="6">
                      {error ? <><AlertCircle size={20} /><strong>Les données ne sont pas disponibles</strong><p>Vérifiez la connexion à l’API puis réessayez.</p></> : <><UsersRound size={20} /><strong>Aucun prospect trouvé</strong><p>Modifiez la recherche ou les filtres.</p></>}
                    </td>
                  </tr>
                ) : filteredRows.map((row, index) => (
                  <tr key={row.source.id || row.source._id || `${row.name}-${index}`}>
                    <td><strong>{row.name || '—'}</strong><small>{row.phone || ' '}</small></td>
                    <td><span>{row.company || '—'}</span><small>{row.city || ' '}</small></td>
                    <td><span className={`status-pill ${statusTone(row.status)}`}>{row.status || '—'}</span></td>
                    <td><span className="owner-pill"><UsersRound size={14} />{row.owner || '—'}</span></td>
                    <td><span>{displayValue(row.lastInteraction) || '—'}</span><small>{displayValue(readValue(row.source, ['typeInteraction', 'interactionType', 'canal'])) || ' '}</small></td>
                    <td><span className="next-action">{row.nextAction || '—'}</span><small>{displayValue(readValue(row.source, ['dateProchaineAction', 'nextActionDate', 'echeance'])) || ' '}</small></td>
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