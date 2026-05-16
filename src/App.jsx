import { useState, useCallback } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Inventory from './components/Inventory'
import GamesLibrary from './components/GamesLibrary'
import BuildSection from './components/BuildSection'
import HowItWorks from './components/HowItWorks'
import TrustSafety from './components/TrustSafety'
import BottomNav from './components/BottomNav'
import Footer from './components/Footer'
import BookingModal from './components/BookingModal'
import PolicyModal from './components/PolicyModal'
import SupportModal from './components/SupportModal'
import { POLICIES } from './policies'
import { AudioEngagementProvider } from './audioEngagement'

export default function App() {
  const [modalOpen, setModalOpen] = useState(false)
  const [preselected, setPreselected] = useState('')
  const [policyId, setPolicyId] = useState('')
  const [supportOpen, setSupportOpen] = useState(false)

  const openBooking = useCallback((consoleId = '') => {
    setPreselected(consoleId)
    setModalOpen(true)
  }, [])
  const closeBooking = useCallback(() => setModalOpen(false), [])

  const openPolicy = useCallback((id) => setPolicyId(id), [])
  const closePolicy = useCallback(() => setPolicyId(''), [])

  const openSupport = useCallback(() => setSupportOpen(true), [])
  const closeSupport = useCallback(() => setSupportOpen(false), [])

  return (
    <AudioEngagementProvider>
      <div className="min-h-screen flex flex-col bg-background text-on-surface">
        <Header onBook={openBooking} />
        <main className="kinetic-grid flex-1">
          <Hero onBook={openBooking} />
          <Inventory onBook={openBooking} />
          <GamesLibrary onBook={openBooking} />
          <BuildSection />
          <HowItWorks />
          <TrustSafety />
        </main>
        <Footer onSupport={openSupport} onOpenPolicy={openPolicy} />
        <BottomNav onBook={openBooking} onSupport={openSupport} />
        <BookingModal open={modalOpen} onClose={closeBooking} preselectedConsoleId={preselected} />
        <PolicyModal policy={policyId ? POLICIES[policyId] : null} onClose={closePolicy} />
        <SupportModal open={supportOpen} onClose={closeSupport} />
      </div>
    </AudioEngagementProvider>
  )
}
