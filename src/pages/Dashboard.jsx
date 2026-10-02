import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { Trash2, CheckCircle, XCircle, LogOut, Plus } from 'lucide-react'

export default function Dashboard() {
  const [customers, setCustomers] = useState([])
  const navigate = useNavigate()

  // Form Tambah Data Baru
  const [newNama, setNewNama] = useState('')
  const [newLayanan, setNewLayanan] = useState('Gemini Pro')
  const [newNominal, setNewNominal] = useState(15000)

  useEffect(() => {
    checkAuth()
    fetchCustomers()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) navigate('/')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const fetchCustomers = async () => {
    const { data } = await supabase.from('subscriptions').select('*').order('id', { ascending: false })
    if (data) setCustomers(data)
  }

  // Aksi: Edit (Toggle) Status Lunas/Belum
  const toggleStatus = async (id, currentStatus) => {
    await supabase.from('subscriptions').update({ status_aktif: !currentStatus }).eq('id', id)
    fetchCustomers()
  }

  // Aksi: Hapus Data
  const deleteCustomer = async (id) => {
    if (window.confirm("Yakin ingin menghapus pelanggan ini?")) {
      await supabase.from('subscriptions').delete().eq('id', id)
      fetchCustomers()
    }
  }

  // Aksi: Tambah Data Manual
  const addCustomer = async (e) => {
    e.preventDefault()
    await supabase.from('subscriptions').insert([
      { nama: newNama, layanan: newLayanan, nominal: parseInt(newNominal), status_aktif: false }
    ])
    setNewNama(''); fetchCustomers();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto bg-white/70 backdrop-blur-lg border border-white/50 rounded-3xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/60 bg-white/30">
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Pelanggan</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
            <LogOut size={18} /> Keluar
          </button>
        </div>

        {/* Form Tambah Data Cepat */}
        <div className="p-6 bg-white/40 border-b border-white/60">
          <form onSubmit={addCustomer} className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Nama / Username</label>
              <input type="text" required value={newNama} onChange={e => setNewNama(e.target.value)} className="px-4 py-2 rounded-lg border border-slate-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Layanan</label>
              <select value={newLayanan} onChange={e => setNewLayanan(e.target.value)} className="px-4 py-2 rounded-lg border border-slate-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="Gemini Pro">Gemini Pro</option>
                <option value="Canva Pro">Canva Pro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Harga (Rp)</label>
              <input type="number" required value={newNominal} onChange={e => setNewNominal(e.target.value)} className="px-4 py-2 rounded-lg border border-slate-200 bg-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <button type="submit" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md transition-all">
              <Plus size={18} /> Tambah
            </button>
          </form>
        </div>

        {/* Tabel Data */}
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 text-slate-500">
                <th className="pb-3 px-4">Nama Pelanggan</th>
                <th className="pb-3 px-4">Layanan</th>
                <th className="pb-3 px-4">Tagihan</th>
                <th className="pb-3 px-4">Ubah Status</th>
                <th className="pb-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {customers.map((cust) => (
                <tr key={cust.id} className="border-b border-slate-100 hover:bg-white/50 transition-colors">
                  <td className="py-4 px-4 font-medium">{cust.nama || 'Anonim'}</td>
                  <td className="py-4 px-4">{cust.layanan || '-'}</td>
                  <td className="py-4 px-4">Rp {cust.nominal?.toLocaleString('id-ID')}</td>
                  <td className="py-4 px-4">
                    <button 
                      onClick={() => toggleStatus(cust.id, cust.status_aktif)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${cust.status_aktif ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}`}
                    >
                      {cust.status_aktif ? <CheckCircle size={16}/> : <XCircle size={16}/>}
                      {cust.status_aktif ? 'LUNAS' : 'BELUM'}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button onClick={() => deleteCustomer(cust.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}