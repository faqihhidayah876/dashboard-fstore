import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { LayoutDashboard, Users, LogOut, Menu, X } from 'lucide-react'
import Login from './pages/Login'
import Overview from './pages/Overview'
import Customers from './pages/Customers'

// Komponen Layout Utama (Sidebar + Konten)
function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Data Pelanggan', path: '/customers', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9fc] to-[#f1f4fb] flex font-sans text-slate-800">
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Utama */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white/80 backdrop-blur-xl border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">F-Store</h2>
          <button className="lg:hidden text-slate-500" onClick={() => setIsSidebarOpen(false)}><X size={24} /></button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button key={item.name} onClick={() => { navigate(item.path); setIsSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-indigo-600 shadow-md shadow-indigo-200 text-white' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}>
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={() => setShowLogoutModal(true)} className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
            <LogOut size={20} />
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Area Konten */}
      <main className="flex-1 flex flex-col w-full min-w-0">
        <header className="lg:hidden bg-white/80 backdrop-blur-xl border-b border-white/60 p-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-xl font-bold text-indigo-600">F-Store</h2>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white rounded-lg shadow-sm text-slate-600"><Menu size={24} /></button>
        </header>
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</div>
      </main>

      {/* Pop Up Konfirmasi Logout (Glassmorphism) */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
          <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Konfirmasi Keluar</h3>
            <p className="text-slate-500 mb-6">Apakah Anda yakin ingin keluar dari dashboard admin?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowLogoutModal(false)} className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-all">Batal</button>
              <button onClick={handleLogout} className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 shadow-md text-white font-medium transition-all">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Perlindungan Route (Wajib Login)
function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/')
      else setAuthenticated(true)
      setLoading(false)
    })
  }, [navigate])

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-indigo-600 font-medium">Memuat...</div>
  return authenticated ? <DashboardLayout>{children}</DashboardLayout> : null
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}