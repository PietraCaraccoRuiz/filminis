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
    } catch (err) {
      console.error('Erro ao carregar relacionamentos:', err);
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
    } catch (err) {
      console.error('Erro ao carregar entidades:', err);
    }
  };

  const handleRelationChange = (relationType, entityId, checked) => {
    setRelations(prev => {
      const currentRelations = prev[relationType] || [];
      if (checked) {
        return {
          ...prev,
          [relationType]: [...currentRelations, { [`id_${relationType}`]: entityId }]
        };
      } else {
        return {
          ...prev,
          [relationType]: currentRelations.filter(
            rel => rel[`id_${relationType}`] !== entityId
          )
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        orcamento: formData.orcamento ? parseFloat(formData.orcamento) : null,
        ano: formData.ano ? parseInt(formData.ano) : null
      };
      await onSubmit(submitData, relations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getEntityName = (relationType, entityId) => {
    const entities = availableEntities[relationType] || [];
    const entity = entities.find(e => e[`id_${relationType}`] === entityId);
    if (!entity) return 'N/A';
    switch (relationType) {
      case 'genero': return entity.nome_genero;
      case 'diretor': return `${entity.nome} ${entity.sobrenome}`.trim();
      case 'dublador': return `${entity.nome} ${entity.sobrenome}`.trim();
      case 'produtora': return entity.nome_produtora;
      case 'linguagem': return entity.nome_linguagem;
      case 'pais': return entity.nome_pais;
      default: return 'N/A';
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="card p-8">
          <div className="text-center">Carregando filme...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-xl">
            {movie || movieId ? 'Editar Filme' : 'Adicionar Filme'}
          </h2>
          <button onClick={onClose} className="btn btn-outline btn-sm">×</button>
        </div>

        <div className="card-body">
          {error && <div className="alert alert-error mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="form-group">
                <label htmlFor="titulo" className="form-label">Título *</label>
                <input
                  type="text"
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="ano" className="form-label">Ano</label>
                <input
                  type="number"
                  id="ano"
                  name="ano"
                  value={formData.ano}
                  onChange={handleChange}
                  className="form-input"
                  min="1900"
                  max={currentYear}
                  placeholder={currentYear.toString()}
                />
              </div>

              <div className="form-group">
                <label htmlFor="orcamento" className="form-label">Orçamento (USD)</label>
                <input
                  type="number"
                  id="orcamento"
                  name="orcamento"
                  value={formData.orcamento}
                  onChange={handleChange}
                  className="form-input"
                  min="0"
                  step="1000000"
                  placeholder="50000000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tempo_duracao" className="form-label">Duração</label>
                <input
                  type="text"
                  id="tempo_duracao"
                  name="tempo_duracao"
                  value={formData.tempo_duracao}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="02:15:00"
                />
                <div className="form-error text-xs mt-1">Formato: HH:MM:SS</div>
              </div>

              <div className="form-group md:col-span-2">
                <label htmlFor="poster_url" className="form-label">URL do Poster</label>
                <input
                  type="url"
                  id="poster_url"
                  name="poster_url"
                  value={formData.poster_url}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="https://exemplo.com/poster.jpg"
                />
              </div>
            </div>

            <div className="border-t border-border-color pt-6">
              <h3 className="text-lg font-semibold mb-4">Relacionamentos</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(relationConfig).map(([relationType, config]) => (
                  <div key={relationType} className="form-group">
                    <label className="form-label flex items-center gap-2">
                      <span>{config.icon}</span>
                      {config.label}
                    </label>

                    <div className="max-h-32 overflow-y-auto border border-border-color rounded-md p-2">
                      {availableEntities[relationType]?.length === 0 ? (
                        <p className="text-muted text-sm">Nenhum {config.label.toLowerCase()} disponível</p>
                      ) : (
                        availableEntities[relationType]?.map(entity => {
                          const isChecked = relations[relationType]?.some(
                            rel => rel[`id_${relationType}`] === entity[`id_${relationType}`]
                          );

                          return (
                            <label key={entity[`id_${relationType}`]} className="flex items-center gap-2 py-1">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) =>
                                  handleRelationChange(
                                    relationType,
                                    entity[`id_${relationType}`],
                                    e.target.checked
                                  )
                                }
                                className="rounded border-border-color"
                              />
                              <span className="text-sm">
                                {getEntityName(relationType, entity[`id_${relationType}`])}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button type="button" onClick={onClose} className="btn btn-outline">Cancelar</button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Salvando...' : (movie || movieId ? 'Atualizar' : 'Criar')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MovieForm;
