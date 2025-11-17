const API_BASE = "http://localhost:8000"; // sem /api e direto no backend

class ApiService {
  constructor() {
    this.token = localStorage.getItem("authToken") || null;
  }

  // -------------------------------
  // TOKEN
  // -------------------------------
  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem("authToken", token);
    else localStorage.removeItem("authToken");
  }

  clearAuth() {
    this.token = null;
    localStorage.removeItem("authToken");
  }

  // -------------------------------
  // REQUEST WRAPPER
  // -------------------------------
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    const config = {
      method: options.method || "GET",
      headers: {
        ...(options.headers || {}),
      },
    };

    // só coloca JSON quando tiver body
    if (options.body) {
      config.headers["Content-Type"] = "application/json";
      config.body = JSON.stringify(options.body);
    }

    // JWT
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(url, config);

      const raw = await res.text();
      let data = null;

      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          // se o back devolver HTML ou texto, não quebra o front
          data = null;
        }
      }

      if (res.status === 401) {
        this.clearAuth();
        throw new Error("Sessão expirada, faça login novamente.");
      }

      if (!res.ok) {
        throw new Error(data?.error || `Erro HTTP ${res.status}`);
      }

      return data;
    } catch (err) {
      console.error("API Request failed →", err);
      throw err;
    }
  }

  // -------------------------------
  // AUTH
  // -------------------------------
  async login(username, password) {
    const data = await this.request("/login", {
      method: "POST",
      body: { username, password },
    });

    if (!data?.token) {
      throw new Error("Resposta inválida da API.");
    }

    this.setToken(data.token);
    return data.user;
  }

  async register(username, email, password) {
    return this.request("/register", {
      method: "POST",
      body: { username, email, password },
    });
  }

  async logout() {
    try {
      await this.request("/logout", { method: "POST" });
    } catch (e) {
      console.warn("Logout forçado:", e.message);
    }
    this.clearAuth();
  }

  async getMe() {
    return this.request("/me");
  }

  // -------------------------------
  // CRUD BASE
  // -------------------------------
  getEntities(entity) {
    return this.request(`/${entity}`);
  }

  getEntity(entity, id) {
    return this.request(`/${entity}/${id}`);
  }

  createEntity(entity, data) {
    return this.request(`/${entity}`, {
      method: "POST",
      body: data,
    });
  }

  updateEntity(entity, id, data) {
    return this.request(`/${entity}/${id}`, {
      method: "PUT",
      body: data,
    });
  }

  deleteEntity(entity, id) {
    return this.request(`/${entity}/${id}`, {
      method: "DELETE",
    });
  }

  // -------------------------------
  // FILME - RELAÇÕES
  // -------------------------------
  async getMovieRelations(movieId) {
    const tables = [
      "filme_genero",
      "filme_diretor",
      "filme_dublador",
      "filme_produtora",
      "filme_linguagem",
      "filme_pais",
    ];

    const relations = {};

    for (const table of tables) {
      try {
        const res = await this.request(`/${table}/${movieId}`);
        relations[table.replace("filme_", "")] = res || [];
      } catch {
        relations[table.replace("filme_", "")] = [];
      }
    }

    return relations;
  }

  addMovieRelation(movieId, relationType, relatedId) {
    return this.request(`/filme_${relationType}`, {
      method: "POST",
      body: {
        id_filme: movieId,
        [`id_${relationType}`]: relatedId,
      },
    });
  }

  removeMovieRelation(movieId, relationType, relatedId) {
    return this.request(`/filme_${relationType}/${movieId}/${relatedId}`, {
      method: "DELETE",
    });
  }

  getRelatedEntities(movieId, relationType) {
    return this.request(`/filme_${relationType}/${movieId}`);
  }

  async updateMovieRelations(movieId, relations) {
    const results = [];

    for (const [relationType, items] of Object.entries(relations)) {
      const existing = await this.getRelatedEntities(movieId, relationType);

      // remover os que saíram
      for (const old of existing) {
        const stillExists = items.some(
          (i) => i[`id_${relationType}`] === old[`id_${relationType}`]
        );

        if (!stillExists) {
          await this.removeMovieRelation(
            movieId,
            relationType,
            old[`id_${relationType}`]
          );
        }
      }

      // adicionar novos
      for (const item of items) {
        const alreadyExists = existing.some(
          (o) => o[`id_${relationType}`] === item[`id_${relationType}`]
        );

        if (!alreadyExists) {
          await this.addMovieRelation(
            movieId,
            relationType,
            item[`id_${relationType}`]
          );
        }
      }

      results.push({ relationType, success: true });
    }

    return results;
  }
}

export const apiService = new ApiService();
