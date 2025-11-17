import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MovieForm from './MovieForm';
import { apiService } from '../../services/api';

const MovieEdit = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleUpdate = async (movieData, relations) => {
    try {
      // Atualizar dados do filme
      await apiService.updateEntity('filme', id, movieData);
      
      // Atualizar relacionamentos
      if (relations) {
        await apiService.updateMovieRelations(id, relations);
      }
      
      navigate(`/filme/${id}`);
    } catch (err) {
      throw new Error('Erro ao atualizar filme: ' + err.message);
    }
  };

  const handleCancel = () => {
    navigate(`/filme/${id}`);
  };

  return (
    <div className="container p-4 flex flex-col gap-4">
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="btn btn-outline mb-4"
        >
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold">Editar Filme</h1>
      </div>

      <MovieForm
        movieId={id}
        onSubmit={handleUpdate}
        onClose={handleCancel}
      />
    </div>
  );
};

export default MovieEdit;