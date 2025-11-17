import React from 'react';
import { apiService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await apiService.logout();
    onLogout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-container">
        {/* LOGO + TÍTULO */}
        <div className="header-left">
          <h1 className="header-title">🎬 FilmCatalog</h1>

          {user && (
            <span
              className={`user-badge ${
                user.tipo === "admin" ? "badge-admin" : "badge-user"
              }`}
            >
              {user.tipo === "admin" ? "Administrador" : "Usuário"}
            </span>
          )}
        </div>

        {/* USER + LOGOUT */}
        {user && (
          <div className="header-right">
            <span className="header-welcome">
              Olá, <strong>{user.username}</strong>
            </span>

            <button className="btn-outline btn-sm" onClick={handleLogout}>
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
