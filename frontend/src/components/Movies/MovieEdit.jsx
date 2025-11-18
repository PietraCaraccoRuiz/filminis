import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MovieForm from './MovieForm';
import { apiService } from '../../services/api';

const MovieEdit = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const goBack = () => navigate(`/filme/${id}`);

  const handleUpdate = async (movieData, relations) => {
    try {
      // Update core entity
      await apiService.updateEntity('filme', id, movieData);

      // Update relations if provided
      if (relations) {
        await apiService.updateMovieRelations(id, relations);
      }

      goBack();
    } catch (err) {
      throw new Error(`Erro ao atualizar filme: ${err.message}`);
    }
  };

  return (
    <div className="container p-4 flex flex-col gap-4">

      <div className="mb-6 flex flex-col gap-3">
        <button onClick={goBack} className="btn btn-outline w-fit">
          ← Voltar
        </button>

        <h1 className="text-2xl font-bold">Editar Filme</h1>
      </div>

      <MovieForm
        movieId={id}
        onSubmit={handleUpdate}
        onClose={goBack}
      />
    </div>
  );
};

export default MovieEdit;
