const API_BASE = "http://localhost:8000";

class ApiService {
  constructor() {
    this.token = localStorage.getItem("authToken");
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, config);
    const text = await response.text();

    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!response.ok) {
      throw new Error(data?.error || `HTTP error: ${response.status}`);
    }

    return data;
  }

  // ------------------------------------
  // AUTH
  // ------------------------------------

  async login(username, password) {
    const data = await this.request("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async register(username, email, password) {
    return this.request("/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
  }

  async logout() {
    try {
      await this.request("/logout", { method: "POST" });
    } catch (_) {}
    this.setToken(null);
  }

  async checkLogin() {
    return this.request("/login-check");
  }

  // ------------------------------------
  // CRUD global
  // ------------------------------------

  async getEntities(entity) {
    return this.request(`/${entity}`);
  }

  async getEntity(entity, id) {
    return this.request(`/${entity}/${id}`);
  }

  async createEntity(entity, data) {
    return this.request(`/${entity}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateEntity(entity, id, data) {
    return this.request(`/${entity}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteEntity(entity, id) {
    return this.request(`/${entity}/${id}`, {
      method: "DELETE",
    });
  }

  // ------------------------------------
  // RELAÇÕES DE FILME
  // ------------------------------------

  async getMovieRelations(movieId) {
    const relations = {};
    const tables = [
      "filme_genero",
      "filme_diretor",
      "filme_dublador",
      "filme_produtora",
      "filme_linguagem",
      "filme_pais",
    ];

    for (const table of tables) {
      try {
        const data = await this.request(`/${table}/${movieId}`);
        relations[table.replace("filme_", "")] = data || [];
      } catch {
        relations[table.replace("filme_", "")] = [];
      }
    }

    return relations;
  }

  async addMovieRelation(movieId, relationType, entityId) {
    return this.request(`/filme_${relationType}`, {
      method: "POST",
      body: JSON.stringify({
        id_filme: movieId,
        [`id_${relationType}`]: entityId,
      }),
    });
  }

  async removeMovieRelation(movieId, relationType, entityId) {
    return this.request(`/filme_${relationType}/${movieId}?remove=${entityId}`, {
      method: "DELETE",
    });
  }

  // ------------------------------------
  // UPDATE COMPLETO DE RELAÇÕES (full replace)
  // ------------------------------------

  async updateMovieRelations(movieId, relations) {
    const relationTypes = Object.keys(relations);

    // 1. Carrega as relações atuais
    const current = await this.getMovieRelations(movieId);

    // 2. Remove todas as relações antigas
    for (const type of relationTypes) {
      const oldList = current[type] || [];

      for (const rel of oldList) {
        const relId = rel[`id_${type}`];
        await this.removeMovieRelation(movieId, type, relId);
      }
    }

    // 3. Adiciona as novas relações
    for (const type of relationTypes) {
      const items = relations[type] || [];

      for (const rel of items) {
        const relId = rel[`id_${type}`];
        await this.addMovieRelation(movieId, type, relId);
      }
    }

    return true;
  }

  // ------------------------------------
  // CRIAR FILME + RELAÇÕES
  // ------------------------------------

  async createMovieWithRelations(data, relations) {
    const movie = await this.createEntity("filme", data);
    const movieId = movie.id;

    await this.updateMovieRelations(movieId, relations);

    return movieId;
  }

  // ------------------------------------
  // ATUALIZAR FILME + RELAÇÕES
  // ------------------------------------

  async updateMovieWithRelations(movieId, data, relations) {
    await this.updateEntity("filme", movieId, data);
    await this.updateMovieRelations(movieId, relations);
    return movieId;
  }


    // ------------------------------------
  // SOLICITAÇÕES
  // ------------------------------------
async requestAdminUpgrade() {
  return this.request("/solicitacao-admin", {
    method: "POST"
  });
}

async getAdminRequests() {
  return this.request("/solicitacoes");
}

async updateAdminRequest(id, status) {
  return this.request(`/solicitacao-admin/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status })
  });
}

}

export const apiService = new ApiService();
