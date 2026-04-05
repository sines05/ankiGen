export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export type Flashcard = {
  front: string
  back: string
}

export type JobStatus = {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress?: string
  data?: Flashcard[]
  error?: string
}
