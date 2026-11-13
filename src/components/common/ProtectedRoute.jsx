// src/components/common/ProtectedRoute.jsx
//
// Wraps a page and only renders it if someone is logged in.
// If not, redirects to /signup instead.
// Usage: <Route path="/journey/new" element={<ProtectedRoute><CreateJourney /></ProtectedRoute>} />

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

function ProtectedRoute({ children }) {
  const { user } = useAuth();

  // AuthContext already handles the "loading" state (see AuthProvider) —
  // by the time any page renders, we already know for sure if `user` exists or not.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
