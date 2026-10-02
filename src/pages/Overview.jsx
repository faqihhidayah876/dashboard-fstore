import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Wallet, Users, Activity } from 'lucide-react'

export default function Overview() {
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, revenue: 0 })
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('subscriptions').select('*')
      if (data) {
        const active = data.filter(d => d.status_aktif)
        const revenue = active.reduce((sum, d) => sum + (d.nominal || 0), 0)
        setStats({ totalUsers: data.length, activeUsers: active.length, revenue })

        // Data dummy untuk grafik visual (bisa diganti sesuai tanggal jika ada kolom tanggal)
        setChartData([
          { name: 'Gemini Pro', total: active.filter(d => d.layanan === 'Gemini Pro').length * 15000 },
          { name: 'Canva Pro', total: active.filter(d => d.layanan === 'Canva Pro').length * 20000 },
        ])
      }
    }
    fetchData()
  }, [])

  const cards = [
    { title: 'Total Pendapatan Aktif', value: `Rp ${stats.revenue.toLocaleString('id-ID')}`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Pelanggan Aktif', value: stats.activeUsers, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: 'Total Terdaftar', value: stats.totalUsers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Overview Pendapatan</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center gap-5">
            <div className={`p-4 rounded-2xl ${card.bg} ${card.color}`}>
              <card.icon size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{card.title}</p>
              <h3 className="text-2xl font-bold text-slate-800">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)] h-96">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Pendapatan per Layanan</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${value/1000}k`} />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }} />
            <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}