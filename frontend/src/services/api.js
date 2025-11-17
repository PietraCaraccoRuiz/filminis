const API_BASE = '/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('authToken');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            let data;

            if (response.status !== 204) {
                const text = await response.text();
                data = text ? JSON.parse(text) : null;
            }

            if (!response.ok) {
                throw new Error(data?.error || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(username, password) {
        const data = await this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async register(username, email, password) {
        return this.request('/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password }),
        });
    }

    async logout() {
        try {
            await this.request('/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.setToken(null);
        }
    }

    // CRUD operations
    async getEntities(entity) {
        return this.request(`/${entity}`);
    }

    async getEntity(entity, id) {
        return this.request(`/${entity}/${id}`);
    }

    async createEntity(entity, data) {
        return this.request(`/${entity}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateEntity(entity, id, data) {
        return this.request(`/${entity}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteEntity(entity, id) {
        return this.request(`/${entity}/${id}`, {
            method: 'DELETE',
        });
    }
    async getMovieRelations(movieId) {
        const relations = {};

        const relationTables = [
            'filme_genero', 'filme_diretor', 'filme_dublador',
            'filme_produtora', 'filme_linguagem', 'filme_pais'
        ];

        for (const table of relationTables) {
            try {
                const result = await this.request(`/${table}/${movieId}`);
                relations[table.replace('filme_', '')] = result || [];
            } catch (error) {
                relations[table.replace('filme_', '')] = [];
            }
        }

        return relations;
    }


    async addMovieRelation(movieId, relationType, relatedId) {
        return this.request(`/filme_${relationType}`, {
            method: 'POST',
            body: JSON.stringify({
                id_filme: movieId,
                [`id_${relationType}`]: relatedId
            }),
        });
    }


    async removeMovieRelation(movieId, relationType, relatedId) {
        return this.request(`/filme_${relationType}/${movieId}/${relatedId}`, {
            method: 'DELETE',
        });
    }

    async getRelatedEntities(movieId, entityType) {
        return this.request(`/filme_${entityType}/${movieId}`);
    }

    async updateMovieRelations(movieId, relations) {
  const results = [];
  
  for (const [relationType, items] of Object.entries(relations)) {
    try {
      // Primeiro, remover todas as relações existentes deste tipo
      const currentRelations = await this.getRelatedEntities(movieId, relationType);
      
      // Remover relações que não estão mais na lista
      for (const currentRelation of currentRelations) {
        const shouldKeep = items.some(
          newRel => newRel[`id_${relationType}`] === currentRelation[`id_${relationType}`]
        );
        
        if (!shouldKeep) {
          await this.removeMovieRelation(movieId, relationType, currentRelation[`id_${relationType}`]);
        }
      }
      
      // Adicionar novas relações
      for (const newRelation of items) {
        const exists = currentRelations.some(
          currentRel => currentRel[`id_${relationType}`] === newRelation[`id_${relationType}`]
        );
        
        if (!exists) {
          await this.addMovieRelation(movieId, relationType, newRelation[`id_${relationType}`]);
        }
      }
      
      results.push({ relationType, success: true });
    } catch (error) {
      console.error(`Erro ao atualizar ${relationType}:`, error);
      results.push({ relationType, success: false, error: error.message });
    }
  }
  
  return results;
}
}

export const apiService = new ApiService();