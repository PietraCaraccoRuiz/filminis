import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import MovieRelations from './MovieRelations';
import { motion } from "framer-motion";

import { FiFilm, FiUser, FiGlobe, FiMic, FiBriefcase } from "react-icons/fi";
import { MdCategory } from "react-icons/md";

// Animations padrão
const fadeCard = {
  hidden: { opacity: 0, filter: "blur(6px)", scale: 0.97 },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: { duration: 0.45, ease: "easeOut" }
  }
};

const fadeItem = {
  hidden: { opacity: 0, filter: "blur(4px)", y: 10 },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" }
  }
};

const MovieDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [relations, setRelations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRelations, setShowRelations] = useState(false);

  useEffect(() => {
    loadMovie();
  }, [id]);

  const loadMovie = async () => {
    try {
      setLoading(true);

      const [movieData, relationsData] = await Promise.all([
        apiService.getEntity('filme', id),
        apiService.getMovieRelations(id)
      ]);

      setMovie(movieData);
      setRelations(relationsData);

    } catch (err) {
      setError('Erro ao carregar filme: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir este filme?")) return;

    try {
      await apiService.deleteEntity('filme', id);
      navigate('/');
    } catch (err) {
      setError('Erro ao excluir filme: ' + err.message);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    const [h, m, s] = duration.split(':');
    return `${h}h ${m}m${s !== '00' ? ` ${s}s` : ''}`;
  };

  const handleRelationsUpdate = () => loadMovie();

  // LOADING STATE
  if (loading) {
    return (
      <div className="page-wrapper">
        <motion.div
          initial={{ opacity: 0, filter: "blur(6px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.45 }}
        >
          Carregando filme...
        </motion.div>
      </div>
    );
  }

  // ERRO
  if (error || !movie) {
    return (
      <motion.div
        className="page-wrapper"
        variants={fadeCard}
        initial="hidden"
        animate="show"
      >
        <div className="auth-card">
          <div className="alert-error">{error || "Filme não encontrado"}</div>
          <button className="btn-primary mt-4" onClick={() => navigate('/')}>
            Voltar
          </button>
        </div>
      </motion.div>
    );
  }

  const relationIcons = {
    genero: <MdCategory />,
    diretor: <FiUser />,
    dublador: <FiMic />,
    produtora: <FiBriefcase />,
    linguagem: <FiGlobe />,
    pais: <FiGlobe />
  };

  return (
    <motion.div
      className="page-wrapper"
      variants={fadeCard}
      initial="hidden"
      animate="show"
    >
      <div className="movie-detail-container">

        {/* HEADER */}
        <motion.div className="detail-header" variants={fadeItem}>
          <button className="btn-outline" onClick={() => navigate('/')}>
            ← Voltar
          </button>

          {user.tipo === "admin" && (
            <div className="detail-header-actions">
              <button
                className="btn-outline"
                onClick={() => setShowRelations(!showRelations)}
              >
                {showRelations ? "Ocultar Relações" : "Gerenciar Relações"}
              </button>

              <button
                className="btn-outline"
                onClick={() => navigate(`/filme/editar/${movie.id_filme}`)}
              >
                Editar
              </button>

              <button className="btn-danger" onClick={handleDelete}>
                Excluir
              </button>
            </div>
          )}
        </motion.div>

        {/* SEÇÃO DE RELAÇÕES */}
        {showRelations && user.tipo === "admin" && (
          <motion.div
            variants={fadeCard}
            initial="hidden"
            animate="show"
            className="relation-panel"
          >
            <motion.h1 variants={fadeItem} className="detail-title">
              Gerenciar Relações
            </motion.h1>

            <p className="text-muted">
              Gerencie os relacionamentos do filme: {movie.titulo}
            </p>

            <MovieRelations
              movieId={movie.id_filme}
              user={user}
              onUpdate={handleRelationsUpdate}
            />
          </motion.div>
        )}

        {/* VISUALIZAÇÃO PADRÃO */}
        {!showRelations && (
          <motion.div
            className="detail-grid"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          >
            {/* POSTER */}
            <motion.div className="detail-poster" variants={fadeItem}>
              <div className="card poster-card">
                <img
                  src={movie.poster_url}
                  alt={movie.titulo}
                  className="poster-img"
                />
              </div>
            </motion.div>

            {/* INFO */}
            <motion.div className="detail-info" variants={fadeItem}>
              <div className="card movie-info-card">

                <motion.h1 className="movie-title" variants={fadeItem}>
                  {movie.titulo}
                </motion.h1>

                <motion.div className="movie-tags" variants={fadeItem}>
                  {movie.ano && (
                    <span className="tag">{movie.ano}</span>
                  )}

                  {movie.tempo_duracao && (
                    <span className="tag-secondary">
                      {formatDuration(movie.tempo_duracao)}
                    </span>
                  )}
                </motion.div>

                {/* INFO DETALHADA */}
                <motion.div className="info-grid" variants={fadeCard}>
                  <motion.div className="info-column" variants={fadeItem}>
                    <h3 className="info-label">Orçamento</h3>
                    <p className="info-value">
                      {movie.orcamento ? formatCurrency(movie.orcamento) : "Não informado"}
                    </p>
                  </motion.div>

                  <motion.div className="info-column" variants={fadeItem}>
                    <h3 className="info-label">Duração</h3>
                    <p className="info-value">
                      {movie.tempo_duracao ? formatDuration(movie.tempo_duracao) : "Não informada"}
                    </p>
                  </motion.div>

                  <motion.div className="info-column" variants={fadeItem}>
                    <h3 className="info-label">ID do Filme</h3>
                    <p className="info-value">{movie.id_filme}</p>
                  </motion.div>

                  {movie.poster_url && (
                    <motion.div className="info-column" variants={fadeItem}>
                      <h3 className="info-label">Poster</h3>
                      <a
                        href={movie.poster_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="info-link"
                      >
                        Ver imagem original
                      </a>
                    </motion.div>
                  )}
                </motion.div>

                {/* BLOCO DE RELAÇÕES */}
                <motion.div variants={fadeItem} className="relations-list">
                  <h3 className="relations-title">Informações Relacionadas</h3>

                  <motion.div
                    className="relations-grid"
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
                  >
                    {Object.entries(relations).map(([type, items]) => {
                      if (!items || items.length === 0) return null;

                      const icon = relationIcons[type] || <FiFilm />;
                      const label = type.charAt(0).toUpperCase() + type.slice(1);

                      return (
                        <motion.div key={type} className="relation-card" variants={fadeItem}>
                          <div className="relation-header">
                            {icon}
                            <span>{label}</span>
                          </div>
                          <div className="relation-count">
                            {items.length} {items.length === 1 ? "item" : "itens"}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </motion.div>

              </div>
            </motion.div>
          </motion.div>
        )}

      </div>
    </motion.div>
  );
};

export default MovieDetail;
