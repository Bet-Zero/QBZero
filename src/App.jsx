import { Routes, Route, Navigate } from 'react-router-dom';
import PlayerTableView from '@/pages/PlayerTableView';
import PlayerProfileView from '@/pages/PlayerProfileView';
import ListManager from '@/pages/ListManager';
import ListsHome from '@/pages/ListsHome';
import TierMakerView from '@/pages/TierMakerView';
import TierListsHome from '@/pages/TierListsHome';
import PlayerRankerPage from '@/pages/PlayerRankerPage';
import RankerLandingPage from '@/pages/RankerLandingPage';
import RankerSetupPage from '@/pages/RankerSetupPage';
import RankerComparisonsPage from '@/pages/RankerComparisonsPage';
import RankerResultsPage from '@/pages/RankerResultsPage';
import QBRankingsPage from '@/pages/QBRankingsPage';
import QBRankingsHome from '@/pages/QBRankingsHome';
import PersonalRankingsPage from '@/pages/PersonalRankingsPage';
import WallOfFamePage from '@/pages/WallOfFamePage';
import BackupQBsHome from '@/pages/BackupQBsHome';
import BackupQBTournament from '@/pages/BackupQBTournament';
import BackupQBHallOfFame from '@/pages/BackupQBHallOfFame';
import { RankerProvider } from '@/context/RankerContext';
import SiteLayout from '@/components/layout/SiteLayout';
import NotFound from '@/pages/NotFound';
import ListPresentationView from '@/pages/ListPresentationView';
import Home from '@/pages/Home';
import ComingSoon from '@/pages/ComingSoon';

const App = () => {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/players" element={<PlayerTableView />} />
        <Route path="/profiles" element={<PlayerTableView />} />
        <Route path="/rankings" element={<QBRankingsHome />} />
        <Route path="/rankings/:rankingId" element={<QBRankingsPage />} />
        <Route path="/personal-rankings" element={<PersonalRankingsPage />} />
        <Route path="/wall-of-fame" element={<WallOfFamePage />} />
        <Route path="/lists" element={<ListsHome />} />
        <Route path="/lists/:listId" element={<ListManager />} />
        <Route path="/list-presentation" element={<ListPresentationView />} />
        <Route path="/tier-lists" element={<TierListsHome />} />
        <Route path="/tier-maker/:tierListId?" element={<TierMakerView />} />

        {/* Backup QBs Routes */}
        <Route path="/backup-qbs" element={<BackupQBsHome />} />
        <Route path="/backup-qbs/tournament" element={<BackupQBTournament />} />
        <Route
          path="/backup-qbs/hall-of-fame"
          element={<BackupQBHallOfFame />}
        />

        {/* Ranker Routes */}
        <Route element={<RankerProvider />}>
          <Route path="/ranker" element={<RankerLandingPage />} />
          <Route path="/ranker/setup" element={<RankerSetupPage />} />
          <Route
            path="/ranker/comparisons"
            element={<RankerComparisonsPage />}
          />
          <Route path="/ranker/results" element={<RankerResultsPage />} />
        </Route>

        {/* Legacy route redirect */}
        <Route
          path="/player-ranker"
          element={<Navigate to="/ranker" replace />}
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

export default App;
