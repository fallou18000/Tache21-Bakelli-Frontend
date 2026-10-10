import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import EquipePage from './pages/EquipePage.jsx'
import ProspectsPage from './pages/ProspectsPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/prospects" replace />} />
        <Route path="/prospects" element={<ProspectsPage />} />
        <Route path="/equipe/:memberId" element={<EquipePage />} />
        <Route path="/equipe" element={<EquipePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
