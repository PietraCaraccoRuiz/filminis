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
    return duration.split(':').slice(0, 2).join(':');
  };

  const handleCardClick = () => {
    navigate(`/filme/${movie.id_filme}`);
  };

  return (
    <div className="card hover:shadow-md transition-shadow cursor-pointer">
      {/* Poster clicável */}
      <div 
        onClick={handleCardClick}
        className="aspect-w-2 aspect-h-3 cursor-pointer"
      >
        <img
          src={movie.poster_url}
          alt={movie.titulo}
          className="w-full h-48 object-cover rounded-t-lg"
        />
      </div>
      
      <div className="card-body">
        {/* Título clicável */}
        <h3 
          onClick={handleCardClick}
          className="text-lg font-semibold mb-2 line-clamp-2 cursor-pointer hover:text-primary-color transition-colors"
        >
          {movie.titulo}
        </h3>
        
        <div className="space-y-2 text-sm text-muted">
          <div className="flex justify-between">
            <span>Ano:</span>
            <span>{movie.ano || 'N/A'}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Duração:</span>
            <span>{formatDuration(movie.tempo_duracao)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Orçamento:</span>
            <span>{movie.orcamento ? formatCurrency(movie.orcamento) : 'N/A'}</span>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-border-color">
          <button
            onClick={handleCardClick}
            className="btn btn-outline btn-sm flex-1"
          >
            Ver Detalhes
          </button>
          
          {user.tipo === 'admin' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(movie);
                }}
                className="btn btn-outline btn-sm flex-1"
              >
                Editar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(movie.id_filme);
                }}
                className="btn btn-danger btn-sm flex-1"
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