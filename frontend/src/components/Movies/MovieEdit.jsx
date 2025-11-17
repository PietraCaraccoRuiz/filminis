import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MovieForm from './MovieForm';
import { apiService } from '../../services/api';

const MovieEdit = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleUpdate = async (movieData, relations) => {
    try {
      await apiService.updateEntity('filme', id, movieData);

      if (relations) {
        await apiService.updateMovieRelations(id, relations);
      }

      navigate(`/filme/${id}`);
    } catch (err) {
      throw new Error('Erro ao atualizar filme: ' + err.message);
    }
  };

  const handleCancel = () => navigate(`/filme/${id}`);

  return (
    <div className="page-wrapper">
      <div className="edit-container">

        {/* Header */}
        <div className="edit-header">
          <button onClick={handleCancel} className="btn-outline">
            ← Voltar
          </button>

          <h1 className="edit-title">Editar Filme</h1>
        </div>

        {/* Modal/Form */}
        <MovieForm
          movieId={id}
          onSubmit={handleUpdate}
          onClose={handleCancel}
        />
      </div>
    </div>
  );
};

export default MovieEdit;
