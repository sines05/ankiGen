/**
 * @file App.tsx
 * @description Main application router for Doc2Anki.
 * @last_modified Refactored to use React Router and Layout component.
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import Loading from './pages/Loading'
import Review from './pages/Review'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/loading/:jobId" element={<Loading />} />
        <Route path="/review" element={<Review />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
