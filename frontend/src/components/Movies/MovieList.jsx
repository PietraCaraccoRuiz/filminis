import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import MovieCard from "./MovieCard";
import MovieForm from "./MovieForm";
import { motion } from "framer-motion";

// 🔥 Mesmo motion usado no GenreList
const fadeCard = {
  hidden: { opacity: 0, filter: "blur(6px)", scale: 0.97 },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: { duration: 0.45, ease: "easeOut" }
  }
};

const MovieList = ({ user }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const data = await apiService.getEntities("filme");
      setMovies(data);
    } catch (err) {
      setError("Erro ao carregar filmes: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (movieData, relations) => {
    try {
      const result = await apiService.createEntity("filme", movieData);
      const newMovieId = result.id;

      if (relations) {
        await apiService.updateMovieRelations(newMovieId, relations);
      }

      setShowForm(false);
      loadMovies();
    } catch (err) {
      throw new Error("Erro ao criar filme: " + err.message);
    }
  };

  const handleUpdate = async (id, movieData, relations) => {
    try {
      await apiService.updateEntity("filme", id, movieData);

      if (relations) {
        await apiService.updateMovieRelations(id, relations);
      }

      setEditingMovie(null);
      loadMovies();
    } catch (err) {
      throw new Error("Erro ao atualizar filme: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este filme?")) return;

    try {
      await apiService.deleteEntity("filme", id);
      loadMovies();
    } catch (err) {
      setError("Erro ao excluir filme: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <motion.div
          className="text-lg"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          Carregando filmes...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl">Catálogo de Filmes</h1>
          <p className="text-muted">
            {movies.length} filme{movies.length !== 1 ? "s" : ""} encontrado
          </p>
        </div>

        {user.tipo === "admin" && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            Adicionar Filme
          </button>
        )}
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      {showForm && (
        <MovieForm
          movie={editingMovie}
          onSubmit={
            editingMovie
              ? (data) => handleUpdate(editingMovie.id_filme, data)
              : handleCreate
          }
          onClose={() => {
            setShowForm(false);
            setEditingMovie(null);
          }}
        />
      )}

      {movies.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, filter: "blur(6px)", scale: 0.97 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          transition={{ duration: 0.45 }}
          className="card text-center p-8"
        >
          <h3 className="text-lg mb-2">Nenhum filme encontrado</h3>

          {user.tipo === "admin" && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              Adicionar Primeiro Filme
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
        >
          {movies.map((movie) => (
            <motion.div key={movie.id_filme} variants={fadeCard}>
              <MovieCard
                movie={movie}
                user={user}
                onEdit={() => {
                  setEditingMovie(movie);
                  setShowForm(true);
                }}
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default MovieList;
