import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { NavBar } from './components/NavBar'
import { initWakeLockListener } from './lib/prefs'
import { TeamsListPage } from './features/teams/TeamsListPage'
import { TeamFormPage } from './features/teams/TeamFormPage'
import { TeamDetailPage } from './features/teams/TeamDetailPage'
import { PlayerProfilePage } from './features/players/PlayerProfilePage'
import { FixturesListPage } from './features/fixtures/FixturesListPage'
import { FixtureFormPage } from './features/fixtures/FixtureFormPage'
import { MatchSetupPage } from './features/match/MatchSetupPage'
import { MatchPage } from './features/match/MatchPage'
import { MatchesListPage } from './features/matches/MatchesListPage'
import { LeaderboardsPage } from './features/stats/LeaderboardsPage'
import { ExportImportPage } from './features/settings/ExportImportPage'

export default function App() {
  useEffect(() => {
    initWakeLockListener()
  }, [])

  return (
    <div className="min-h-full flex flex-col">
      <NavBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/teams" replace />} />
          <Route path="/teams" element={<TeamsListPage />} />
          <Route path="/teams/new" element={<TeamFormPage />} />
          <Route path="/teams/:teamId" element={<TeamDetailPage />} />
          <Route path="/teams/:teamId/edit" element={<TeamFormPage />} />
          <Route path="/players/:playerId" element={<PlayerProfilePage />} />
          <Route path="/fixtures" element={<FixturesListPage />} />
          <Route path="/matches" element={<MatchesListPage />} />
          <Route path="/fixtures/new" element={<FixtureFormPage />} />
          <Route path="/fixtures/:fixtureId/edit" element={<FixtureFormPage />} />
          <Route path="/fixtures/:fixtureId/setup" element={<MatchSetupPage />} />
          <Route path="/match/:matchId" element={<MatchPage />} />
          <Route path="/stats" element={<LeaderboardsPage />} />
          <Route path="/settings" element={<ExportImportPage />} />
        </Routes>
      </main>
    </div>
  )
}
