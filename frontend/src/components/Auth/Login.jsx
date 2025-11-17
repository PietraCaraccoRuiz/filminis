import React, { useState } from "react";
import { motion } from "framer-motion";
import logo from "../../assets/logo.svg";
import { apiService } from "../../services/api";

import { IoEye, IoEyeOff } from "react-icons/io5";
import { FaRegUser } from "react-icons/fa6";
import { RiLockPasswordLine } from "react-icons/ri";

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await apiService.login(
        formData.username,
        formData.password
      );

      onLogin(user);
    } catch (err) {
      setError(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc) => {
    setFormData({ username: acc.username, password: acc.password });
  };

  const demoAccounts = [
    { username: "admin", password: "admin123", type: "Admin" },
    { username: "usuario1", password: "user123", type: "User" },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.5, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, filter: "blur(6px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.35 },
    },
  };

  return (
    <div className="page-wrapper">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="auth-card"
      >
        <motion.div variants={itemVariants} className="auth-header">
          <h2 className="title">
            <img src={logo} className="logo" alt="logo" />
            Login
          </h2>
          <p className="subtitle">Entre na sua conta</p>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants} className="alert-error">
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          {/* USERNAME */}
          <motion.div variants={itemVariants} className="form-group">
            <label className="form-label">Usuário</label>
            <div className="input-icon">
              <FaRegUser className="left-icon" />
              <input
                type="text"
                name="username"
                placeholder="Digite seu usuário"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
            </div>
          </motion.div>

          {/* PASSWORD */}
          <motion.div variants={itemVariants} className="form-group">
            <label className="form-label">Senha</label>
            <div className="input-icon">
              <RiLockPasswordLine className="left-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Digite sua senha"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
              <button
                type="button"
                className="right-icon-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <IoEyeOff /> : <IoEye />}
              </button>
            </div>
          </motion.div>

          {/* BUTTON */}
          <motion.button
            variants={itemVariants}
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </motion.button>
        </form>

        {/* DEMO ACCOUNTS */}
        <motion.div variants={itemVariants} className="demo-wrapper">
          <div className="demo-title-wrapper">
            <span className="demo-divider"></span>
            <span className="demo-title">Contas de demonstração</span>
            <span className="demo-divider"></span>
          </div>

          <div className="demo-grid">
            {demoAccounts.map((acc, i) => (
              <button key={i} className="btn-demo" onClick={() => fillDemo(acc)}>
                {acc.type}
              </button>
            ))}
          </div>
        </motion.div>

        {/* SWITCH */}
        <motion.div variants={itemVariants} className="switch-wrapper">
          <span className="switch-text">Não tem uma conta?</span>
          <button className="switch-btn" onClick={onSwitchToRegister}>
            Registre-se
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
