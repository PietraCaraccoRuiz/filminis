import React, { useState, useEffect } from 'react';

const DirectorForm = ({ director, countries, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    id_pais: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (director) {
      setFormData({
        nome: director.nome || '',
        sobrenome: director.sobrenome || '',
        id_pais: director.id_pais || ''
      });
    }
  }, [director]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = {
        ...formData,
        id_pais: formData.id_pais ? parseInt(formData.id_pais) : null
      };
      await onSubmit(submitData);
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
            {director ? 'Editar Diretor' : 'Adicionar Diretor'}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="nome" className="form-label">
                  Nome *
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className="form-input"
                  required
                  placeholder="Christopher"
                />
              </div>

              <div className="form-group">
                <label htmlFor="sobrenome" className="form-label">
                  Sobrenome
                </label>
                <input
                  type="text"
                  id="sobrenome"
                  name="sobrenome"
                  value={formData.sobrenome}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Nolan"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="id_pais" className="form-label">
                País
              </label>
              <select
                id="id_pais"
                name="id_pais"
                value={formData.id_pais}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Selecione um país</option>
                {countries.map(country => (
                  <option key={country.id_pais} value={country.id_pais}>
                    {country.nome_pais}
                  </option>
                ))}
              </select>
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
                {loading ? 'Salvando...' : (director ? 'Atualizar' : 'Criar')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DirectorForm;