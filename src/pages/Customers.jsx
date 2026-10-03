import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Trash2, CheckCircle, XCircle, Copy, Edit3, Search, UserPlus, Settings2 } from 'lucide-react'

// Modal Konfirmasi Hapus
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div className="bg-white/95 backdrop-blur-xl border border-white p-7 rounded-3xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200">
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 mb-8">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold">Batal</button>
          <button onClick={onConfirm} className="px-5 py-2.5 rounded-xl font-semibold text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-200">
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
  const [filterStatus, setFilterStatus] = useState('ALL') // ALL, LUNAS, BELUM
  const [toast, setToast] = useState(null)

  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false })
  const [modalForm, setModalForm] = useState({ isOpen: false, type: 'ADD' }) // type: ADD / EDIT

  // State untuk Modal Pengaturan Link Canva
  const [settingsModal, setSettingsModal] = useState({ isOpen: false, link: '' })

  const [formData, setFormData] = useState({
    id: null,
    nama: '',
    layanan: 'Gemini Pro',
    nominal: 15000,
    status_aktif: false,
    jatuh_tempo: '',
    kode_sinkronisasi: '',
    paket: 'GEMINI_1M',
    last_order_id: null
  })

  const paketOptions = [
    { id: 'CANVA_1M', nama: 'Canva Pro (1 Bulan)', harga: 5000, layanan: 'Canva Pro' },
    { id: 'CANVA_3M', nama: 'Canva Pro (3 Bulan)', harga: 13000, layanan: 'Canva Pro' },
    { id: 'GEMINI_1M', nama: 'Gemini Pro (1 Bulan)', harga: 15000, layanan: 'Gemini Pro' },
    { id: 'CANVA_6M', nama: 'Canva Pro (6 Bulan)', harga: 25000, layanan: 'Canva Pro' },
    { id: 'CANVA_1Y', nama: 'Canva Pro (1 Tahun)', harga: 35000, layanan: 'Canva Pro' },
    { id: 'CUSTOM', nama: 'Custom (Manual)', harga: '', layanan: 'Custom' }
  ]

  useEffect(() => {
    fetchCustomers()
    fetchSettings()
  }, [])

  const fetchCustomers = async () => {
    const { data } = await supabase.from('subscriptions').select('*').order('id', { ascending: false })
    if (data) setCustomers(data)
  }

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('nilai').eq('nama_pengaturan', 'link_canva').single()
    if (data) setSettingsModal(prev => ({ ...prev, link: data.nilai }))
  }

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    showToast(`${type} disalin: ${text}`);
  }

  // Generate Kode Unik 6 Karakter
  const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const openAddModal = () => {
    setFormData({
      id: null,
      nama: '',
      layanan: 'Gemini Pro',
      nominal: 15000,
      status_aktif: false,
      jatuh_tempo: '',
      kode_sinkronisasi: generateCode(),
      paket: 'GEMINI_1M',
      last_order_id: null
    })
    setModalForm({ isOpen: true, type: 'ADD' })
  }

  const openEditModal = (cust) => {
    setFormData({ ...cust, paket: 'CUSTOM', jatuh_tempo: cust.jatuh_tempo || '' })
    setModalForm({ isOpen: true, type: 'EDIT' })
  }

  const handlePaketChange = (e) => {
    const selected = paketOptions.find(p => p.id === e.target.value)
    setFormData({
      ...formData,
      paket: selected.id,
      layanan: selected.layanan !== 'Custom' ? selected.layanan : formData.layanan,
      nominal: selected.harga !== '' ? selected.harga : formData.nominal
    })
  }

  const submitForm = async (e) => {
    e.preventDefault()
    const payload = {
      nama: formData.nama,
      layanan: formData.layanan,
      nominal: parseInt(formData.nominal),
      status_aktif: formData.status_aktif,
      jatuh_tempo: formData.jatuh_tempo || null,
      kode_sinkronisasi: formData.kode_sinkronisasi || null
    }

    if (modalForm.type === 'ADD') {
      await supabase.from('subscriptions').insert([payload])
      showToast('Anggota baru berhasil ditambahkan!')
    } else {
      const oldData = customers.find(c => c.id === formData.id)
      const isJustPaid = !oldData.status_aktif && formData.status_aktif

      await supabase.from('subscriptions').update(payload).eq('id', formData.id)

      // Kirim Notif ke Bot jika baru dilunasi
      if (isJustPaid && formData.last_order_id) {
        fetch('https://payment-fstore.vercel.app/api/bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction_status: 'settlement', order_id: formData.last_order_id })
        }).catch(err => console.log(err));
      }
      showToast('Perubahan data berhasil disimpan!')
    }

    setModalForm({ isOpen: false })
    fetchCustomers()
  }

  const deleteCustomer = (id, nama) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Data',
      message: `Data langganan ${nama} akan dihapus permanen.`,
      confirmText: 'Hapus',
      onConfirm: async () => {
        await supabase.from('subscriptions').delete().eq('id', id)
        setConfirmConfig({ isOpen: false });
        fetchCustomers();
        showToast('Data dihapus!');
      }
    })
  }

  const saveSettings = async (e) => {
    e.preventDefault()
    // Upsert: update jika sudah ada, insert jika belum
    await supabase.from('settings').upsert(
      { nama_pengaturan: 'link_canva', nilai: settingsModal.link },
      { onConflict: 'nama_pengaturan' }
    )
    showToast('Link Canva berhasil diperbarui!')
    setSettingsModal(prev => ({ ...prev, isOpen: false }))
  }

  // Pencarian dan Filter
  const filteredCustomers = customers.filter(cust => {
    const matchSearch =
      cust.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.last_order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.kode_sinkronisasi?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchFilter = filterStatus === 'ALL'
      ? true
      : (filterStatus === 'LUNAS' ? cust.status_aktif : !cust.status_aktif)

    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-6 pb-20 relative">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Manajemen Pelanggan</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setSettingsModal(prev => ({ ...prev, isOpen: true }))}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 px-5 py-2.5 rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
          >
            <Settings2 size={20} /> Link Canva
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
          >
            <UserPlus size={20} /> Tambah Data
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white/60 backdrop-blur-xl border border-white p-4 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-4 top-3 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Nama / Order ID / Kode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border-0 ring-1 ring-slate-200 bg-white/70 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex bg-slate-100/80 p-1 rounded-xl">
          {['ALL', 'LUNAS', 'BELUM'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                filterStatus === status ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {status === 'ALL' ? 'Semua' : status === 'LUNAS' ? 'Lunas' : 'Belum Bayar'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Data */}
      <div className="bg-white/60 backdrop-blur-2xl border border-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50/50">
              <tr className="text-slate-500 text-sm">
                <th className="py-4 px-6 font-semibold">Pelanggan</th>
                <th className="py-4 px-6 font-semibold">Kode & Order ID</th>
                <th className="py-4 px-6 font-semibold">Tagihan / Tempo</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 divide-y divide-slate-100/60">
              {filteredCustomers.length > 0 ? filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-white/60 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-semibold text-slate-800 text-base">{cust.nama || 'Anonim'}</p>
                    <p className="text-sm text-slate-500 mt-1 bg-slate-100 px-2 py-0.5 rounded w-fit">
                      {cust.layanan || '-'}
                    </p>
                  </td>
                  <td className="py-4 px-6 space-y-2">
                    {/* Badge Kode Unik */}
                    {cust.kode_sinkronisasi ? (
                      <div
                        className="flex items-center gap-2 text-sm text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 w-fit cursor-pointer hover:bg-indigo-100 transition-colors"
                        onClick={() => copyToClipboard(cust.kode_sinkronisasi, 'Kode Unik')}
                      >
                        <span className="font-bold tracking-wider">{cust.kode_sinkronisasi}</span>
                        <Copy size={14} />
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                        Telegram Terhubung
                      </span>
                    )}

                    {/* Badge Order ID */}
                    {cust.last_order_id && (
                      <div
                        className="flex items-center gap-2 text-xs text-slate-600 bg-white/50 px-3 py-1.5 rounded-lg border border-slate-200 w-fit cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => copyToClipboard(cust.last_order_id, 'Order ID')}
                      >
                        <span className="font-mono">{cust.last_order_id.substring(0, 12)}...</span>
                        <Copy size={12} />
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-700">Rp {cust.nominal?.toLocaleString('id-ID')}</p>
                    <p className="text-xs text-slate-500 mt-1">Tempo: {cust.jatuh_tempo || 'Belum diatur'}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                        cust.status_aktif
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-rose-50 text-rose-600 border-rose-200'
                      }`}
                    >
                      {cust.status_aktif ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {cust.status_aktif ? 'LUNAS' : 'BELUM BAYAR'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(cust)}
                        className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => deleteCustomer(cust.id, cust.nama)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500 font-medium">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pengaturan Link Canva */}
      {settingsModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl border border-white p-7 rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Restock Link Canva</h3>
            <p className="text-slate-500 mb-6 text-sm">
              Link ini akan otomatis dikirimkan ke pengguna melalui bot Telegram setelah pembayaran Canva mereka berstatus Lunas.
            </p>
            <form onSubmit={saveSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Tautan Invite Tim (Active)</label>
                <input
                  type="url"
                  required
                  value={settingsModal.link}
                  onChange={e => setSettingsModal({ ...settingsModal, link: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-0 ring-1 ring-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://www.canva.com/brand/join?token=..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSettingsModal(prev => ({ ...prev, isOpen: false }))}
                  className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
                >
                  Simpan Tautan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form Modal (Tambah & Edit) */}
      {modalForm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-xl border border-white p-7 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">
              {modalForm.type === 'ADD' ? 'Registrasi Anggota Baru' : 'Edit Data Pelanggan'}
            </h3>
            <form onSubmit={submitForm} className="space-y-5">
              <div className="flex gap-4">
                <div className="flex-[2]">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-0 ring-1 ring-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Kode Unik</label>
                  <input
                    type="text"
                    value={formData.kode_sinkronisasi}
                    onChange={e => setFormData({ ...formData, kode_sinkronisasi: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 rounded-xl border-0 ring-1 ring-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700 uppercase"
                    placeholder="Kosongkan jika terhubung"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Paket Harga</label>
                  <select
                    value={formData.paket}
                    onChange={handlePaketChange}
                    className="w-full px-4 py-3 rounded-xl border-0 ring-1 ring-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {paketOptions.map(p => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>
                {formData.paket === 'CUSTOM' && (
                  <div className="flex-1 animate-in slide-in-from-right-4">
                    <label className="block text-sm font-medium text-slate-600 mb-1">Harga Custom (Rp)</label>
                    <input
                      type="number"
                      required
                      value={formData.nominal}
                      onChange={e => setFormData({ ...formData, nominal: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-0 ring-1 ring-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {formData.paket === 'CUSTOM' && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Layanan Custom</label>
                  <input
                    type="text"
                    required
                    value={formData.layanan}
                    onChange={e => setFormData({ ...formData, layanan: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-0 ring-1 ring-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Status Pembayaran</label>
                  <select
                    value={formData.status_aktif}
                    onChange={e => setFormData({ ...formData, status_aktif: e.target.value === 'true' })}
                    className="w-full px-4 py-3 rounded-xl border-0 ring-1 ring-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value={true}>✅ Lunas</option>
                    <option value={false}>❌ Belum Bayar</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-600 mb-1">Tgl Jatuh Tempo (Opsional)</label>
                  <input
                    type="date"
                    value={formData.jatuh_tempo}
                    onChange={e => setFormData({ ...formData, jatuh_tempo: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-0 ring-1 ring-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setModalForm({ isOpen: false })}
                  className="px-5 py-3 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification (Glassmorphism Float) */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-800/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl font-medium tracking-wide border border-slate-600/50 flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-400" />
            {toast}
          </div>
        </div>
      )}

      <ConfirmModal {...confirmConfig} onCancel={() => setConfirmConfig({ isOpen: false })} />
    </div>
  )
}