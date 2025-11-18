import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
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

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      apiService
        .request("/login-check", { method: "GET" })
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem("authToken");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleRegister = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    apiService.logout();
    setUser(null);
  };

  const ProtectedRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" />;
  };

  const AdminRoute = ({ children }) => {
    return user && user.tipo === "admin" ? children : <Navigate to="/" />;
  };

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
            {/* Rotas públicas */}
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

            {/* Rotas protegidas - CRUD Principal */}
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

            {/* Rotas para entidades relacionadas */}
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

            {/* Rota padrão */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
