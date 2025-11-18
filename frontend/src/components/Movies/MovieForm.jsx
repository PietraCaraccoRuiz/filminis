import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { FiUser, FiMic, FiGlobe, FiBriefcase } from "react-icons/fi";
import { MdCategory } from "react-icons/md";

const MovieForm = ({ movie, movieId, onClose }) => {
  const [formData, setFormData] = useState({
    titulo: "",
    orcamento: "",
    tempo_duracao: "",
    ano: "",
    poster_url: ""
  });

  const [relations, setRelations] = useState({
    genero: [],
    diretor: [],
    dublador: [],
    produtora: [],
    linguagem: [],
    pais: []
  });

  const [availableEntities, setAvailableEntities] = useState({
    genero: [],
    diretor: [],
    dublador: [],
    produtora: [],
    linguagem: [],
    pais: []
  });

  const [loading, setLoading] = useState(false);
  const [loadingMovie, setLoadingMovie] = useState(!!movieId);
  const [error, setError] = useState("");

  // -------------------------------------------------
  // INPUT CHANGE (Faltava isso no seu código!)
  // -------------------------------------------------
  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // -------------------------------------------------
  // LOAD INITIAL DATA
  // -------------------------------------------------
  useEffect(() => {
    if (movieId) loadMovieData();
    loadAvailableEntities();
  }, [movieId]);

  useEffect(() => {
    if (movie) {
      setFormData({
        titulo: movie.titulo || "",
        orcamento: movie.orcamento || "",
        tempo_duracao: movie.tempo_duracao || "",
        ano: movie.ano || "",
        poster_url: movie.poster_url || ""
      });

      if (movie.id_filme) loadMovieRelations(movie.id_filme);
    }
  }, [movie]);

  const loadMovieData = async () => {
    try {
      const data = await apiService.getEntity("filme", movieId);

      setFormData({
        titulo: data.titulo || "",
        orcamento: data.orcamento || "",
        tempo_duracao: data.tempo_duracao || "",
        ano: data.ano || "",
        poster_url: data.poster_url || ""
      });

      await loadMovieRelations(movieId);
    } catch (err) {
      setError("Erro ao carregar filme: " + err.message);
    } finally {
      setLoadingMovie(false);
    }
  };

  const loadMovieRelations = async (id) => {
    try {
      const r = await apiService.getMovieRelations(id);
      setRelations(r);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAvailableEntities = async () => {
    try {
      const [genero, diretor, dublador, produtora, linguagem, pais] =
        await Promise.all([
          apiService.getEntities("genero"),
          apiService.getEntities("diretor"),
          apiService.getEntities("dublador"),
          apiService.getEntities("produtora"),
          apiService.getEntities("linguagem"),
          apiService.getEntities("pais")
        ]);

      setAvailableEntities({
        genero,
        diretor,
        dublador,
        produtora,
        linguagem,
        pais
      });
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------
  // RELATION TOGGLE
  // -------------------------------------------------
  const handleRelationChange = (relationType, entityId, checked) => {
    setRelations((prev) => {
      const current = prev[relationType] || [];

      if (checked) {
        return {
          ...prev,
          [relationType]: [...current, { [`id_${relationType}`]: entityId }]
        };
      }

      return {
        ...prev,
        [relationType]: current.filter(
          (rel) => rel[`id_${relationType}`] !== entityId
        )
      };
    });
  };

  // -------------------------------------------------
  // SUBMIT
  // -------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        orcamento: formData.orcamento ? parseFloat(formData.orcamento) : null,
        ano: formData.ano ? parseInt(formData.ano) : null
      };

      if (!movieId) {
        // CREATE + RELATIONS
        await apiService.createMovieWithRelations(payload, relations);
      } else {
        // UPDATE + RELATIONS
        await apiService.updateMovieWithRelations(movieId, payload, relations);
      }

      onClose();
    } catch (err) {
      setError("Erro ao salvar filme: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------
  // HELPER TO DISPLAY ENTITY NAME
  // -------------------------------------------------
  const getEntityName = (type, id) => {
    const found = availableEntities[type]?.find(
      (e) => e[`id_${type}`] === id
    );
    if (!found) return "N/A";

    switch (type) {
      case "genero": return found.nome_genero;
      case "diretor": return `${found.nome} ${found.sobrenome}`;
      case "dublador": return `${found.nome} ${found.sobrenome}`;
      case "produtora": return found.nome_produtora;
      case "linguagem": return found.nome_linguagem;
      case "pais": return found.nome_pais;
      default: return "N/A";
    }
  };

  const relationConfig = {
    genero: { label: "Gêneros", icon: <MdCategory /> },
    diretor: { label: "Diretores", icon: <FiUser /> },
    dublador: { label: "Dubladores", icon: <FiMic /> },
    produtora: { label: "Produtoras", icon: <FiBriefcase /> },
    linguagem: { label: "Idiomas", icon: <FiGlobe /> },
    pais: { label: "Países", icon: <FiGlobe /> }
  };

  const currentYear = new Date().getFullYear();

  // -------------------------------------------------
  // UI
  // -------------------------------------------------

  if (loadingMovie) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="card p-6">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="card w-full max-h-[90vh] overflow-y-auto">

        <div className="card-header flex justify-between items-center">
          <h2 className="text-xl">
            {movieId ? "Editar Filme" : "Adicionar Filme"}
          </h2>
          <button className="btn btn-outline btn-sm" onClick={onClose}>×</button>
        </div>

        <div className="card-body">
          {error && <div className="alert alert-error mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>

            {/* CAMPOS PRINCIPAIS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

              <div className="form-group">
                <label>Título *</label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Ano</label>
                <input
                  type="number"
                  name="ano"
                  value={formData.ano}
                  onChange={handleChange}
                  min="1900"
                  max={currentYear}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Orçamento</label>
                <input
                  type="number"
                  name="orcamento"
                  value={formData.orcamento}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Duração (HH:MM:SS)</label>
                <input
                  type="text"
                  name="tempo_duracao"
                  value={formData.tempo_duracao}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group md:col-span-2">
                <label>Poster URL</label>
                <input
                  type="url"
                  name="poster_url"
                  value={formData.poster_url}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>

            {/* RELACIONAMENTOS */}
            <div className="border-t pt-6">
              <h3 className="text-lg mb-4 font-semibold">Relacionamentos</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(relationConfig).map(([type, cfg]) => (
                  <div key={type}>
                    <label className="form-label flex items-center gap-2">
                      {cfg.icon} {cfg.label}
                    </label>

                    <div className="max-h-32 overflow-y-auto border p-2 rounded-md">
                      {availableEntities[type].map((entity) => {
                        const id = entity[`id_${type}`];
                        const checked = relations[type]?.some(
                          (r) => r[`id_${type}`] === id
                        );

                        return (
                          <label key={id} className="flex items-center gap-2 py-1">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                handleRelationChange(type, id, e.target.checked)
                              }
                            />
                            <span>{getEntityName(type, id)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Salvando..." : movieId ? "Atualizar" : "Criar"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default MovieForm;
