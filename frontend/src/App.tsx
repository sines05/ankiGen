/**
 * @file App.tsx
 * @description The main React component for the Doc2Anki application. Manages file upload, state transitions (upload -> loading -> review), background API polling, and Anki package export.
 * @last_modified Added custom prompt feature with pre-defined styles (MCQs, True/False) and custom user instructions.
 */

import { useState, useRef, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

type AppState = 'upload' | 'loading' | 'review'

type Flashcard = {
  front: string
  back: string
}

function App() {
  const [appState, setAppState] = useState<AppState>('upload')
  const [theme, setTheme] = useState<'light'|'dark'>('light')
  
  const [file, setFile] = useState<File | null>(null)
  const [language, setLanguage] = useState('English')
  const [maxCards, setMaxCards] = useState(20)
  const [cardStyle, setCardStyle] = useState('Standard Key Concepts')
  const [customPrompt, setCustomPrompt] = useState('')
  
  const [cards, setCards] = useState<Flashcard[]>([])
  const [deckName, setDeckName] = useState('My_Deck')
  const [processingProgress, setProcessingProgress] = useState('Reading document...')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      const validExtensions = ['.pdf', '.txt', '.md', '.csv', '.png', '.jpg', '.jpeg', '.webp', '.mp3', '.wav', '.mp4']
      const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase()

      if (!validExtensions.includes(fileExtension)) {
        alert('Invalid file format. Please upload a Document, Image, Audio, or Video file.')
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      if (selectedFile.size > 100 * 1024 * 1024) {
        alert('File size exceeds the 100MB limit.')
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      setFile(selectedFile)
    }
  }

  const handleGenerate = async () => {
    if (!file) {
      alert("Please select a file first!")
      return
    }
    
    setAppState('loading')
    setProcessingProgress('Uploading file...')
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('language', language)
    formData.append('max_cards', maxCards.toString())
    
    let finalPrompt = ""
    if (cardStyle === 'Custom Instructions') {
        finalPrompt = customPrompt
    } else if (cardStyle !== 'Standard Key Concepts') {
        finalPrompt = `Extract as: ${cardStyle}`
    }
    formData.append('custom_prompt', finalPrompt)
    
    try {
      const uploadRes = await fetch(`${API_URL}/api/v1/upload-document`, {
        method: 'POST',
        body: formData
      })
      
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.detail || 'Upload failed')
      
      const jobId = uploadData.job_id
      
      // Polling
      const poll = setInterval(async () => {
        try {
          const res = await fetch(`${API_URL}/api/v1/job-status/${jobId}`)
          const data = await res.json()
          
          if (data.status === 'completed') {
            clearInterval(poll)
            setCards(data.data)
            setDeckName(file.name.split('.')[0] + '_Flashcards')
            setAppState('review')
          } else if (data.status === 'failed') {
            clearInterval(poll)
            alert('Generation failed: ' + data.error)
            setAppState('upload')
          } else {
            setProcessingProgress(data.progress || 'Processing...')
          }
        } catch (err) {
          console.error("Polling error", err)
        }
      }, 3000)
      
    } catch(err: any) {
      alert("Error: " + err.message)
      setAppState('upload')
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/export-apkg`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deck_name: deckName,
          cards: cards
        })
      })
      
      if (!res.ok) throw new Error('Export failed')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${deckName}.apkg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      
    } catch(err: any) {
      alert("Export Error: " + err.message)
    }
  }

  const handleAddCard = () => {
    setCards([...cards, {front: '', back: ''}])
  }

  const handleRemoveCard = (index: number) => {
    const newCards = [...cards]
    newCards.splice(index, 1)
    setCards(newCards)
  }

  const handleCardChange = (index: number, field: 'front'|'back', value: string) => {
    const newCards = [...cards]
    newCards[index][field] = value
    setCards(newCards)
  }

  return (
    <div className="text-on-surface bg-background min-h-screen">
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
          <div className="flex justify-between items-center h-16 px-6 lg:px-12 max-w-7xl mx-auto">
              <div className="flex items-center gap-3">
                  <span className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white">Doc2Anki</span>
              </div>
              <div className="flex items-center gap-6">
                  <nav className="hidden md:flex gap-8 items-center">
                      <button onClick={() => setAppState('upload')} className={`${appState === 'upload' ? 'text-indigo-600' : 'text-slate-500'} font-semibold tracking-tight`}>Upload</button>
                      <button className={`${appState === 'loading' ? 'text-indigo-600' : 'text-slate-500'} font-semibold tracking-tight`}>Processing</button>
                      <button className={`${appState === 'review' ? 'text-indigo-600' : 'text-slate-500'} font-semibold tracking-tight`}>Review</button>
                  </nav>
                  <button onClick={toggleTheme} className="material-symbols-outlined text-on-surface-variant transition-transform active:scale-90 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                    {theme === 'light' ? 'dark_mode' : 'light_mode'}
                  </button>
              </div>
          </div>
      </header>

      <main className="pt-24 pb-32 max-w-5xl mx-auto px-6">
          
          {appState === 'upload' && (
          <section className="space-y-12 animate-in fade-in duration-500">
              <div className="text-center space-y-4">
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface">
                      Turn any document into Anki flashcards in <span className="text-primary">seconds.</span>
                  </h1>
                  <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
                      The Digital Curator for your knowledge. Our AI analyzes your lectures, notes, and PDFs to create perfectly formatted study decks.
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
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,audio/*,video/*,.pdf,.txt,.md,.csv" className="hidden" />
                          <button className="px-6 py-3 bg-white text-on-surface font-semibold rounded-xl border border-outline-variant/30 hover:translate-y-[-2px] transition-transform shadow-sm">
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
                                  <select value={language} onChange={e=>setLanguage(e.target.value)} className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm p-3">
                                      <option>English</option>
                                      <option>Vietnamese</option>
                                      <option>Spanish</option>
                                      <option>German</option>
                                      <option>French</option>
                                  </select>
                              </div>
                              <div className="space-y-2">
                                  <label className="text-sm font-medium text-on-surface">Max Flashcards</label>
                                  <input type="number" value={maxCards} onChange={e=>setMaxCards(Number(e.target.value))} className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm p-3" />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-sm font-medium text-on-surface">Card Style</label>
                                  <select value={cardStyle} onChange={e=>setCardStyle(e.target.value)} className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm p-3">
                                      <option>Standard Key Concepts</option>
                                      <option>MCQs (Multiple Choice)</option>
                                      <option>True/False Questions</option>
                                      <option>Custom Instructions</option>
                                  </select>
                              </div>
                              {cardStyle === 'Custom Instructions' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-sm font-medium text-on-surface">Custom Instructions</label>
                                    <textarea value={customPrompt} onChange={e=>setCustomPrompt(e.target.value)} placeholder="E.g. Focus on terminologies..." className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm p-3 resize-none h-24"></textarea>
                                </div>
                              )}
                              <div className="pt-4">
                                  <button onClick={handleGenerate} className="w-full primary-gradient text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95">
                                      Generate Flashcards
                                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                  </button>
                              </div>
                          </div>
                      </div>
                      <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/10 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center">
                              <span className="material-symbols-outlined text-on-secondary-fixed-variant">lightbulb</span>
                          </div>
                          <p className="text-xs text-on-secondary-container">Tip: Upload lecture slides for the best anatomical structure mapping.</p>
                      </div>
                  </div>
              </div>
          </section>
          )}

          {appState === 'loading' && (
          <section className="py-24 flex flex-col items-center justify-center text-center space-y-12 animate-in fade-in duration-500">
              <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-surface-container-highest animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-primary animate-spin" style={{animationDuration: '3s'}}>sync</span>
                  </div>
              </div>
              <div className="space-y-6 max-w-md">
                  <h2 className="text-2xl font-bold">Gemini is analyzing your document...</h2>
                  <div className="space-y-4">
                      
                      <div className="flex items-center gap-4 px-6 py-4 bg-white rounded-xl shadow-sm border border-primary/20">
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span className="font-bold text-primary">{processingProgress}</span>
                      </div>
                      
                  </div>
              </div>
          </section>
          )}

          {appState === 'review' && (
          <section className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-1">
                      <h2 className="text-3xl font-extrabold tracking-tight">Review your Flashcards</h2>
                      <p className="text-on-surface-variant">We extracted {cards.length} key concepts for your deck.</p>
                  </div>
                  <button onClick={handleAddCard} className="px-5 py-2.5 bg-surface-container-high hover:bg-surface-container-highest rounded-lg font-medium text-sm flex items-center gap-2 transition-colors">
                      <span className="material-symbols-outlined text-lg">add</span>
                      Add new card
                  </button>
              </div>

              <div className="bg-surface-container-low rounded-2xl p-2 space-y-2">
                  {cards.map((c, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-[60px_1fr_1fr_80px] gap-4 p-4 bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex items-center justify-center font-bold text-outline">#{i+1}</div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Front</label>
                          <textarea 
                            value={c.front}
                            onChange={e=>handleCardChange(i, 'front', e.target.value)}
                            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium resize-none shadow-none" 
                            rows={3}></textarea>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-outline">Back</label>
                          <textarea 
                            value={c.back}
                            onChange={e=>handleCardChange(i, 'back', e.target.value)}
                            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-on-surface-variant resize-none shadow-none" 
                            rows={3}></textarea>
                      </div>
                      <div className="flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleRemoveCard(i)} className="p-2 text-error hover:bg-error-container rounded-lg transition-colors">
                              <span className="material-symbols-outlined">delete</span>
                          </button>
                      </div>
                  </div>
                  ))}
              </div>

              <div className="fixed bottom-8 inset-x-0 px-6">
                  <div className="max-w-4xl mx-auto bg-surface-container-lowest/80 glass-effect border border-outline-variant/20 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-1 w-full md:w-auto">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-outline block mb-1">Deck Name</label>
                          <input 
                            value={deckName}
                            onChange={e=>setDeckName(e.target.value)}
                            className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-0 rounded-lg text-sm p-3 font-semibold" 
                            type="text" />
                      </div>
                      <button onClick={handleExport} className="w-full md:w-auto px-8 py-4 primary-gradient text-white font-bold rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform active:scale-95">
                          <span className="material-symbols-outlined">download</span>
                          Export to Anki (.apkg)
                      </button>
                  </div>
              </div>
          </section>
          )}

      </main>
    </div>
  )
}

export default App
