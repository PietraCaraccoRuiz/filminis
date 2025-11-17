import React, { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import { motion } from "framer-motion";

// Ícones oficiais que você usa
import { FiUser, FiMic, FiGlobe, FiBriefcase } from "react-icons/fi";
import { MdCategory } from "react-icons/md";

const fadeCard = {
  hidden: { opacity: 0, filter: "blur(6px)", scale: 0.97 },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: { duration: 0.45, ease: "easeOut" }
  }
};

const MovieRelations = ({ movieId, user, onUpdate }) => {
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [movieId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const relationsData = await apiService.getMovieRelations(movieId);
      setRelations(relationsData);

      const entities = await Promise.all([
        apiService.getEntities("genero"),
        apiService.getEntities("diretor"),
        apiService.getEntities("dublador"),
        apiService.getEntities("produtora"),
        apiService.getEntities("linguagem"),
        apiService.getEntities("pais")
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
      setError("Erro ao carregar relacionamentos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRelation = async (type, id) => {
    try {
      await apiService.addMovieRelation(movieId, type, id);
      await loadData();
      onUpdate && onUpdate();
    } catch (err) {
      setError(`Erro ao adicionar ${type}: ${err.message}`);
    }
  };

  const handleRemoveRelation = async (type, id) => {
    try {
      await apiService.removeMovieRelation(movieId, type, id);
      await loadData();
      onUpdate && onUpdate();
    } catch (err) {
      setError(`Erro ao remover ${type}: ${err.message}`);
    }
  };

  const getEntityName = (type, id) => {
    const list = availableEntities[type] || [];
    const entity = list.find((e) => e[`id_${type}`] === id);
    if (!entity) return "N/A";

    switch (type) {
      case "genero": return entity.nome_genero;
      case "diretor": return `${entity.nome} ${entity.sobrenome}`.trim();
      case "dublador": return `${entity.nome} ${entity.sobrenome}`.trim();
      case "produtora": return entity.nome_produtora;
      case "linguagem": return entity.nome_linguagem;
      case "pais": return entity.nome_pais;
      default: return "N/A";
    }
  };

  const config = {
    genero: { label: "Gêneros", icon: <MdCategory /> },
    diretor: { label: "Diretores", icon: <FiUser /> },
    dublador: { label: "Dubladores", icon: <FiMic /> },
    produtora: { label: "Produtoras", icon: <FiBriefcase /> },
    linguagem: { label: "Idiomas", icon: <FiGlobe /> },
    pais: { label: "Países", icon: <FiGlobe /> }
  };

  if (loading) {
    return (
      <motion.div
        className="card p-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Carregando relacionamentos...
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      initial="hidden"
      animate="show"
      className="relation-wrapper"
    >
      {error && <div className="alert-error mb-2">{error}</div>}

      {Object.entries(config).map(([type, cfg]) => {
        const current = relations[type] || [];
        const available = (availableEntities[type] || []).filter(
          (entity) =>
            !current.some((rel) => rel[`id_${type}`] === entity[`id_${type}`])
        );

        return (
          <motion.div key={type} variants={fadeCard} className="card relation-card">
            <div className="relation-header">
              <h3 className="relation-title">
                {cfg.icon}
                {cfg.label}
              </h3>
            </div>

            <div className="relation-body">
              {/* LISTA DE RELAÇÕES ATUAIS */}
              <div className="relation-current-list">
                {current.length === 0 ? (
                  <p className="text-muted text-sm">
                    Nenhum {cfg.label.toLowerCase()} adicionado
                  </p>
                ) : (
                  <div className="relation-tags">
                    {current.map((rel) => {
                      const id = rel[`id_${type}`];

                      return (
                        <div key={id} className="relation-tag">
                          {getEntityName(type, id)}

                          {user.tipo === "admin" && (
                            <button
                              className="relation-tag-remove"
                              onClick={() => handleRemoveRelation(type, id)}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ADICIONAR RELAÇÃO */}
              {user.tipo === "admin" && available.length > 0 && (
                <select
                  className="form-select"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddRelation(type, parseInt(e.target.value));
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">
                    Adicionar {cfg.label.toLowerCase()}...
                  </option>

                  {available.map((entity) => (
                    <option
                      key={entity[`id_${type}`]}
                      value={entity[`id_${type}`]}
                    >
                      {getEntityName(type, entity[`id_${type}`])}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default MovieRelations;
