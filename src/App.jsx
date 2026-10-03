import { Routes, Route, Navigate } from 'react-router-dom';
import lazyPage from '@/utils/lazyPage';
import { RankerProvider } from '@/context/RankerContext';
import SiteLayout from '@/components/layout/SiteLayout';
import NotFound from '@/pages/NotFound';
import Home from '@/pages/Home';
import AdminProtectedRoute from '@/components/shared/AdminProtectedRoute';

// Home and the 404 are tiny and are the likeliest first paint, so they stay in
// the main bundle. Every other page loads on first visit; SiteLayout holds the
// header in place while it does.
const PlayerTableView = lazyPage(() => import('@/pages/PlayerTableView'));
const PlayerProfileView = lazyPage(() => import('@/pages/PlayerProfileView'));
const ListManager = lazyPage(() => import('@/pages/ListManager'));
const ListsHome = lazyPage(() => import('@/pages/ListsHome'));
const TierMakerView = lazyPage(() => import('@/pages/TierMakerView'));
const TierListsHome = lazyPage(() => import('@/pages/TierListsHome'));
const RankerLandingPage = lazyPage(() => import('@/pages/RankerLandingPage'));
const RankerSetupPage = lazyPage(() => import('@/pages/RankerSetupPage'));
const RankerComparisonsPage = lazyPage(
  () => import('@/pages/RankerComparisonsPage')
);
const RankerResultsPage = lazyPage(() => import('@/pages/RankerResultsPage'));
const QBRankingsPage = lazyPage(() => import('@/pages/QBRankingsPage'));
const QBRankingsHome = lazyPage(() => import('@/pages/QBRankingsHome'));
const BrowseRankingsPage = lazyPage(() => import('@/pages/BrowseRankingsPage'));
const PublicQBRankingsPage = lazyPage(
  () => import('@/pages/PublicQBRankingsPage')
);
const QBWPage = lazyPage(() => import('@/pages/QBWPage'));
const BackupQBsHome = lazyPage(() => import('@/pages/BackupQBsHome'));
const BackupQBHallOfFame = lazyPage(() => import('@/pages/BackupQBHallOfFame'));
const ListPresentationView = lazyPage(
  () => import('@/pages/ListPresentationView')
);

const App = () => {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/players" element={<PlayerTableView />} />
        <Route
          path="/profiles"
          element={
            <AdminProtectedRoute>
              <PlayerProfileView />
            </AdminProtectedRoute>
          }
        />

        {/* Personal Rankings - Read-only public access */}
        <Route path="/rankings" element={<PublicQBRankingsPage />} />

        {/* The history behind the public rankings: every past snapshot, plus
            the standalone ranking lists by name. Every other surface that
            shows those is admin-gated and the nav has always drawn this one
            with a padlock, so the route now matches. */}
        <Route
          path="/rankings/browse"
          element={
            <AdminProtectedRoute>
              <BrowseRankingsPage />
            </AdminProtectedRoute>
          }
        />

        {/* Private Edit Access - Protected by admin system */}
        <Route
          path="/rankings/edit"
          element={
            <AdminProtectedRoute>
              <QBRankingsPage />
            </AdminProtectedRoute>
          }
        />

        {/* Legacy redirects for old personal rankings routes */}
        <Route
          path="/my-rankings"
          element={<Navigate to="/rankings" replace />}
        />
        <Route
          path="/my-rankings/edit"
          element={<Navigate to="/rankings" replace />}
        />

        {/* Other Rankings Management */}
        <Route
          path="/rankings/all"
          element={
            <AdminProtectedRoute>
              <QBRankingsHome />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/rankings/other/:rankingId"
          element={
            <AdminProtectedRoute>
              <QBRankingsPage />
            </AdminProtectedRoute>
          }
        />

        <Route path="/qbw" element={<QBWPage />} />
        <Route
          path="/lists"
          element={
            <AdminProtectedRoute>
              <ListsHome />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/lists/:listId"
          element={
            <AdminProtectedRoute>
              <ListManager />
            </AdminProtectedRoute>
          }
        />
        <Route path="/list-presentation" element={<ListPresentationView />} />
        <Route
          path="/tier-lists"
          element={
            <AdminProtectedRoute>
              <TierListsHome />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/tier-maker/:tierListId?"
          element={
            <AdminProtectedRoute>
              <TierMakerView />
            </AdminProtectedRoute>
          }
        />

        {/* Backup QBs Routes */}
        <Route path="/backup-qbs" element={<BackupQBsHome />} />
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
