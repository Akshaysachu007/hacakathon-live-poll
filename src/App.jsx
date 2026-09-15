import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import DisplayPage from "./pages/DisplayPage";
import ChartLeaderboardPage from "./pages/ChartLeaderboardPage";
import RoundHistoryPage from "./pages/RoundHistoryPage";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/leaderboard"
          element={<LeaderboardPage />}
        />

        <Route
          path="/display"
          element={<DisplayPage />}
        />

        <Route
          path="/admin"
          element={<AdminLoginPage />}
        />

        <Route
          path="/admin/dashboard"
          element={<AdminDashboardPage />}
        />
        <Route
          path="/"
          element={<ChartLeaderboardPage />}
        />

        <Route
          path="/admin/rounds"
          element={<RoundHistoryPage />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;