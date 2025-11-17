import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import DirectorForm from './DirectorForm';
import { motion, AnimatePresence } from 'framer-motion';

// ⚡ Mesmo fade/blur elegante do GenreList
const fadeCard = {
  hidden: { opacity: 0, filter: "blur(6px)", scale: 0.97 },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: { duration: 0.45, ease: "easeOut" }
  }
};

const DirectorList = ({ user }) => {
  const [directors, setDirectors] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDirector, setEditingDirector] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [directorsData, countriesData] = await Promise.all([
        apiService.getEntities('diretor'),
        apiService.getEntities('pais')
      ]);
      setDirectors(directorsData);
      setCountries(countriesData);
    } catch (err) {
      setError('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (directorData) => {
    try {
      await apiService.createEntity('diretor', directorData);
      setShowForm(false);
      loadData();
    } catch (err) {
      throw new Error('Erro ao criar diretor: ' + err.message);
    }
  };

  const handleUpdate = async (id, directorData) => {
    try {
      await apiService.updateEntity('diretor', id, directorData);
      setEditingDirector(null);
      loadData();
    } catch (err) {
      throw new Error('Erro ao atualizar diretor: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este diretor?')) return;

    try {
      await apiService.deleteEntity('diretor', id);
      loadData();
    } catch (err) {
      setError('Erro ao excluir diretor: ' + err.message);
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
          Carregando diretores...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container p-4 flex flex-col gap-4">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl">Diretores</h1>
          <p className="text-muted">
            {directors.length} diretor{directors.length !== 1 ? 'es' : ''} encontrado{directors.length !== 1 ? 's' : ''}
          </p>
        </div>

        {user.tipo === 'admin' && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            Adicionar Diretor
          </button>
        )}
      </div>

      {/* ALERT */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="alert alert-error"
            initial={{ opacity: 0, filter: "blur(6px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.4 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FORM */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, filter: "blur(6px)", scale: 0.97 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, filter: "blur(6px)", scale: 0.97 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <DirectorForm
              director={editingDirector}
              countries={countries}
              onSubmit={
                editingDirector
                  ? (data) => handleUpdate(editingDirector.id_diretor, data)
                  : handleCreate
              }
              onClose={() => {
                setShowForm(false);
                setEditingDirector(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEM REGISTROS */}
      {directors.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, filter: "blur(6px)", scale: 0.97 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="card text-center p-8"
        >
          <h3 className="text-lg mb-2">Nenhum diretor encontrado</h3>

          {user.tipo === 'admin' && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              Adicionar Primeiro Diretor
            </button>
          )}
        </motion.div>
      ) : (

        // LISTA — mesmo efeito do GenreList (fade + blur + stagger)
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.09 } }
          }}
        >
          {directors.map((director) => (
            <motion.div
              key={director.id_diretor}
              variants={fadeCard}
              className="card"
            >
              <div className="card-body">
                <h3 className="text-lg font-semibold mb-2">
                  {director.nome} {director.sobrenome}
                </h3>

                <div className="text-sm text-muted mb-4">
                  <div>País: {getCountryName(director.id_pais)}</div>
                  <div>ID: {director.id_diretor}</div>
                </div>

                {user.tipo === 'admin' && (
                  <div className="flex gap-2 pt-4 border-t border-border-color">
                    <button
                      onClick={() => {
                        setEditingDirector(director);
                        setShowForm(true);
                      }}
                      className="btn btn-outline btn-sm flex-1"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleDelete(director.id_diretor)}
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

export default DirectorList;
