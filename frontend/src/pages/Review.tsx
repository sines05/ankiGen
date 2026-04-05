import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { API_URL, type JobStatus, type Flashcard } from '../services/api'

export default function Review() {
  const location = useLocation()
  const navigate = useNavigate()
  const jobId = location.state?.jobId
  const initialFileName = location.state?.fileName || 'MyDeck'
  
  const [cards, setCards] = useState<Flashcard[]>([])
  const [deckName, setDeckName] = useState(initialFileName)

  const { data } = useQuery<JobStatus>({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/v1/job-status/${jobId}`)
      if (!res.ok) throw new Error('Failed to fetch status')
      return res.json()
    },
    enabled: !!jobId,
    staleTime: 1000 * 60 * 5, // Keep data fresh for 5 mins
  })

  useEffect(() => {
    if (data?.data && cards.length === 0) {
      setCards(data.data)
    }
  }, [data, cards.length])

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/v1/export-apkg`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deck_name: deckName, cards })
      })
      if (!res.ok) throw new Error('Export failed')
      return res.blob()
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${deckName}.apkg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    },
    onError: (err: any) => alert(err.message)
  })

  if (!jobId && cards.length === 0) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-2xl font-bold">No data to review</h2>
        <button onClick={() => navigate('/')} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg">Go Back Home</button>
      </div>
    )
  }

  return (
    <section className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight">Review your Flashcards</h2>
          <p className="text-on-surface-variant">Manage and edit your exported deck.</p>
        </div>
        <button 
          onClick={() => setCards([...cards, { front: '', back: '' }])}
          className="px-5 py-2.5 bg-surface-container-high hover:bg-surface-container-highest rounded-lg font-medium text-sm flex items-center gap-2 dark:bg-slate-800">
          <span className="material-symbols-outlined text-lg">add</span> Add new card
        </button>
      </div>

      <div className="bg-surface-container-low rounded-2xl p-2 space-y-2 dark:bg-slate-900 border border-outline-variant/10">
        {cards.map((c, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-[60px_1fr_1fr_80px] gap-4 p-4 bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-shadow group dark:bg-slate-800">
            <div className="flex items-center justify-center font-bold text-outline">#{i + 1}</div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Front</label>
              <textarea 
                value={c.front}
                onChange={e => {
                  const newCards = [...cards]; newCards[i].front = e.target.value; setCards(newCards)
                }}
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium resize-none shadow-none focus-within:outline-none"
                rows={3} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Back</label>
              <textarea 
                value={c.back}
                onChange={e => {
                  const newCards = [...cards]; newCards[i].back = e.target.value; setCards(newCards)
                }}
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-on-surface-variant resize-none shadow-none focus-within:outline-none"
                rows={3} />
            </div>
            <div className="flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => {
                   const newCards = [...cards]; newCards.splice(i, 1); setCards(newCards)
                }}
                className="p-2 text-error hover:bg-error-container rounded-lg transition-colors">
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-8 inset-x-0 px-6 z-40">
        <div className="max-w-4xl mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-outline-variant/20 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full md:w-auto">
            <label className="text-[10px] font-bold uppercase tracking-wider text-outline block mb-1 px-1">Deck Name</label>
            <input 
              value={deckName}
              onChange={e => setDeckName(e.target.value)}
              className="w-full bg-surface-container-low dark:bg-slate-800 border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm p-3 font-semibold"
              type="text" />
          </div>
          <button 
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="w-full md:w-auto px-8 py-4 primary-gradient text-white font-bold rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50">
            <span className="material-symbols-outlined">download</span>
            {exportMutation.isPending ? 'Exporting...' : 'Export to Anki (.apkg)'}
          </button>
        </div>
      </div>
    </section>
  )
}
