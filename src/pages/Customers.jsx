import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Trash2, CheckCircle, XCircle, Edit3 } from 'lucide-react'

// Komponen Modal Glassmorphism Reusable
const Modal = ({ isOpen, title, message, onConfirm, onCancel, confirmText, type = 'danger' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-md">
      <div className="bg-white/90 backdrop-blur-xl border border-white/50 p-6 rounded-3xl shadow-2xl max-w-sm w-full">
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-all">Batal</button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-xl font-medium text-white shadow-md transition-all ${type === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [modalConfig, setModalConfig] = useState({ isOpen: false })
  const [form, setForm] = useState({ nama: '', layanan: 'Gemini Pro', nominal: 15000 })

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    const { data } = await supabase.from('subscriptions').select('*').order('id', { ascending: false })
    if (data) setCustomers(data)
  }

  // Pemicu Modal
  const confirmAction = (title, message, confirmText, type, action) => {
    setModalConfig({ isOpen: true, title, message, confirmText, type, onConfirm: async () => { await action(); setModalConfig({ isOpen: false }); fetchCustomers(); } })
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    confirmAction('Tambah Data Baru', `Tambahkan ${form.nama} untuk layanan ${form.layanan}?`, 'Ya, Tambahkan', 'primary', async () => {
      await supabase.from('subscriptions').insert([{ ...form, status_aktif: false }])
      setForm({ nama: '', layanan: 'Gemini Pro', nominal: 15000 })
    })
  }

  const toggleStatus = (id, currentStatus) => {
    const actionText = currentStatus ? 'Membatalkan lunas' : 'Menandai lunas'
    confirmAction('Ubah Status Pembayaran', `Anda yakin ingin ${actionText} untuk tagihan ini?`, 'Ubah Status', 'primary', async () => {
      await supabase.from('subscriptions').update({ status_aktif: !currentStatus }).eq('id', id)
    })
  }

  const deleteCustomer = (id, nama) => {
    confirmAction('Hapus Pelanggan', `Data pelanggan ${nama} akan dihapus secara permanen. Lanjutkan?`, 'Ya, Hapus', 'danger', async () => {
      await supabase.from('subscriptions').delete().eq('id', id)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Manajemen Pelanggan</h1>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <form onSubmit={handleAdd} className="flex flex-wrap gap-4 items-end mb-6 pb-6 border-b border-slate-100">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-500 mb-1">Nama Pengguna</label>
            <input type="text" required value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-slate-500 mb-1">Layanan</label>
            <select value={form.layanan} onChange={e => setForm({...form, layanan: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Gemini Pro</option><option>Canva Pro</option>
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-slate-500 mb-1">Harga (Rp)</label>
            <input type="number" required value={form.nominal} onChange={e => setForm({...form, nominal: parseInt(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button type="submit" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl shadow-md transition-all">
            <Plus size={18} /> Tambah
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100">
                <th className="pb-4 font-medium px-2">Nama</th>
                <th className="pb-4 font-medium px-2">Layanan</th>
                <th className="pb-4 font-medium px-2">Tagihan</th>
                <th className="pb-4 font-medium px-2">Status</th>
                <th className="pb-4 font-medium px-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {customers.map((cust) => (
                <tr key={cust.id} className="border-b border-slate-50 hover:bg-white/40 transition-colors">
                  <td className="py-4 px-2 font-semibold">{cust.nama || 'Anonim'}</td>
                  <td className="py-4 px-2">{cust.layanan || '-'}</td>
                  <td className="py-4 px-2 font-medium">Rp {cust.nominal?.toLocaleString('id-ID')}</td>
                  <td className="py-4 px-2">
                    <button onClick={() => toggleStatus(cust.id, cust.status_aktif)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${cust.status_aktif ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                      {cust.status_aktif ? <CheckCircle size={14}/> : <XCircle size={14}/>} {cust.status_aktif ? 'LUNAS' : 'BELUM'}
                    </button>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <button onClick={() => deleteCustomer(cust.id, cust.nama)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal {...modalConfig} onCancel={() => setModalConfig({ isOpen: false })} />
    </div>
  )
}