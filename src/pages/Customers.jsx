import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Trash2, CheckCircle, XCircle, Copy } from 'lucide-react'

const Modal = ({ isOpen, title, message, onConfirm, onCancel, confirmText, type = 'danger' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-xl border border-white p-7 rounded-3xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 mb-8 leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition-all">Batal</button>
          <button onClick={onConfirm} className={`px-5 py-2.5 rounded-xl font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 ${type === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
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
  const [form, setForm] = useState({ nama: '', layanan: 'Gemini Pro', nominal: 15000, kode_sinkronisasi: '' })

  useEffect(() => { fetchCustomers() }, [])

  const fetchCustomers = async () => {
    const { data } = await supabase.from('subscriptions').select('*').order('id', { ascending: false })
    if (data) setCustomers(data)
  }

  const confirmAction = (title, message, confirmText, type, action) => {
    setModalConfig({ isOpen: true, title, message, confirmText, type, onConfirm: async () => { await action(); setModalConfig({ isOpen: false }); fetchCustomers(); } })
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    confirmAction('Tambah Pelanggan Baru', `Daftarkan ${form.nama} dengan kode klaim ${form.kode_sinkronisasi}?`, 'Ya, Tambahkan', 'primary', async () => {
      await supabase.from('subscriptions').insert([{ ...form, status_aktif: false }])
      setForm({ nama: '', layanan: 'Gemini Pro', nominal: 15000, kode_sinkronisasi: '' })
    })
  }

  const toggleStatus = (cust) => {
    if (cust.status_aktif) {
      // Jika membatalkan lunas, cukup ubah di database
      confirmAction('Batalkan Status Lunas', `Yakin ingin membatalkan status lunas untuk ${cust.nama}?`, 'Batalkan Lunas', 'danger', async () => {
        await supabase.from('subscriptions').update({ status_aktif: false }).eq('id', cust.id)
      })
    } else {
      // JIKA MENANDAI LUNAS (MANUAL OVERRIDE): Tembak API Bot Vercel agar bot membalas ke user
      confirmAction('Verifikasi Pembayaran Manual', `Tandai tagihan ${cust.nama} lunas? Sistem akan otomatis memberitahu pelanggan via Bot Telegram.`, 'Verifikasi Lunas', 'primary', async () => {
        if (!cust.last_order_id) {
            alert('Gagal: Pelanggan belum pernah melakukan request pembayaran di Bot.');
            return;
        }
        
        // Tembak webhook bot kamu seolah-olah ini dari Midtrans
        // GANTI URL INI DENGAN URL VERCEL BOT TELEGRAM KAMU:
        await fetch('https://payment-fstore.vercel.app/api/bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction_status: 'settlement',
                order_id: cust.last_order_id
            })
        });
        
        // Jeda sebentar agar bot selesai menulis ke database, lalu refresh tabel
        setTimeout(() => fetchCustomers(), 1000);
      })
    }
  }

  const deleteCustomer = (id, nama) => {
    confirmAction('Hapus Data Permanen', `Data langganan atas nama ${nama} akan dihapus dari sistem.`, 'Hapus Data', 'danger', async () => {
      await supabase.from('subscriptions').delete().eq('id', id)
    })
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Order ID disalin: ' + text);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Data Pelanggan</h1>

      {/* Form Tambah Data Manual */}
      <div className="bg-white/60 backdrop-blur-2xl border border-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">Registrasi Anggota Baru</h2>
        <form onSubmit={handleAdd} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-slate-500 mb-1.5">Nama</label>
            <input type="text" required value={form.nama} onChange={e => setForm({...form, nama: e.target.value})} className="w-full px-4 py-3 rounded-xl border-0 ring-1 ring-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-slate-500 mb-1.5">Kode Klaim (Misal: HSB123)</label>
            <input type="text" required value={form.kode_sinkronisasi} onChange={e => setForm({...form, kode_sinkronisasi: e.target.value.toUpperCase()})} className="w-full px-4 py-3 rounded-xl border-0 ring-1 ring-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all uppercase" placeholder="KODE UNIK" />
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

      {/* Tabel Data */}
      <div className="bg-white/60 backdrop-blur-2xl border border-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/50">
              <tr className="text-slate-500 text-sm">
                <th className="py-4 px-6 font-semibold">Pelanggan</th>
                <th className="py-4 px-6 font-semibold">Order ID Terakhir</th>
                <th className="py-4 px-6 font-semibold">Tagihan</th>
                <th className="py-4 px-6 font-semibold">Status (Klik untuk ubah)</th>
                <th className="py-4 px-6 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 divide-y divide-slate-100/60">
              {customers.map((cust) => (
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
                    ) : (
                      <span className="text-sm text-slate-400 italic">Belum ada transaksi</span>
                    )}
                  </td>
                  <td className="py-4 px-6 font-medium">Rp {cust.nominal?.toLocaleString('id-ID')}</td>
                  <td className="py-4 px-6">
                    <button onClick={() => toggleStatus(cust)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm border ${cust.status_aktif ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'}`}>
                      {cust.status_aktif ? <CheckCircle size={14}/> : <XCircle size={14}/>} {cust.status_aktif ? 'LUNAS' : 'TANDAI LUNAS'}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => deleteCustomer(cust.id, cust.nama)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
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