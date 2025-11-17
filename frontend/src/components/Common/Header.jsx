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
    <header className="bg-white shadow-sm border-b border-border-color">
      <div className="container">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">🎬 FilmCatalog</h1>
            {user && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.tipo === 'admin' 
                  ? 'bg-primary-color text-white' 
                  : 'bg-secondary-color text-white'
              }`}>
                {user.tipo === 'admin' ? 'Administrador' : 'Usuário'}
              </span>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted">
                Olá, <strong>{user.username}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;