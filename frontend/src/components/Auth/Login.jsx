import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { apiService } from '../../services/api';
import logo from '../../assets/logo.svg';

const Login = ({ onLogin, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await apiService.login(formData.username, formData.password);
      onLogin(result.user);
    } catch (err) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const demoAccounts = [
    { username: 'admin', password: 'admin123', type: 'Admin' },
    { username: 'usuario1', password: 'user123', type: 'User' }
  ];

  const fillDemo = (account) => {
    setFormData({
      username: account.username,
      password: account.password
    });
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
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(5px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.4 }
    }
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
            <img src={logo} alt="logo" className='logo' />
            Login</h2>
          <p className="text-muted">Entre na sua conta</p>
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

          <form onSubmit={handleSubmit}>
            <motion.div variants={itemVariants} className="form-group">
              <label htmlFor="username" className="form-label">
                Usuário
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                required
              />
            </motion.div>

            <motion.div variants={itemVariants} className="form-group">
              <label htmlFor="password" className="form-label">
                Senha
              </label>
              <motion.input
                whileFocus={{ scale: 1.01 }}
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required
              />
            </motion.div>

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </motion.button>
          </form>

          <motion.div variants={itemVariants} className="mt-4">
            <h4 className="text-sm text-muted mb-2">Contas de Demonstração:</h4>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => fillDemo(account)}
                  className="btn btn-outline btn-sm"
                >
                  {account.type}
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onSwitchToRegister}
              className="btn btn-secondary"
            >
              Não tem uma conta? Registre-se
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;