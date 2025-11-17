import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { apiService } from "./services/api";

import Navigation from "./components/Common/Navigation";

import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";

import MovieList from "./components/Movies/MovieList";
import MovieDetail from "./components/Movies/MovieDetail";
import MovieEdit from "./components/Movies/MovieEdit";

import GenreList from "./components/Genres/GenreList";
import CountryList from "./components/Countries/CountryList";
import StudioList from "./components/Studios/StudioList";
import LanguageList from "./components/Languages/LanguageList";
import DirectorList from "./components/Directors/DirectorList";
import ActorList from "./components/Actors/ActorList";

import "./styles/global.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carrega token ao abrir app
  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const data = await apiService.request("/me");
        setUser(data.user);
      } catch (err) {
        apiService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLogin = (userData) => setUser(userData);
  const handleRegister = () => {}; // opcional, registro só avisa sucesso
  const handleLogout = () => {
    apiService.logout();
    setUser(null);
  };

  const ProtectedRoute = ({ children }) =>
    user ? children : <Navigate to="/login" replace />;

  const AdminRoute = ({ children }) =>
    user && user.tipo === "admin" ? (
      children
    ) : (
      <Navigate to="/" replace />
    );

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <p className="subtitle">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-wrapper">
        {user && <Navigation user={user} onLogout={handleLogout} />}

        <main className="main-content">
          <Routes>
            {/* LOGIN */}
            <Route
              path="/login"
              element={
                !user ? (
                  <Login
                    onLogin={handleLogin}
                    onSwitchToRegister={() => <Navigate to="/register" replace />}
                  />
                ) : (
                  <Navigate to="/" replace />
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
                    onSwitchToLogin={() => <Navigate to="/login" replace />}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />

            {/* ROTAS PROTEGIDAS */}
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

            <Route
              path="/generos"
              element={
                <ProtectedRoute>
                  <GenreList user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/paises"
              element={
                <ProtectedRoute>
                  <CountryList user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/produtoras"
              element={
                <ProtectedRoute>
                  <StudioList user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/idiomas"
              element={
                <ProtectedRoute>
                  <LanguageList user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/diretores"
              element={
                <ProtectedRoute>
                  <DirectorList user={user} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dubladores"
              element={
                <ProtectedRoute>
                  <ActorList user={user} />
                </ProtectedRoute>
              }
            />

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
