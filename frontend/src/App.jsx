import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { apiService } from "./services/api";

// Common
import Navigation from "./components/Common/Navigation";

// Auth
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";

// Movies
import MovieList from "./components/Movies/MovieList";
import MovieDetail from "./components/Movies/MovieDetail";
import MovieEdit from "./components/Movies/MovieEdit";

// Genres
import GenreList from "./components/Genres/GenreList";

// Countries
import CountryList from "./components/Countries/CountryList";

// Studios (Produtoras)
import StudioList from "./components/Studios/StudioList";

// Languages
import LanguageList from "./components/Languages/LanguageList";

// Directors
import DirectorList from "./components/Directors/DirectorList";

// Actors (Dubladores)
import ActorList from "./components/Actors/ActorList";

import "./styles/global.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Recupera sessão no carregamento
  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setLoading(false);
      return;
    }

    apiService
      .request("/login-check", { method: "GET" })
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem("authToken"))
      .finally(() => setLoading(false));
  }, []);

  // Callbacks
  const handleLogin = (data) => setUser(data.user);
  const handleRegister = (data) => setUser(data.user);
  const handleLogout = () => {
    apiService.logout();
    setUser(null);
  };

  // Guards
  const ProtectedRoute = ({ children }) =>
    user ? children : <Navigate to="/login" />;

  const AdminRoute = ({ children }) =>
    user && user.tipo === "admin" ? children : <Navigate to="/" />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-secondary">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-bg-secondary">
        {user && <Navigation user={user} onLogout={handleLogout} />}

        <main>
          <Routes>
            {/* LOGIN */}
            <Route
              path="/login"
              element={
                !user ? (
                  <Login
                    onLogin={handleLogin}
                    onSwitchToRegister={() =>
                      (window.location.href = "/register")
                    }
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* REGISTER */}
            <Route
              path="/register"
              element={
                !user ? (
                  <Register
                    onRegister={handleRegister}
                    onSwitchToLogin={() => (window.location.href = "/login")}
                  />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* MOVIES */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MovieList user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/filme/:id"
              element={
                <ProtectedRoute>
                  <MovieDetail user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/filme/editar/:id"
              element={
                <AdminRoute>
                  <MovieEdit user={user} />
                </AdminRoute>
              }
            />

            {/* GENRES */}
            <Route
              path="/generos"
              element={
                <ProtectedRoute>
                  <GenreList user={user} />
                </ProtectedRoute>
              }
            />

            {/* COUNTRIES */}
            <Route
              path="/paises"
              element={
                <ProtectedRoute>
                  <CountryList user={user} />
                </ProtectedRoute>
              }
            />

            {/* STUDIOS / PRODUTORAS */}
            <Route
              path="/produtoras"
              element={
                <ProtectedRoute>
                  <StudioList user={user} />
                </ProtectedRoute>
              }
            />

            {/* LANGUAGES */}
            <Route
              path="/idiomas"
              element={
                <ProtectedRoute>
                  <LanguageList user={user} />
                </ProtectedRoute>
              }
            />

            {/* DIRECTORS */}
            <Route
              path="/diretores"
              element={
                <ProtectedRoute>
                  <DirectorList user={user} />
                </ProtectedRoute>
              }
            />

            {/* ACTORS / DUBLADORES */}
            <Route
              path="/dubladores"
              element={
                <ProtectedRoute>
                  <ActorList user={user} />
                </ProtectedRoute>
              }
            />

            {/* DEFAULT */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
