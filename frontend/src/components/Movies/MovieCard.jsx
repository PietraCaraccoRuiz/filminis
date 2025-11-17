import React from 'react';
import { useNavigate } from 'react-router-dom';

const MovieCard = ({ movie, user, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    const [h, m] = duration.split(':');
    return `${h}h ${m}m`;
  };

  const handleCardClick = () => {
    navigate(`/filme/${movie.id_filme}`);
  };

  return (
    <div 
      className="movie-card cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Poster */}
      <div className="poster-wrapper">
        <img
          src={movie.poster_url}
          alt={movie.titulo}
          className="poster-img"
        />
      </div>

      {/* Conteúdo */}
      <div className="card-body">

        {/* Título */}
        <h3 className="movie-title" onClick={handleCardClick}>
          {movie.titulo}
        </h3>

        {/* Informações */}
        <div className="info-wrapper">
          <div className="info-line">
            <span className="info-label">Ano:</span>
            <span className="info-value">{movie.ano || 'N/A'}</span>
          </div>

          <div className="info-line">
            <span className="info-label">Duração:</span>
            <span className="info-value">{formatDuration(movie.tempo_duracao)}</span>
          </div>

          <div className="info-line">
            <span className="info-label">Orçamento:</span>
            <span className="info-value">
              {movie.orcamento ? formatCurrency(movie.orcamento) : 'N/A'}
            </span>
          </div>
        </div>

        {/* Botões */}
        <div className="action-wrapper">
          <button className="btn-outline flex-1" onClick={handleCardClick}>
            Ver Detalhes
          </button>

          {user.tipo === 'admin' && (
            <>
              <button
                className="btn-outline flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(movie);
                }}
              >
                Editar
              </button>

              <button
                className="btn-danger flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(movie.id_filme);
                }}
              >
                Excluir
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default MovieCard;
