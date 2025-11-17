import React, { useState } from "react";
import { motion } from "framer-motion";
import logo from "../../assets/logo.svg";
import { apiService } from "../../services/api";

import { FaRegUser } from "react-icons/fa6";
import { MdAlternateEmail } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";
import { IoEye, IoEyeOff } from "react-icons/io5";

const Register = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiService.register(
        formData.username,
        formData.email,
        formData.password
      );

      setSuccess("Conta criada com sucesso! Faça login.");
    } catch (err) {
      setError(err.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

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
            Registrar
          </h2>
          <p className="subtitle">Crie sua conta</p>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants} className="alert-error">
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div variants={itemVariants} className="alert-success">
            {success}
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          {/* USERNAME */}
          <motion.div variants={itemVariants} className="form-group">
            <label className="form-label">Usuário *</label>
            <div className="input-icon">
              <FaRegUser className="left-icon" />
              <input
                type="text"
                name="username"
                placeholder="Escolha um nome de usuário"
                minLength={3}
                required
                value={formData.username}
                onChange={handleChange}
              />
            </div>
          </motion.div>

          {/* EMAIL */}
          <motion.div variants={itemVariants} className="form-group">
            <label className="form-label">Email *</label>
            <div className="input-icon">
              <MdAlternateEmail className="left-icon" />
              <input
                type="email"
                name="email"
                placeholder="seu@email.com"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </motion.div>

          {/* PASSWORD */}
          <motion.div variants={itemVariants} className="form-group">
            <label className="form-label">Senha *</label>
            <div className="input-icon">
              <RiLockPasswordLine className="left-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
                value={formData.password}
                onChange={handleChange}
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

          <motion.button
            variants={itemVariants}
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </motion.button>
        </form>

        {/* SWITCH */}
        <motion.div variants={itemVariants} className="switch-wrapper">
          <span className="switch-text">Já tem uma conta?</span>
          <button className="switch-btn" onClick={onSwitchToLogin}>
            Fazer login
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;
