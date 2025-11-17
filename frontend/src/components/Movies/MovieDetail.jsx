import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import MovieRelations from './MovieRelations';
import { motion } from "framer-motion";
import { FiFilm, FiUser, FiGlobe, FiMic, FiBriefcase } from "react-icons/fi";
import { MdCategory } from "react-icons/md";

// 💠 Fade suave + Blur + Scale — padrão do projeto
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
    if (!window.confirm('Tem certeza que deseja excluir este filme?')) return;

    try {
      await apiService.deleteEntity('filme', id);
      navigate('/');
    } catch (err) {
      setError('Erro ao excluir filme: ' + err.message);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(value);

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    const [hours, minutes, seconds] = duration.split(':');
    return `${hours}h ${minutes}m${seconds !== '00' ? ` ${seconds}s` : ''}`;
  };

  const handleRelationsUpdate = () => loadMovie();

  if (loading) {
    return (
      <div className="container p-8 flex justify-center items-center">
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

  if (error || !movie) {
    return (
      <motion.div className="container p-8" variants={fadeCard} initial="hidden" animate="show">
        <div className="alert alert-error">{error || 'Filme não encontrado'}</div>
        <button onClick={() => navigate('/')} className="btn btn-primary mt-4">
          Voltar para a lista
        </button>
      </motion.div>
    );
  }

  // Configuração de ícones por tipo de relação
  const relationIcons = {
    genero: <MdCategory />,
    diretor: <FiUser />,
    dublador: <FiMic />,
    produtora: <FiBriefcase />,
    linguagem: <FiGlobe />,
    pais: <FiGlobe />,
  };

  return (
    <motion.div
      className="container p-4 flex flex-col gap-6"
      variants={fadeCard}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div className="flex items-center justify-between mb-6" variants={fadeItem}>
        <button onClick={() => navigate('/')} className="btn btn-outline">
          ← Voltar
        </button>

        {user.tipo === 'admin' && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowRelations(!showRelations)}
              className="btn btn-outline"
            >
              {showRelations ? 'Ocultar Relações' : 'Gerenciar Relações'}
            </button>
            <button
              onClick={() => navigate(`/filme/editar/${movie.id_filme}`)}
              className="btn btn-outline"
            >
              Editar
            </button>
            <button onClick={handleDelete} className="btn btn-danger">
              Excluir
            </button>
          </div>
        )}
      </motion.div>

      {/* Gerenciar relações */}
      {showRelations && user.tipo === 'admin' ? (
        <motion.div className="flex flex-col gap-4" variants={fadeCard} initial="hidden" animate="show">
          <motion.div variants={fadeItem}>
            <h1 className="text-2xl font-bold mb-2">Gerenciar Relações</h1>
            <p className="text-muted">Gerencie os relacionamentos do filme: {movie.titulo}</p>
          </motion.div>
          <MovieRelations movieId={movie.id_filme} user={user} onUpdate={handleRelationsUpdate} />
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        >
          {/* Poster */}
          <motion.div className="lg:col-span-1" variants={fadeItem}>
            <div className="card shadow-md overflow-hidden rounded-xl">
              <img src={movie.poster_url} alt={movie.titulo} className="w-full h-auto object-cover" />
            </div>
          </motion.div>

          {/* Informações */}
          <motion.div className="lg:col-span-2" variants={fadeItem}>
            <div className="card p-6 shadow-md rounded-xl bg-gradient-to-r from-purple-700 via-pink-600 to-pink-400 text-white">
              <motion.h1 className="text-3xl font-bold mb-4" variants={fadeItem}>
                {movie.titulo}
              </motion.h1>

              <motion.div className="flex flex-wrap items-center gap-4 mb-6" variants={fadeItem}>
                {movie.ano && (
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
                    {movie.ano}
                  </span>
                )}
                {movie.tempo_duracao && (
                  <span className="text-white/70">{formatDuration(movie.tempo_duracao)}</span>
                )}
              </motion.div>

              {/* Info detalhadas */}
              <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
                <motion.div className="space-y-4" variants={fadeItem}>
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 mb-1">Orçamento</h3>
                    <p className="text-lg">{movie.orcamento ? formatCurrency(movie.orcamento) : 'Não informado'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 mb-1">Duração</h3>
                    <p className="text-lg">{movie.tempo_duracao ? formatDuration(movie.tempo_duracao) : 'Não informada'}</p>
                  </div>
                </motion.div>

                <motion.div className="space-y-4" variants={fadeItem}>
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 mb-1">ID do Filme</h3>
                    <p className="text-lg font-mono">{movie.id_filme}</p>
                  </div>
                  {movie.poster_url && (
                    <div>
                      <h3 className="text-sm font-semibold text-white/70 mb-1">Poster</h3>
                      <a
                        href={movie.poster_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/90 hover:text-white font-medium text-sm transition"
                      >
                        Ver imagem original
                      </a>
                    </div>
                  )}
                </motion.div>
              </motion.div>

              {/* Relações resumidas */}
              <motion.div className="border-t border-white/30 pt-6" variants={fadeItem}>
                <h3 className="text-lg font-semibold mb-4">Informações Relacionadas</h3>

                <motion.div className="grid grid-cols-2 md:grid-cols-3 gap-4" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}>
                  {Object.entries(relations).map(([type, items]) => {
                    if (!items || items.length === 0) return null;

                    const icon = relationIcons[type] || <FiFilm />;
                    const label = type.charAt(0).toUpperCase() + type.slice(1);

                    return (
                      <motion.div key={type} className="bg-white/10 rounded-xl p-4 flex flex-col gap-2 shadow-sm hover:bg-white/20 transition" variants={fadeItem}>
                        <div className="flex items-center gap-2 text-white/90 font-semibold">
                          {icon}
                          <span>{label}</span>
                        </div>
                        <div className="text-white/60 text-sm">{items.length} {items.length === 1 ? "item" : "itens"}</div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MovieDetail;
