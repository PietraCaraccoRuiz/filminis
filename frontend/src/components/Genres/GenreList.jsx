import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import GenreForm from './GenreForm';
import { motion } from "framer-motion";

// ⚡ Fade suave + Blur (efeito limpo e moderno, sem movimentar x)
const fadeCard = {
  hidden: { opacity: 0, filter: "blur(6px)", scale: 0.97 },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: { duration: 0.45, ease: "easeOut" }
  }
};

const GenreList = ({ user }) => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGenre, setEditingGenre] = useState(null);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      setLoading(true);
      const data = await apiService.getEntities('genero');
      setGenres(data);
    } catch (err) {
      setError('Erro ao carregar gêneros: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (genreData) => {
    try {
      await apiService.createEntity('genero', genreData);
      setShowForm(false);
      loadGenres();
    } catch (err) {
      throw new Error('Erro ao criar gênero: ' + err.message);
    }
  };

  const handleUpdate = async (id, genreData) => {
    try {
      await apiService.updateEntity('genero', id, genreData);
      setEditingGenre(null);
      loadGenres();
    } catch (err) {
      throw new Error('Erro ao atualizar gênero: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este gênero?')) return;

    try {
      await apiService.deleteEntity('genero', id);
      loadGenres();
    } catch (err) {
      setError('Erro ao excluir gênero: ' + err.message);
    }
  };

  const handleEdit = (genre) => {
    setEditingGenre(genre);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingGenre(null);
  };

  if (loading) {
    return (
      <div className="container p-8 flex justify-center items-center">
        <div className="text-lg">Carregando gêneros...</div>
      </div>
    );
  }

  return (
    <div className="container p-4 flex flex-col gap-4">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl">Gêneros</h1>
          <p className="text-muted">
            {genres.length} gênero{genres.length !== 1 ? 's' : ''} encontrado{genres.length !== 1 ? 's' : ''}
          </p>
        </div>

        {user.tipo === 'admin' && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            Adicionar Gênero
          </button>
        )}
      </div>

      {/* ALERT */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* FORM */}
      {showForm && (
        <GenreForm
          genre={editingGenre}
          onSubmit={
            editingGenre
              ? (data) => handleUpdate(editingGenre.id_genero, data)
              : handleCreate
          }
          onClose={handleFormClose}
        />
      )}

      {/* SEM REGISTROS */}
      {genres.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, filter: "blur(6px)", scale: 0.97 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="card text-center p-8"
        >
          <h3 className="text-lg mb-2">Nenhum gênero encontrado</h3>
          <p className="text-muted mb-4">
            {user.tipo === 'admin'
              ? 'Comece adicionando seu primeiro gênero!'
              : 'Aguarde até que um administrador adicione gêneros.'}
          </p>

          {user.tipo === 'admin' && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              Adicionar Primeiro Gênero
            </button>
          )}
        </motion.div>
      ) : (

        // LISTA — Fade + blur elegante (stagger suave)
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: 0.09 }
            }
          }}
        >
          {genres.map((genre) => (
            <motion.div
              key={genre.id_genero}
              variants={fadeCard}
              className="card"
            >
              <div className="card-body">
                <h3 className="text-lg font-semibold mb-2">{genre.nome_genero}</h3>

                <div className="text-sm text-muted mb-4">
                  ID: {genre.id_genero}
                </div>

                {user.tipo === 'admin' && (
                  <div className="flex gap-2 pt-4 border-t border-border-color">
                    <button
                      onClick={() => handleEdit(genre)}
                      className="btn btn-outline btn-sm flex-1"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleDelete(genre.id_genero)}
                      className="btn btn-danger btn-sm flex-1"
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

    </div>
  );
};

export default GenreList;
