// src/App.jsx

import { Routes, Route } from "react-router-dom";
import NavBar from "./components/navbar/NavBar.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import CompleteProfile from "./pages/CompleteProfile.jsx";
import CreateJourney from "./pages/CreateJourney.jsx";
import ViewJourney from "./pages/ViewJourney.jsx";
import ContinueJourney from "./pages/ContinueJourney.jsx";
import Discover from "./pages/Discover.jsx";
import Search from "./pages/Search.jsx";
import Profile from "./pages/Profile.jsx";
import EditProfile from "./pages/Settings/EditProfile.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";

function TestHome() {
  return (
    <div style={{ padding: "2rem", fontFamily: "Inter, sans-serif" }}>
      <h1 style={{ color: "#111111" }}>Nijey</h1>
      <p style={{ color: "#666666" }}>Where creativity comes to breathe.</p>
    </div>
  );
}

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<TestHome />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/search" element={<Search />} />
        <Route
          path="/journey/new"
          element={
            <ProtectedRoute>
              <CreateJourney />
            </ProtectedRoute>
          }
        />
        <Route path="/journey/:journeyId" element={<ViewJourney />} />
        <Route
          path="/journey/:journeyId/continue"
          element={
            <ProtectedRoute>
              <ContinueJourney />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/profile"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />
        {/* Catch-all profile route — MUST stay last */}
        <Route path="/:username" element={<Profile />} />
      </Routes>
    </>
  );
}

export default App;
