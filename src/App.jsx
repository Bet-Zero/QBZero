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
import { RankerProvider } from '@/context/RankerContext';
import SiteLayout from '@/components/layout/SiteLayout';
import NotFound from '@/pages/NotFound';
import ListPresentationView from '@/pages/ListPresentationView';

const App = () => {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Navigate to="/players" replace />} />
        <Route path="/players" element={<PlayerTableView />} />
        <Route path="/profiles" element={<PlayerProfileView />} />
        <Route path="/lists" element={<ListsHome />} />
        <Route path="/lists/:listId" element={<ListManager />} />
        <Route path="/list-presentation" element={<ListPresentationView />} />
        <Route path="/tier-lists" element={<TierListsHome />} />
        <Route path="/tier-maker/:tierListId?" element={<TierMakerView />} />

        {/* Ranker Routes with shared context */}
        <Route
          path="/ranker/*"
          element={
            <RankerProvider>
              <Routes>
                <Route path="/" element={<RankerLandingPage />} />
                <Route path="/setup" element={<RankerSetupPage />} />
                <Route
                  path="/comparisons"
                  element={<RankerComparisonsPage />}
                />
                <Route path="/results" element={<RankerResultsPage />} />
              </Routes>
            </RankerProvider>
          }
        />

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
