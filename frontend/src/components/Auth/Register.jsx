import React, { useState } from "react";
import { motion } from "framer-motion";
import { apiService } from "../../services/api";
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
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const reg = await apiService.register(
        formData.username,
        formData.email,
        formData.password
      );

      if (!reg?.id) throw new Error("Falha no registro");

      const login = await apiService.login(
        formData.username,
        formData.password
      );

      if (!login?.user) {
        throw new Error("Conta criada, mas erro ao logar.");
      }

      setSuccess("Conta criada com sucesso!");
      onRegister(login); // manda o pacote inteiro
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSubmit(e);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6, staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="alert alert-error"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="alert alert-success"
            >
              {success}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <motion.div variants={itemVariants} className="form-group">
              <label className="form-label">Usuário *</label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className="form-input"
                minLength="3"
                required
              />
            </motion.div>

            <motion.div variants={itemVariants} className="form-group">
              <label className="form-label">Email *</label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className="form-input"
                required
              />
            </motion.div>

            <motion.div variants={itemVariants} className="form-group">
              <label className="form-label">Senha *</label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className="form-input"
                minLength="6"
                required
              />
            </motion.div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? "Criando..." : "Criar conta"}
            </motion.button>
          </form>

          <motion.div variants={itemVariants} className="text-center mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSwitchToLogin}
              className="btn btn-secondary"
            >
              Já tem uma conta? Fazer login
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
