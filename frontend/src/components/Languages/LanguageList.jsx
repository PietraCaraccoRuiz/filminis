import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import LanguageForm from './LanguageForm';
import { motion } from "framer-motion";

// ⚡ Fade suave + Blur (igual StudioList)
const fadeCard = {
  hidden: { opacity: 0, filter: "blur(6px)", scale: 0.97 },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: { duration: 0.45, ease: "easeOut" }
  }
};

const LanguageList = ({ user }) => {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState(null);

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      setLoading(true);
      const data = await apiService.getEntities('linguagem');
      setLanguages(data);
    } catch (err) {
      setError('Erro ao carregar idiomas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (languageData) => {
    try {
      await apiService.createEntity('linguagem', languageData);
      setShowForm(false);
      loadLanguages();
    } catch (err) {
      throw new Error('Erro ao criar idioma: ' + err.message);
    }
  };

  const handleUpdate = async (id, languageData) => {
    try {
      await apiService.updateEntity('linguagem', id, languageData);
      setEditingLanguage(null);
      loadLanguages();
    } catch (err) {
      throw new Error('Erro ao atualizar idioma: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este idioma?')) return;

    try {
      await apiService.deleteEntity('linguagem', id);
      loadLanguages();
    } catch (err) {
      setError('Erro ao excluir idioma: ' + err.message);
    }
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
          Carregando idiomas...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container p-4 flex flex-col gap-4">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl">Idiomas</h1>
          <p className="text-muted">
            {languages.length} idioma{languages.length !== 1 ? 's' : ''} encontrado
            {languages.length !== 1 ? 's' : ''}
          </p>
        </div>

        {user.tipo === 'admin' && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            Adicionar Idioma
          </button>
        )}
      </div>

      {/* ERRO */}
      {error && <div className="alert alert-error mb-4">{error}</div>}

      {/* FORM */}
      {showForm && (
        <LanguageForm
          language={editingLanguage}
          onSubmit={
            editingLanguage
              ? (data) => handleUpdate(editingLanguage.id_linguagem, data)
              : handleCreate
          }
          onClose={() => {
            setShowForm(false);
            setEditingLanguage(null);
          }}
        />
      )}

      {/* SEM REGISTROS */}
      {languages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, filter: "blur(6px)", scale: 0.97 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="card text-center p-8"
        >
          <h3 className="text-lg mb-2">Nenhum idioma encontrado</h3>
          {user.tipo === 'admin' && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary mt-4"
            >
              Adicionar Primeiro Idioma
            </button>
          )}
        </motion.div>
      ) : (

        // LISTA ANIMADA - mesmo padrão StudioList
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.09 } }
          }}
        >
          {languages.map((language) => (
            <motion.div
              key={language.id_linguagem}
              variants={fadeCard}
              className="card"
            >
              <div className="card-body">
                <h3 className="text-lg font-semibold mb-2">
                  {language.nome_linguagem}
                </h3>

                <div className="text-sm text-muted">
                  ID: {language.id_linguagem}
                </div>

                {user.tipo === 'admin' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border-color">
                    <button
                      onClick={() => {
                        setEditingLanguage(language);
                        setShowForm(true);
                      }}
                      className="btn btn-outline btn-sm flex-1"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => handleDelete(language.id_linguagem)}
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

export default LanguageList;
