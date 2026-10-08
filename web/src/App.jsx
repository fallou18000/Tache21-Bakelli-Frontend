import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import ProspectsPage from './pages/ProspectsPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/prospects" replace />} />
        <Route path="/prospects" element={<ProspectsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
