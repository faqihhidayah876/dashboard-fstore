import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Trash2, CheckCircle, XCircle, Copy, Edit3, Search } from 'lucide-react'

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText, type = 'danger' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-opacity">
      <div className="bg-white/95 backdrop-blur-xl border border-white p-7 rounded-3xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 mb-8 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-all">Batal</button>
          <button onClick={onConfirm} className={`px-5 py-2.5 rounded-xl font-semibold text-white shadow-lg transition-all ${type === 'danger' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false })
  
  const [form, setForm] = useState({ nama: '', layanan: 'Gemini Pro', nominal: 15000, kode_sinkronisasi: '' })
  
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editData, setEditData] = useState({ id: null, nama: '', layanan: '', nominal: 0, status_aktif: false, last_order_id: null })

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    const { data } = await supabase.from('subscriptions').select('*').order('id', { ascending: false })
    if (data) setCustomers(data)
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    await supabase.from('subscriptions').insert([{ ...form, status_aktif: false }])
    setForm({ nama: '', layanan: 'Gemini Pro', nominal: 15000, kode_sinkronisasi: '' })
    fetchCustomers()
  }

  const openEditModal = (cust) => {
    setEditData(cust)
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    
    // Cek apakah admin baru saja mengubah status menjadi Lunas
    const oldData = customers.find(c => c.id === editData.id)
    const isJustPaid = !oldData.status_aktif && editData.status_aktif

    // Update database Supabase
    await supabase.from('subscriptions').update({
      nama: editData.nama,
      layanan: editData.layanan,
      nominal: parseInt(editData.nominal),
      status_aktif: editData.status_aktif
    }).eq('id', editData.id)
    
    // Jika baru ditandai lunas dan memiliki Order ID, tembak Webhook Bot Vercel
    if (isJustPaid && editData.last_order_id) {
      try {
        await fetch('https://payment-fstore.vercel.app/api/bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transaction_status: 'settlement',
            order_id: editData.last_order_id
          })
        });
      } catch (error) {
        console.error("Gagal mengirim notifikasi ke bot:", error);
      }
    }

    setIsEditOpen(false)
    setTimeout(() => fetchCustomers(), 1000)
  }

  const deleteCustomer = (id, nama) => {
    setConfirmConfig({
      isOpen: true, title: 'Hapus Data Permanen', message: `Data langganan atas nama ${nama} akan dihapus dari sistem.`, confirmText: 'Hapus Data', type: 'danger',
      onConfirm: async () => {
        await supabase.from('subscriptions').delete().eq('id', id)
        setConfirmConfig({ isOpen: false })
        fetchCustomers()
      }
    })
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Order ID disalin: ' + text);
  }

  // Filter pencarian cerdas berdasarkan Nama, Order ID, atau Kode
  const filteredCustomers = customers.filter(cust => 
    cust.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cust.last_order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cust.kode_sinkronisasi?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Data Pelanggan</h1>
        
        {/* Kolom Pencarian */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari Order ID atau Nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-0 ring-1 ring-slate-200 bg-white/70 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm text-sm"
          />
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-2xl border border-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Registrasi Anggota Baru</h2>
        <form onSubmit={handleAdd} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-slate-500 mb-1.5">Nama</label>
            <input type="text" required value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className="w-full px-4 py-3 rounded-xl border-0 ring-1 ring-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-slate-500 mb-1.5">Kode Klaim (Opsional)</label>
            <input type="text" value={form.kode_sinkronisasi} onChange={e => setForm({...form, kode_sinkronisasi: e.target.value.toUpperCase()})} className="w-full px-4 py-3 rounded-xl border-0 ring-1 ring-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all uppercase" placeholder="Contoh: QIH123" />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-slate-500 mb-1.5">Layanan</label>
            <select value={form.layanan} onChange={e => setForm({...form, layanan: e.target.value})} className="w-full px-4 py-3 rounded-xl border-0 ring-1 ring-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all">
              <option>Gemini Pro</option><option>Canva Pro</option>
            </select>
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-slate-500 mb-1.5">Harga</label>
            <input type="number" required value={form.nominal} onChange={e => setForm({...form, nominal: parseInt(e.target.value)})} className="w-full px-4 py-3 rounded-xl border-0 ring-1 ring-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" />
          </div>
          <button type="submit" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg transition-all hover:-translate-y-0.5">
            <Plus size={18} /> Simpan
          </button>
        </form>
      </div>

      <div className="bg-white/60 backdrop-blur-2xl border border-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/50">
              <tr className="text-slate-500 text-sm">
                <th className="py-4 px-6 font-semibold">Pelanggan</th>
                <th className="py-4 px-6 font-semibold">Order ID Terakhir</th>
                <th className="py-4 px-6 font-semibold">Tagihan</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 divide-y divide-slate-100/60">
              {filteredCustomers.length > 0 ? filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-white/60 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-semibold text-slate-800">{cust.nama || 'Anonim'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Kode: {cust.kode_sinkronisasi || (cust.telegram_id ? 'Tersinkron' : 'Belum Set')}</p>
                  </td>
                  <td className="py-4 px-6">
                    {cust.last_order_id ? (
                      <div className="flex items-center gap-2 text-sm text-slate-600 bg-white/50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">
                        <span className="font-mono">{cust.last_order_id.substring(0, 15)}...</span>
                        <button onClick={() => copyToClipboard(cust.last_order_id)} className="hover:text-indigo-600"><Copy size={14} /></button>
                      </div>
                    ) : <span className="text-sm text-slate-400 italic">Belum ada transaksi</span>}
                  </td>
                  <td className="py-4 px-6 font-medium">Rp {cust.nominal?.toLocaleString('id-ID')}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${cust.status_aktif ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                      {cust.status_aktif ? <CheckCircle size={14}/> : <XCircle size={14}/>} {cust.status_aktif ? 'LUNAS' : 'BELUM BAYAR'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(cust)} className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => deleteCustomer(cust.id, cust.nama)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">Tidak ada data ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl border border-white p-7 rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Edit Data Pelanggan</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nama Lengkap</label>
                <input type="text" required value={editData.nama} onChange={e => setEditData({...editData, nama: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border-0 ring-1 ring-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Layanan</label>
                  <select value={editData.layanan} onChange={e => setEditData({...editData, layanan: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border-0 ring-1 ring-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500">
                    <option>Gemini Pro</option><option>Canva Pro</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Total Tagihan (Rp)</label>
                  <input type="number" required value={editData.nominal} onChange={e => setEditData({...editData, nominal: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border-0 ring-1 ring-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Status Pembayaran</label>
                <select value={editData.status_aktif} onChange={e => setEditData({...editData, status_aktif: e.target.value === 'true'})} className="w-full px-4 py-2.5 rounded-xl border-0 ring-1 ring-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium">
                  <option value={true}>✅ Lunas (Aktif)</option>
                  <option value={false}>❌ Belum Bayar (Nonaktif)</option>
                </select>
                <p className="text-xs text-slate-400 mt-2">Mengubah ke status 'Lunas' akan otomatis mengirim notifikasi Telegram ke pelanggan (jika mereka memiliki Order ID).</p>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsEditOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-all">Batal</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-200 transition-all">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal {...confirmConfig} onCancel={() => setConfirmConfig({ isOpen: false })} />
    </div>
  )
}