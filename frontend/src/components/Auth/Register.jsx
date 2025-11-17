import React, { useState } from "react";
import { motion } from "framer-motion";
import logo from "../../assets/logo.svg";

const Register = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Simulando apiService.register e apiService.login
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = {
        user: { username: formData.username, email: formData.email },
      };

      if (result && result.user) {
        onRegister(result.user);
        setSuccess("Conta criada e login realizado com sucesso!");
      } else {
        setSuccess("Conta criada com sucesso! Faça login para continuar.");
        setTimeout(() => {
          onSwitchToLogin();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  // Variantes de animação
  const containerVariants = {
    hidden: { opacity: 0, y: 50, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(5px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container-auth card w-full max-w-md"
      >
        <motion.div variants={itemVariants} className="card-header text-center">
          <h2 className="text-2xl flex items-center justify-center gap-2">
            <img src={logo} alt="logo" className="logo" />
            Registrar
          </h2>
          <p className="text-muted">Crie sua conta</p>
        </motion.div>

        <div className="card-body">
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="alert alert-error"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="alert alert-success"
            >
              {success}
            </motion.div>
          )}

          <div>
            <motion.div variants={itemVariants} className="form-group">
              <label htmlFor="username" className="form-label">
                Usuário *
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className="form-input"
                required
                minLength="3"
                placeholder="Escolha um nome de usuário"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="form-group">
              <label htmlFor="email" className="form-label">
                Email *
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className="form-input"
                required
                placeholder="seu@email.com"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="form-group">
              <label htmlFor="password" className="form-label">
                Senha *
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className="form-input"
                required
                minLength="6"
                placeholder="Mínimo 6 caracteres"
              />
            </motion.div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </motion.button>
          </div>

          <motion.div variants={itemVariants} className="text-center mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onSwitchToLogin}
              className="btn btn-secondary"
            >
              Já tem uma conta? Faça login
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
