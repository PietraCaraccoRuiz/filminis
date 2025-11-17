// api.js corrigido — 100% compatível com o backend

const API_BASE = "http://localhost:8000";

class ApiService {
  constructor() {
    this.token = localStorage.getItem("authToken") || null;
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem("authToken", token);
    else localStorage.removeItem("authToken");
  }

  clearAuth() {
    this.token = null;
    localStorage.removeItem("authToken");
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    const config = {
      method: options.method || "GET",
      headers: {
        ...(options.headers || {})
      }
    };

    if (options.body) {
      config.headers["Content-Type"] = "application/json";
      config.body = JSON.stringify(options.body);
    }

    if (this.token) {
      config.headers["Authorization"] = `Bearer ${this.token}`;
    }

    const res = await fetch(url, config);
    const txt = await res.text();
    let data = null;

    try {
      data = txt ? JSON.parse(txt) : null;
    } catch {
      data = null;
    }

    if (res.status === 401) {
      this.clearAuth();
      throw new Error(data?.error || "Sessão expirada");
    }

    if (!res.ok) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }

    return data;
  }

  async login(username, password) {
    const res = await this.request("/login", {
      method: "POST",
      body: { username, password }
    });

    this.setToken(res.token);
    return res.user;
  }

  logout() {
    this.clearAuth();
  }

  getMe() {
    return this.request("/me");
  }

  getEntities(entity) {
    return this.request(`/${entity}`);
  }

  getEntity(entity, id) {
    return this.request(`/${entity}/${id}`);
  }

  createEntity(entity, data) {
    return this.request(`/${entity}`, {
      method: "POST",
      body: data
    });
  }

  updateEntity(entity, id, data) {
    return this.request(`/${entity}/${id}`, {
      method: "PUT",
      body: data
    });
  }

  deleteEntity(entity, id) {
    return this.request(`/${entity}/${id}`, {
      method: "DELETE"
    });
  }

  async getMovieRelations(movieId) {
    const tables = [
      "filme_genero",
      "filme_diretor",
      "filme_dublador",
      "filme_produtora",
      "filme_linguagem",
      "filme_pais",
    ];

    const rel = {};

    for (const tb of tables) {
      try {
        const r = await this.request(`/${tb}/${movieId}`);
        rel[tb.replace("filme_", "")] = r || [];
      } catch {
        rel[tb.replace("filme_", "")] = [];
      }
    }

    return rel;
  }
}

export const apiService = new ApiService();
