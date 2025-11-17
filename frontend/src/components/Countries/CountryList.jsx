import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import CountryForm from './CountryForm';
import { motion } from "framer-motion";

// ⚡ Fade suave + Blur — mesmo efeito do GenreList
const fadeCard = {
  hidden: { opacity: 0, filter: "blur(6px)", scale: 0.97 },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: { duration: 0.45, ease: "easeOut" }
  }
};

const CountryList = ({ user }) => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      setLoading(true);
      const data = await apiService.getEntities('pais');
      setCountries(data);
    } catch (err) {
      setError('Erro ao carregar países: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (countryData) => {
    try {
      await apiService.createEntity('pais', countryData);
      setShowForm(false);
      loadCountries();
    } catch (err) {
      throw new Error('Erro ao criar país: ' + err.message);
    }
  };

  const handleUpdate = async (id, countryData) => {
    try {
      await apiService.updateEntity('pais', id, countryData);
      setEditingCountry(null);
      loadCountries();
    } catch (err) {
      throw new Error('Erro ao atualizar país: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este país?')) return;

    try {
      await apiService.deleteEntity('pais', id);
      loadCountries();
    } catch (err) {
      setError('Erro ao excluir país: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="container p-8 flex justify-center items-center">
        <div className="text-lg">Carregando países...</div>
      </div>
    );
  }

  return (
    <div className="container p-4 flex flex-col gap-4">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl">Países</h1>
          <p className="text-muted">
            {countries.length} país{countries.length !== 1 ? 'es' : ''} encontrado{countries.length !== 1 ? 's' : ''}
          </p>
        </div>

        {user.tipo === 'admin' && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            Adicionar País
          </button>
        )}
      </div>

      {/* ALERT */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* FORM */}
      {showForm && (
        <CountryForm
          country={editingCountry}
          onSubmit={
            editingCountry
              ? (data) => handleUpdate(editingCountry.id_pais, data)
              : handleCreate
          }
          onClose={() => {
            setShowForm(false);
            setEditingCountry(null);
          }}
        />
      )}

      {/* SEM REGISTROS */}
      {countries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, filter: "blur(6px)", scale: 0.97 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="card text-center p-8"
        >
          <h3 className="text-lg mb-2">Nenhum país encontrado</h3>
          <p className="text-muted mb-4">
            {user.tipo === 'admin'
              ? 'Comece adicionando seu primeiro país!'
              : 'Aguarde até que um administrador adicione países.'}
          </p>

          {user.tipo === 'admin' && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              Adicionar Primeiro País
            </button>
          )}
        </motion.div>
      ) : (

        // LISTA — Fade + blur elegante (stagger suave), igual ao GenreList
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: { staggerChildren: 0.09 }
            }
          }}
        >
          {countries.map((country) => (
            <motion.div
              key={country.id_pais}
              variants={fadeCard}
              className="card"
            >
              <div className="card-body">
                <h3 className="text-lg font-semibold mb-2">{country.nome_pais}</h3>

                <div className="text-sm text-muted mb-4">
                  ID: {country.id_pais}
                </div>

                {user.tipo === 'admin' && (
                  <div className="flex gap-2 pt-4 border-t border-border-color">
                    <button
                      onClick={() => {
                        setEditingCountry(country);
                        setShowForm(true);
                      }}
                      className="btn btn-outline btn-sm flex-1"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleDelete(country.id_pais)}
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

export default CountryList;
