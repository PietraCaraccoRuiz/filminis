import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import MovieCard from "./MovieCard";
import MovieForm from "./MovieForm";
import { motion } from "framer-motion";

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
  const [movies, setMovies] = useState([]); // sempre array
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
      setError("");

      const data = await apiService.getEntities("filme");

      // blindagem total: garante lista SEMPRE
      if (!Array.isArray(data)) {
        console.warn("API retornou algo inesperado em /filme:", data);
        setMovies([]);
      } else {
        setMovies(data);
      }

    } catch (err) {
      setError("Erro ao carregar filmes: " + err.message);
      setMovies([]); // nunca deixa null entrar no render
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
      setShowForm(false);
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

  // ===============================
  // LOADING
  // ===============================
  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="loading-card">
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="loading-text"
          >
            Carregando filmes...
          </motion.div>
        </div>
      </div>
    );
  }

  const movieCount = Array.isArray(movies) ? movies.length : 0;

  return (
    <div className="page-wrapper">
      <div className="content-container">

        {/* HEADER */}
        <div className="content-header">
          <div>
            <h1 className="page-title">Catálogo de Filmes</h1>
            <p className="text-muted">
              {movieCount} filme{movieCount !== 1 ? "s" : ""} encontrado
            </p>
          </div>

          {user?.tipo === "admin" && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              Adicionar Filme
            </button>
          )}
        </div>

        {/* ERROR */}
        {error && <div className="alert-error mb-2">{error}</div>}

        {/* FORM MODAL */}
        {showForm && (
          <MovieForm
            movie={editingMovie}
            movieId={editingMovie?.id_filme}
            onSubmit={
              editingMovie
                ? (data, rel) => handleUpdate(editingMovie.id_filme, data, rel)
                : handleCreate
            }
            onClose={() => {
              setShowForm(false);
              setEditingMovie(null);
            }}
          />
        )}

        {/* EMPTY STATE */}
        {movieCount === 0 ? (
          <motion.div
            className="card empty-card"
            initial="hidden"
            animate="show"
            variants={fadeCard}
          >
            <h3 className="empty-title">Nenhum filme cadastrado</h3>

            {user?.tipo === "admin" && (
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                Adicionar Primeiro Filme
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="grid-custom"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          >
            {(movies ?? []).map((movie) => (
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
    </div>
  );
};

export default MovieList;
