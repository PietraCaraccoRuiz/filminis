import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { FiUser, FiMic, FiGlobe, FiBriefcase } from "react-icons/fi";
import { MdCategory } from "react-icons/md";

const MovieForm = ({ movie, movieId, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    titulo: '',
    orcamento: '',
    tempo_duracao: '',
    ano: '',
    poster_url: ''
  });

  const [relations, setRelations] = useState({
    genero: [], diretor: [], dublador: [],
    produtora: [], linguagem: [], pais: []
  });

  const [availableEntities, setAvailableEntities] = useState({
    genero: [], diretor: [], dublador: [],
    produtora: [], linguagem: [], pais: []
  });

  const [loading, setLoading] = useState(false);
  const [loadingMovie, setLoadingMovie] = useState(!!movieId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (movieId) loadMovieData();
    loadAvailableEntities();
  }, [movieId]);

  useEffect(() => {
    if (movie) {
      setFormData({
        titulo: movie.titulo || '',
        orcamento: movie.orcamento || '',
        tempo_duracao: movie.tempo_duracao || '',
        ano: movie.ano || '',
        poster_url: movie.poster_url || ''
      });

      if (movie.id_filme) loadMovieRelations(movie.id_filme);
    }
  }, [movie]);

  const loadMovieData = async () => {
    try {
      const data = await apiService.getEntity('filme', movieId);
      setFormData({
        titulo: data.titulo || '',
        orcamento: data.orcamento || '',
        tempo_duracao: data.tempo_duracao || '',
        ano: data.ano || '',
        poster_url: data.poster_url || ''
      });
      await loadMovieRelations(movieId);
    } catch (err) {
      setError('Erro ao carregar filme: ' + err.message);
    } finally {
      setLoadingMovie(false);
    }
  };

  const loadMovieRelations = async (id) => {
    try {
      const relationsData = await apiService.getMovieRelations(id);
      setRelations(relationsData);
    } catch {
      setRelations({
        genero: [], diretor: [], dublador: [],
        produtora: [], linguagem: [], pais: []
      });
    }
  };

  const loadAvailableEntities = async () => {
    try {
      const entities = await Promise.all([
        apiService.getEntities('genero'),
        apiService.getEntities('diretor'),
        apiService.getEntities('dublador'),
        apiService.getEntities('produtora'),
        apiService.getEntities('linguagem'),
        apiService.getEntities('pais')
      ]);

      setAvailableEntities({
        genero: entities[0],
        diretor: entities[1],
        dublador: entities[2],
        produtora: entities[3],
        linguagem: entities[4],
        pais: entities[5]
      });
    } catch {}
  };

  const handleRelationChange = (type, id, checked) => {
    setRelations(prev => {
      const current = prev[type] || [];

      return {
        ...prev,
        [type]: checked
          ? [...current, { [`id_${type}`]: id }]
          : current.filter(rel => rel[`id_${type}`] !== id)
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const prepared = {
        ...formData,
        orcamento: formData.orcamento ? parseFloat(formData.orcamento) : null,
        ano: formData.ano ? parseInt(formData.ano) : null
      };

      await onSubmit(prepared, relations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const relationConfig = {
    genero: { label: 'Gêneros', icon: <MdCategory /> },
    diretor: { label: 'Diretores', icon: <FiUser /> },
    dublador: { label: 'Dubladores', icon: <FiMic /> },
    produtora: { label: 'Produtoras', icon: <FiBriefcase /> },
    linguagem: { label: 'Idiomas', icon: <FiGlobe /> },
    pais: { label: 'Países', icon: <FiGlobe /> }
  };

  const currentYear = new Date().getFullYear();

  if (loadingMovie) {
    return (
      <div className="modal-overlay">
        <div className="modal-card">
          Carregando filme...
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">

        {/* HEADER */}
        <div className="card-header modal-header">
          <h2 className="modal-title">
            {movie || movieId ? "Editar Filme" : "Adicionar Filme"}
          </h2>
          <button onClick={onClose} className="btn-outline btn-sm">×</button>
        </div>

        <div className="card-body modal-body">
          {error && <div className="alert-error mb-2">{error}</div>}

          <form onSubmit={handleSubmit}>

            {/* CAMPOS DO FILME */}
            <div className="form-grid">

              <div className="form-group">
                <label className="form-label">Título *</label>
                <input
                  type="text"
                  name="titulo"
                  className="form-input"
                  required
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ano</label>
                <input
                  type="number"
                  name="ano"
                  className="form-input"
                  min="1900"
                  max={currentYear}
                  value={formData.ano}
                  onChange={(e) =>
                    setFormData({ ...formData, ano: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Orçamento (USD)</label>
                <input
                  type="number"
                  name="orcamento"
                  className="form-input"
                  value={formData.orcamento}
                  onChange={(e) =>
                    setFormData({ ...formData, orcamento: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Duração (HH:MM:SS)</label>
                <input
                  type="text"
                  name="tempo_duracao"
                  className="form-input"
                  value={formData.tempo_duracao}
                  onChange={(e) =>
                    setFormData({ ...formData, tempo_duracao: e.target.value })
                  }
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">URL do Poster</label>
                <input
                  type="url"
                  name="poster_url"
                  className="form-input"
                  value={formData.poster_url}
                  onChange={(e) =>
                    setFormData({ ...formData, poster_url: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="section-divider"></div>

            {/* RELACIONAMENTOS */}
            <h3 className="section-title">Relacionamentos</h3>

            <div className="relation-grid">
              {Object.entries(relationConfig).map(([type, cfg]) => (
                <div key={type} className="relation-box">

                  <label className="relation-label">
                    {cfg.icon} {cfg.label}
                  </label>

                  <div className="relation-list">
                    {availableEntities[type]?.length === 0 ? (
                      <p className="empty-text">Nenhum {cfg.label.toLowerCase()} disponível</p>
                    ) : (
                      availableEntities[type].map(entity => {
                        const id = entity[`id_${type}`];
                        const checked = relations[type]?.some(
                          rel => rel[`id_${type}`] === id
                        );

                        return (
                          <label key={id} className="checkbox-line">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                handleRelationChange(type, id, e.target.checked)
                              }
                            />
                            <span>
                              {type === "genero" && entity.nome_genero}
                              {type === "diretor" && `${entity.nome} ${entity.sobrenome}`}
                              {type === "dublador" && `${entity.nome} ${entity.sobrenome}`}
                              {type === "produtora" && entity.nome_produtora}
                              {type === "linguagem" && entity.nome_linguagem}
                              {type === "pais" && entity.nome_pais}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn-outline">
                Cancelar
              </button>

              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Salvando..." : movie || movieId ? "Atualizar" : "Criar"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default MovieForm;
