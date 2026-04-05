import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { API_URL, type JobStatus } from '../services/api'
import { useEffect } from 'react'

export default function Loading() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const fileName = location.state?.fileName || 'Document'

  const { data, error } = useQuery<JobStatus>({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/v1/job-status/${jobId}`)
      if (!res.ok) throw new Error('Failed to fetch status')
      return res.json()
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return (status === 'completed' || status === 'failed') ? false : 2000
    },
    enabled: !!jobId,
  })

  useEffect(() => {
    if (data?.status === 'completed' && data.data) {
        // Set the deck name and cards in a "global" cache or state before navigating
        // For now, let's just navigate. Review page will fetch from this same query.
        navigate('/review', { state: { jobId, fileName: fileName.split('.')[0] } })
    }
  }, [data, navigate, jobId, fileName])

  if (data?.status === 'failed' || error) {
    return (
      <section className="py-24 text-center space-y-6">
        <div className="w-20 h-20 bg-error-container text-error rounded-full flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-4xl">error</span>
        </div>
        <h2 className="text-2xl font-bold text-error">Generation Failed</h2>
        <p className="text-on-surface-variant max-w-md mx-auto">{data?.error || (error as any)?.message}</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-surface-container-high rounded-xl font-bold">Try Again</button>
      </section>
    )
  }

  return (
    <section className="py-24 flex flex-col items-center justify-center text-center space-y-12 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-32 h-32 rounded-full border-4 border-surface-container-highest animate-pulse"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-primary animate-spin" style={{animationDuration: '3s'}}>sync</span>
        </div>
      </div>
      <div className="space-y-6 max-w-md">
        <h2 className="text-2xl font-bold">AI is analyzing your {fileName}...</h2>
        <div className="flex items-center gap-4 px-6 py-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-primary/20">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="font-bold text-primary">{data?.progress || 'Wait a moment...'}</span>
        </div>
      </div>
    </section>
  )
}
