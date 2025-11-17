import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

const MovieRelations = ({ movieId, user, onUpdate }) => {
  const [relations, setRelations] = useState({
    genero: [], diretor: [], dublador: [],
    produtora: [], linguagem: [], pais: []
  });
  const [availableEntities, setAvailableEntities] = useState({
    genero: [], diretor: [], dublador: [],
    produtora: [], linguagem: [], pais: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [movieId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar relacionamentos atuais
      const relationsData = await apiService.getMovieRelations(movieId);
      setRelations(relationsData);

      // Carregar entidades disponíveis
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
      setError('Erro ao carregar relacionamentos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRelation = async (relationType, entityId) => {
    try {
      await apiService.addMovieRelation(movieId, relationType, entityId);
      await loadData();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(`Erro ao adicionar ${relationType}: ` + err.message);
    }
  };

  const handleRemoveRelation = async (relationType, entityId) => {
    try {
      await apiService.removeMovieRelation(movieId, relationType, entityId);
      await loadData();
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(`Erro ao remover ${relationType}: ` + err.message);
    }
  };

  const getEntityName = (relationType, entityId) => {
    const entities = availableEntities[relationType];
    const entity = entities.find(e => e[`id_${relationType}`] === entityId);
    
    if (!entity) return 'N/A';
    
    switch (relationType) {
      case 'genero':
        return entity.nome_genero;
      case 'diretor':
        return `${entity.nome} ${entity.sobrenome}`.trim();
      case 'dublador':
        return `${entity.nome} ${entity.sobrenome}`.trim();
      case 'produtora':
        return entity.nome_produtora;
      case 'linguagem':
        return entity.nome_linguagem;
      case 'pais':
        return entity.nome_pais;
      default:
        return 'N/A';
    }
  };

  const relationConfig = {
    genero: { label: 'Gêneros', icon: '🏷️' },
    diretor: { label: 'Diretores', icon: '🎬' },
    dublador: { label: 'Dubladores', icon: '🎤' },
    produtora: { label: 'Produtoras', icon: '🏢' },
    linguagem: { label: 'Idiomas', icon: '🗣️' },
    pais: { label: 'Países', icon: '🌍' }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="text-lg">Carregando relacionamentos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col gap-4">
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {Object.entries(relationConfig).map(([relationType, config]) => {
        const currentRelations = relations[relationType] || [];
        const availableEntitiesList = availableEntities[relationType] || [];
        
        // Filtrar entidades já relacionadas
        const availableOptions = availableEntitiesList.filter(entity => 
          !currentRelations.some(rel => 
            rel[`id_${relationType}`] === entity[`id_${relationType}`]
          )
        );

        return (
          <div key={relationType} className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span>{config.icon}</span>
                {config.label}
              </h3>
            </div>
            
            <div className="card-body">
              {/* Lista de relacionamentos atuais */}
              <div className="mb-4">
                {currentRelations.length === 0 ? (
                  <p className="text-muted text-sm">Nenhum {config.label.toLowerCase()} adicionado</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {currentRelations.map(relation => (
                      <div
                        key={relation[`id_${relationType}`]}
                        className="bg-primary-color bg-opacity-10 text-primary-color px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {getEntityName(relationType, relation[`id_${relationType}`])}
                        {user.tipo === 'admin' && (
                          <button
                            onClick={() => handleRemoveRelation(relationType, relation[`id_${relationType}`])}
                            className="text-danger-color hover:text-danger-color hover:bg-white rounded-full w-4 h-4 flex items-center justify-center"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Adicionar novo relacionamento (apenas admin) */}
              {user.tipo === 'admin' && availableOptions.length > 0 && (
                <div className="flex gap-2 items-center">
                  <select
                    className="form-select flex-1 text-sm"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddRelation(relationType, parseInt(e.target.value));
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">Adicionar {config.label.toLowerCase()}...</option>
                    {availableOptions.map(entity => (
                      <option 
                        key={entity[`id_${relationType}`]} 
                        value={entity[`id_${relationType}`]}
                      >
                        {getEntityName(relationType, entity[`id_${relationType}`])}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MovieRelations;