import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import StudioForm from './StudioForm';
import { motion } from "framer-motion";

// ⚡ Fade suave + Blur (mesmo do GenreList)
const fadeCard = {
  hidden: { opacity: 0, filter: "blur(6px)", scale: 0.97 },
  show: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: { duration: 0.45, ease: "easeOut" }
  }
};

const StudioList = ({ user }) => {
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStudio, setEditingStudio] = useState(null);

  useEffect(() => {
    loadStudios();
  }, []);

  const loadStudios = async () => {
    try {
      setLoading(true);
      const data = await apiService.getEntities('produtora');
      setStudios(data);
    } catch (err) {
      setError('Erro ao carregar produtoras: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (studioData) => {
    try {
      await apiService.createEntity('produtora', studioData);
      setShowForm(false);
      loadStudios();
    } catch (err) {
      throw new Error('Erro ao criar produtora: ' + err.message);
    }
  };

  const handleUpdate = async (id, studioData) => {
    try {
      await apiService.updateEntity('produtora', id, studioData);
      setEditingStudio(null);
      loadStudios();
    } catch (err) {
      throw new Error('Erro ao atualizar produtora: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta produtora?')) return;

    try {
      await apiService.deleteEntity('produtora', id);
      loadStudios();
    } catch (err) {
      setError('Erro ao excluir produtora: ' + err.message);
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
          Carregando produtoras...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container p-4 flex flex-col gap-4">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl">Produtoras</h1>
          <p className="text-muted">
            {studios.length} produtora{studios.length !== 1 ? 's' : ''} encontrada{studios.length !== 1 ? 's' : ''}
          </p>
        </div>

        {user.tipo === 'admin' && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            Adicionar Produtora
          </button>
        )}
      </div>

      {/* ERRO */}
      {error && <div className="alert alert-error mb-4">{error}</div>}

      {/* FORM */}
      {showForm && (
        <StudioForm
          studio={editingStudio}
          onSubmit={
            editingStudio
              ? (data) => handleUpdate(editingStudio.id_produtora, data)
              : handleCreate
          }
          onClose={() => {
            setShowForm(false);
            setEditingStudio(null);
          }}
        />
      )}

      {/* SEM REGISTROS */}
      {studios.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, filter: "blur(6px)", scale: 0.97 }}
          animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="card text-center p-8"
        >
          <h3 className="text-lg mb-2">Nenhuma produtora encontrada</h3>
          {user.tipo === 'admin' && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary mt-4"
            >
              Adicionar Primeira Produtora
            </button>
          )}
        </motion.div>
      ) : (

        // LISTA ANIMADA - mesmo padrão GenreList
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.09 } }
          }}
        >
          {studios.map((studio) => (
            <motion.div
              key={studio.id_produtora}
              variants={fadeCard}
              className="card"
            >
              <div className="card-body">
                <h3 className="text-lg font-semibold mb-2">
                  {studio.nome_produtora}
                </h3>

                <div className="text-sm text-muted">
                  ID: {studio.id_produtora}
                </div>

                {user.tipo === 'admin' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border-color">
                    <button
                      onClick={() => {
                        setEditingStudio(studio);
                        setShowForm(true);
                      }}
                      className="btn btn-outline btn-sm flex-1"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(studio.id_produtora)}
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

export default StudioList;
