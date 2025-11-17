import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import ActorForm from './ActorForm';
import { motion } from "framer-motion";

// ⚡ Fade suave + Blur (efeito moderno)
const fadeCard = {
  hidden: { opacity: 0, filter: "blur(6px)", scale: 0.97 },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: { duration: 0.45, ease: "easeOut" }
  }
};

const ActorList = ({ user }) => {
  const [actors, setActors] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingActor, setEditingActor] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [actorsData, countriesData] = await Promise.all([
        apiService.getEntities('dublador'),
        apiService.getEntities('pais')
      ]);
      setActors(actorsData);
      setCountries(countriesData);
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (actorData) => {
    try {
      await apiService.createEntity('dublador', actorData);
      setShowForm(false);
      loadData();
    } catch (err) {
      throw new Error('Erro ao criar dublador: ' + err.message);
    }
  };

  const handleUpdate = async (id, actorData) => {
    try {
      await apiService.updateEntity('dublador', id, actorData);
      setEditingActor(null);
      loadData();
    } catch (err) {
      throw new Error('Erro ao atualizar dublador: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este dublador?')) return;
    try {
      await apiService.deleteEntity('dublador', id);
      loadData();
    } catch (err) {
      setError('Erro ao excluir dublador: ' + err.message);
    }
  };

  const getCountryName = (countryId) => {
    const country = countries.find(c => c.id_pais === countryId);
    return country ? country.nome_pais : 'N/A';
  };

  if (loading) {
    return (
      <div className="container p-8 flex justify-center items-center">
        <motion.div
          initial={{ opacity: 0, filter: "blur(6px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="text-lg"
        >
          Carregando dubladores...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container p-4 flex flex-col gap-4">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl">Dubladores</h1>
          <p className="text-muted">
            {actors.length} dublador{actors.length !== 1 ? 'es' : ''} encontrado{actors.length !== 1 ? 's' : ''}
          </p>
        </div>

        {user.tipo === 'admin' && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            Adicionar Dublador
          </button>
        )}
      </div>

      {/* ALERT */}
      {error && <div className="alert alert-error mb-4">{error}</div>}

      {/* FORM */}
      {showForm && (
        <ActorForm
          actor={editingActor}
          countries={countries}
          onSubmit={
            editingActor
              ? (data) => handleUpdate(editingActor.id_dublador, data)
              : handleCreate
          }
          onClose={() => {
            setShowForm(false);
            setEditingActor(null);
          }}
        />
      )}

      {/* SEM REGISTROS */}
      {actors.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, filter: "blur(6px)", scale: 0.97 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="card text-center p-8"
        >
          <h3 className="text-lg mb-2">Nenhum dublador encontrado</h3>
          {user.tipo === 'admin' && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary mt-4"
            >
              Adicionar Primeiro Dublador
            </button>
          )}
        </motion.div>
      ) : (

        // LISTA — mesmo efeito do GenreList
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.09 } }
          }}
        >
          {actors.map((actor) => (
            <motion.div
              key={actor.id_dublador}
              variants={fadeCard}
              className="card"
            >
              <div className="card-body">
                <h3 className="text-lg font-semibold mb-2">
                  {actor.nome} {actor.sobrenome}
                </h3>

                <div className="space-y-1 text-sm text-muted">
                  <div>País: {getCountryName(actor.id_pais)}</div>
                  <div>ID: {actor.id_dublador}</div>
                </div>

                {user.tipo === 'admin' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border-color">
                    <button
                      onClick={() => {
                        setEditingActor(actor);
                        setShowForm(true);
                      }}
                      className="btn btn-outline btn-sm flex-1"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleDelete(actor.id_dublador)}
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

export default ActorList;
