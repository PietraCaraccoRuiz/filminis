import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import MovieCard from "./MovieCard";
import MovieForm from "./MovieForm";
import { motion } from "framer-motion";

// animação padrão dos cards
const fadeCard = {
  hidden: { opacity: 0, filter: "blur(6px)", scale: 0.97 },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const MovieList = ({ user }) => {
  const [movies, setMovies] = useState([]);      // lista vinda da API
  const [filtered, setFiltered] = useState([]);  // lista após filtros
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);

  // filtros ativos
  const [filters, setFilters] = useState({
    search: "",
    genero: "",
    diretor: "",
    pais: "",
    produtora: "",
    linguagem: "",
    ano: "",
  });

  // opções dos selects
  const [generos, setGeneros] = useState([]);
  const [diretores, setDiretores] = useState([]);
  const [paises, setPaises] = useState([]);
  const [produtoras, setProdutoras] = useState([]);
  const [linguagens, setLinguagens] = useState([]);

  // carrega filmes + opções de filtro no mount
  useEffect(() => {
    loadMovies();
    loadFilterOptions();
  }, []);

  // -------------------------------------------------
  // Carrega filmes (GET /filme) – já vem com relações
  // -------------------------------------------------
  const loadMovies = async () => {
    try {
      setLoading(true);
      const data = await apiService.getEntities("filme");

      if (Array.isArray(data)) {
        setMovies(data);
        setFiltered(data);
      } else {
        console.warn("GET /filme não retornou array:", data);
        setMovies([]);
        setFiltered([]);
      }
    } catch (err) {
      setError("Erro ao carregar filmes: " + err.message);
      setMovies([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------
  // Carrega opções para os selects (genero, diretor...)
  // -------------------------------------------------
  const loadFilterOptions = async () => {
    try {
      const [g, d, p, pr, l] = await Promise.all([
        apiService.getEntities("genero"),
        apiService.getEntities("diretor"),
        apiService.getEntities("pais"),
        apiService.getEntities("produtora"),
        apiService.getEntities("linguagem"),
      ]);

      setGeneros(Array.isArray(g) ? g : []);
      setDiretores(Array.isArray(d) ? d : []);
      setPaises(Array.isArray(p) ? p : []);
      setProdutoras(Array.isArray(pr) ? pr : []);
      setLinguagens(Array.isArray(l) ? l : []);
    } catch (e) {
      console.warn("Erro ao carregar opções de filtro:", e);
    }
  };

  // -------------------------------------------------
  // Aplica filtros sempre que 'filters' ou 'movies' mudar
  // -------------------------------------------------
  useEffect(() => {
    let list = Array.isArray(movies) ? [...movies] : [];

    // filtro por título
    if (filters.search.trim() !== "") {
      const s = filters.search.toLowerCase();
      list = list.filter(
        (m) => m.titulo && m.titulo.toLowerCase().includes(s)
      );
    }

    // filtro por ano
    if (filters.ano !== "") {
      list = list.filter((m) => String(m.ano) === String(filters.ano));
    }

    // filtro por gênero (usa array 'generos' vindo do backend)
    if (filters.genero !== "") {
      list = list.filter((m) =>
        m.generos?.some(
          (g) => String(g.id_genero) === String(filters.genero)
        )
      );
    }

    // filtro por diretor
    if (filters.diretor !== "") {
      list = list.filter((m) =>
        m.diretores?.some(
          (d) => String(d.id_diretor) === String(filters.diretor)
        )
      );
    }

    // filtro por país
    if (filters.pais !== "") {
      list = list.filter((m) =>
        m.paises?.some((p) => String(p.id_pais) === String(filters.pais))
      );
    }

    // filtro por produtora
    if (filters.produtora !== "") {
      list = list.filter((m) =>
        m.produtoras?.some(
          (p) => String(p.id_produtora) === String(filters.produtora)
        )
      );
    }

    // filtro por idioma
    if (filters.linguagem !== "") {
      list = list.filter((m) =>
        m.linguagens?.some(
          (l) => String(l.id_linguagem) === String(filters.linguagem)
        )
      );
    }

    setFiltered(list);
  }, [filters, movies]);

  // -------------------------------------------------
  // Handlers de filtro
  // -------------------------------------------------
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      genero: "",
      diretor: "",
      pais: "",
      produtora: "",
      linguagem: "",
      ano: "",
    });
  };

  // -------------------------------------------------
  // Delete de filme
  // -------------------------------------------------
  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este filme?")) return;

    try {
      await apiService.deleteEntity("filme", id);
      await loadMovies();
    } catch (err) {
      setError("Erro ao excluir filme: " + err.message);
    }
  };

  // -------------------------------------------------
  // Loading
  // -------------------------------------------------
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

  // -------------------------------------------------
  // Render
  // -------------------------------------------------
  return (
    <div className="container p-4 flex flex-col gap-4">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl">Catálogo de Filmes</h1>
          <p className="text-muted">
            {filtered.length} filme{filtered.length !== 1 ? "s" : ""} encontrado
          </p>
        </div>

        {user?.tipo === "admin" && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingMovie(null);
              setShowForm(true);
            }}
          >
            Adicionar Filme
          </button>
        )}
      </div>

      {/* Painel de Filtros */}
      <div className="card p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Título */}
        <input
          type="text"
          placeholder="Buscar por título..."
          className="form-input"
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
        />

        {/* Ano */}
        <input
          type="number"
          placeholder="Ano"
          className="form-input"
          value={filters.ano}
          onChange={(e) => handleFilterChange("ano", e.target.value)}
        />

        {/* Gênero */}
        <select
          className="form-input"
          value={filters.genero}
          onChange={(e) => handleFilterChange("genero", e.target.value)}
        >
          <option value="">Todos os gêneros</option>
          {generos.map((g) => (
            <option key={g.id_genero} value={g.id_genero}>
              {g.nome_genero}
            </option>
          ))}
        </select>

        {/* Diretor */}
        <select
          className="form-input"
          value={filters.diretor}
          onChange={(e) => handleFilterChange("diretor", e.target.value)}
        >
          <option value="">Todos os diretores</option>
          {diretores.map((d) => (
            <option key={d.id_diretor} value={d.id_diretor}>
              {d.nome} {d.sobrenome}
            </option>
          ))}
        </select>

        {/* País */}
        <select
          className="form-input"
          value={filters.pais}
          onChange={(e) => handleFilterChange("pais", e.target.value)}
        >
          <option value="">Todos os países</option>
          {paises.map((p) => (
            <option key={p.id_pais} value={p.id_pais}>
              {p.nome_pais}
            </option>
          ))}
        </select>

        {/* Produtora */}
        <select
          className="form-input"
          value={filters.produtora}
          onChange={(e) => handleFilterChange("produtora", e.target.value)}
        >
          <option value="">Todas as produtoras</option>
          {produtoras.map((pr) => (
            <option key={pr.id_produtora} value={pr.id_produtora}>
              {pr.nome_produtora}
            </option>
          ))}
        </select>

        {/* Idioma */}
        <select
          className="form-input"
          value={filters.linguagem}
          onChange={(e) => handleFilterChange("linguagem", e.target.value)}
        >
          <option value="">Todos os idiomas</option>
          {linguagens.map((l) => (
            <option key={l.id_linguagem} value={l.id_linguagem}>
              {l.nome_linguagem}
            </option>
          ))}
        </select>

        <button className="btn btn-secondary" onClick={resetFilters}>
          Limpar filtros
        </button>
      </div>

      {/* Form de criação/edição */}
      {showForm && (
        <MovieForm
          movie={editingMovie}
          movieId={editingMovie?.id_filme}
          onClose={() => {
            setShowForm(false);
            setEditingMovie(null);
            loadMovies();
          }}
        />
      )}

      {/* Lista de filmes */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center">
          <h3 className="text-lg">Nenhum filme encontrado</h3>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.09 } },
          }}
        >
          {filtered.map((movie) => (
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
