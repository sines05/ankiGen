import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { API_URL } from '../services/api'

export default function Home() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [language, setLanguage] = useState('English')
  const [maxCards, setMaxCards] = useState(20)
  const [isAutoCards, setIsAutoCards] = useState(false)
  const [cardStyle, setCardStyle] = useState('Standard Key Concepts')
  const [customPrompt, setCustomPrompt] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Please select a file first!")
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('language', language)
      formData.append('max_cards', isAutoCards ? '0' : maxCards.toString())
      
      let finalPrompt = ""
      if (cardStyle === 'Custom Instructions') {
          finalPrompt = customPrompt
      } else if (cardStyle !== 'Standard Key Concepts') {
          finalPrompt = `Extract as: ${cardStyle}`
      }
      formData.append('custom_prompt', finalPrompt)

      const res = await fetch(`${API_URL}/api/v1/upload-document`, {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Upload failed')
      return data.job_id
    },
    onSuccess: (jobId) => {
      navigate(`/loading/${jobId}`, { state: { fileName: file?.name } })
    },
    onError: (err: any) => {
      alert(err.message)
    }
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      const validExtensions = ['.pdf', '.txt', '.md', '.csv', '.png', '.jpg', '.jpeg', '.webp', '.mp3', '.wav', '.mp4']
      const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase()

      if (!validExtensions.includes(fileExtension)) {
        alert('Invalid file format.')
        return
      }

      if (selectedFile.size > 100 * 1024 * 1024) {
        alert('File size exceeds the 100MB limit.')
        return
      }

      setFile(selectedFile)
    }
  }

  return (
    <section className="space-y-12 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface">
          Turn any document into Anki flashcards in <span className="text-primary">seconds.</span>
        </h1>
        <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
          Our AI analyzes your lectures, notes, and PDFs to create perfectly formatted study decks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-8 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="relative bg-surface-container-low border-2 border-dashed border-outline-variant rounded-xl p-12 transition-all duration-300 hover:bg-primary-fixed hover:border-primary-container h-[400px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
              <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">{file ? file.name : 'Drag and drop your document'}</h3>
            <p className="text-on-surface-variant mb-8">PDF, Images, Audio, Video, Docs (Max 100MB)</p>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <button className="px-6 py-3 bg-white dark:bg-slate-800 text-on-surface font-semibold rounded-xl border border-outline-variant/30 hover:translate-y-[-2px] transition-transform shadow-sm">
              Browse Files
            </button>
          </div>
        </div>

        <div className="md:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10">
            <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">Extraction Settings</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface">Target Language</label>
                <select value={language} onChange={e=>setLanguage(e.target.value)} className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm p-3 dark:bg-slate-800">
                  <option>English</option>
                  <option>Vietnamese</option>
                  <option>Spanish</option>
                  <option>German</option>
                  <option>French</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-on-surface">Max Flashcards</label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={isAutoCards} onChange={e=>setIsAutoCards(e.target.checked)} className="w-4 h-4 rounded text-primary focus:ring-primary/20" />
                    <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant group-hover:text-primary transition-colors">Auto</span>
                  </label>
                </div>
                {!isAutoCards ? (
                  <input type="number" value={maxCards} onChange={e=>setMaxCards(Number(e.target.value))} min={1} max={100} className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm p-3 dark:bg-slate-800" />
                ) : (
                  <div className="w-full bg-primary-fixed/30 border border-primary/20 rounded-lg text-sm p-3 text-primary font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                    <span className="material-symbols-outlined text-sm">magic_button</span>
                    AI will decide best quantity
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-on-surface">Card Style</label>
                <select value={cardStyle} onChange={e=>setCardStyle(e.target.value)} className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm p-3 dark:bg-slate-800">
                  <option>Standard Key Concepts</option>
                  <option>MCQs (Multiple Choice)</option>
                  <option>True/False Questions</option>
                  <option>Custom Instructions</option>
                </select>
              </div>
              {cardStyle === 'Custom Instructions' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-medium text-on-surface">Instructions</label>
                  <textarea value={customPrompt} onChange={e=>setCustomPrompt(e.target.value)} placeholder="E.g. Focus on terminologies..." className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm p-3 resize-none h-24 dark:bg-slate-800"></textarea>
                </div>
              )}
              <div className="pt-4">
                <button 
                  onClick={() => uploadMutation.mutate()} 
                  disabled={uploadMutation.isPending}
                  className="w-full primary-gradient text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50">
                  {uploadMutation.isPending ? 'Uploading...' : 'Generate Flashcards'}
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
