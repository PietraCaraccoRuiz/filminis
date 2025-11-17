import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiService } from "../../services/api";
import logo from "../../assets/logo.svg";

import {
  FaFilm,
  FaTags,
  FaGlobeAmericas,
  FaBuilding,
  FaLanguage,
  FaUserTie,
  FaMicrophone,
} from "react-icons/fa";

const Navigation = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) =>
    location.pathname === path ? "nav-item-active nav-item" : "nav-item";

  const navItems = [
    { path: "/", label: "Filmes", icon: <FaFilm /> },
    { path: "/generos", label: "Gêneros", icon: <FaTags /> },
    { path: "/paises", label: "Países", icon: <FaGlobeAmericas /> },
    { path: "/produtoras", label: "Produtoras", icon: <FaBuilding /> },
    { path: "/idiomas", label: "Idiomas", icon: <FaLanguage /> },
    { path: "/diretores", label: "Diretores", icon: <FaUserTie /> },
    { path: "/dubladores", label: "Dubladores", icon: <FaMicrophone /> },
  ];

  const handleLogout = async () => {
    await apiService.logout();
    onLogout();
    navigate("/login");
  };

  return (
    <nav className="navigation">
      <div className="navigation-container">

        {/* LEFT — BRAND */}
        <div className="navigation-left">
          <Link to="/" className="navigation-logo">
            <img src={logo} alt="logo" className="logo" />
            Filminis
          </Link>

          {user && (
            <span
              className={`user-badge ${
                user.tipo === "admin" ? "admin" : "user"
              }`}
            >
              {user.tipo === "admin" ? "Administrador" : "Usuário"}
            </span>
          )}
        </div>

        {/* RIGHT — MENU + USER AREA */}
        {user && (
          <div className="navigation-right">

            {/* MENU */}
            <div className="navigation-menu">
              {navItems.map((item) => (
                <Link key={item.path} to={item.path} className={isActive(item.path)}>
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* USER */}
            <div className="navigation-user">
              <span className="text-sm text-muted">
                Olá, <strong>{user.username}</strong>
              </span>

              <button onClick={handleLogout} className="btn-logout">
                Sair
              </button>
            </div>

          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
