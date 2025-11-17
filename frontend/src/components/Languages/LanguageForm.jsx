import React, { useState, useEffect } from 'react';

const LanguageForm = ({ language, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    nome_linguagem: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (language) {
      setFormData({
        nome_linguagem: language.nome_linguagem || ''
      });
    }
  }, [language]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit(formData);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card w-full max-w-md">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-xl">
            {language ? 'Editar Idioma' : 'Adicionar Idioma'}
          </h2>
          <button
            onClick={onClose}
            className="btn btn-outline btn-sm"
          >
            ×
          </button>
        </div>

        <div className="card-body">
          {error && (
            <div className="alert alert-error mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nome_linguagem" className="form-label">
                Nome do Idioma *
              </label>
              <input
                type="text"
                id="nome_linguagem"
                name="nome_linguagem"
                value={formData.nome_linguagem}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="Português, Inglês..."
              />
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Salvando...' : (language ? 'Atualizar' : 'Criar')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LanguageForm;