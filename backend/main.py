import mysql.connector
import json
import http.server
import socketserver
import hashlib
import secrets
import datetime
from decimal import Decimal
from urllib.parse import urlparse, parse_qs

# ================================================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# ================================================================

MYSQL_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "1234",
    "database": "filminis"
}


def get_connection():
    """
    Abre conexão com o MySQL usando as credenciais configuradas.
    """
    return mysql.connector.connect(
        host=MYSQL_CONFIG["host"],
        user=MYSQL_CONFIG["user"],
        password=MYSQL_CONFIG["password"],
        database=MYSQL_CONFIG["database"]
    )


# ================================================================
# SANITIZAÇÃO GLOBAL DE DADOS
# ================================================================

def sanitize(obj):
    """
    Converte tipos Python não-JSON (datetime, timedelta, Decimal)
    em representações compatíveis com JSON.
    """
    if isinstance(obj, datetime.datetime):
        return obj.isoformat()

    if isinstance(obj, datetime.date):
        return obj.isoformat()

    # mysql-connector usa timedelta para campos TIME
    if isinstance(obj, datetime.timedelta):
        total = int(obj.total_seconds())
        h = total // 3600
        m = (total % 3600) // 60
        s = total % 60
        return f"{h:02}:{m:02}:{s:02}"

    if isinstance(obj, Decimal):
        return float(obj)

    if isinstance(obj, dict):
        return {k: sanitize(v) for k, v in obj.items()}

    if isinstance(obj, list):
        return [sanitize(i) for i in obj]

    return obj


# ================================================================
# MAPEAMENTO DE TABELAS DE RELAÇÃO (FILME-OUTRAS ENTIDADES)
# ================================================================

RELATION_TABLES = {
    "filme_genero": ("id_filme", "id_genero"),
    "filme_diretor": ("id_filme", "id_diretor"),
    "filme_dublador": ("id_filme", "id_dublador"),
    "filme_produtora": ("id_filme", "id_produtora"),
    "filme_linguagem": ("id_filme", "id_linguagem"),
    "filme_pais": ("id_filme", "id_pais"),
}


# ================================================================
# GERENCIAMENTO DE AUTENTICAÇÃO
# ================================================================

class AuthManager:
    """
    Lida com login, logout, registro e validação de sessão.
    """

    def _hash(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()

    def login(self, username: str, password: str):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM usuario WHERE username = %s AND senha_hash = %s",
            (username, self._hash(password))
        )
        user = cursor.fetchone()

        if user:
            token = secrets.token_hex(16)  # 32 caracteres hexadecimais
            cursor.execute(
                "INSERT INTO sessoes (token, id_usuario) VALUES (%s, %s)",
                (token, user["id_usuario"])
            )
            conn.commit()
            conn.close()
            return token, user

        conn.close()
        return None, None

    def verify(self, token: str):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT u.*
            FROM usuario u
            JOIN sessoes s ON s.id_usuario = u.id_usuario
            WHERE s.token = %s
        """, (token,))
        user = cursor.fetchone()
        conn.close()
        return user

    def logout(self, token: str) -> bool:
        if not token:
            return False
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessoes WHERE token = %s", (token,))
        ok = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return ok

    def register(self, username: str, email: str, password: str):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO usuario (username, email, senha_hash, tipo)
                VALUES (%s, %s, %s, 'user')
            """, (username, email, self._hash(password)))
            conn.commit()
            return cursor.lastrowid
        except Exception:
            # violação de UNIQUE (username/email) cai aqui
            return None
        finally:
            conn.close()


# ================================================================
# API HANDLER (SERVIDOR HTTP)
# ================================================================

class FilmAPIHandler(http.server.BaseHTTPRequestHandler):
    """
    Implementa a API HTTP baseada em rotas REST simples.
    """

    def __init__(self, *args, **kwargs):
        self.auth = AuthManager()
        super().__init__(*args, **kwargs)

    # ------------------------------------------------------------
    # UTILITÁRIOS
    # ------------------------------------------------------------

    def _get_token(self):
        """
        Extrai o token do cabeçalho Authorization (Bearer <token>).
        """
        auth_header = self.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            return auth_header[7:]
        return None

    def _require_auth(self, role: str = None):
        """
        Valida token e, opcionalmente, o tipo de usuário (admin/user).
        """
        token = self._get_token()
        if not token:
            self._send_error("Token não fornecido", 401)
            return None

        user = self.auth.verify(token)
        if not user:
            self._send_error("Token inválido", 401)
            return None

        if role and user["tipo"] != role:
            self._send_error("Acesso negado", 403)
            return None

        return user

    def _parse_url(self):
        """
        Separa a URL em entidade e ID numérico (se existir).
        Ex.: /filme/10 -> ('filme', 10)
        """
        path_only = self.path.split("?", 1)[0]
        clean = path_only.strip("/")
        if clean == "":
            return None, None

        parts = clean.split("/")
        entity = parts[0]
        entity_id = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else None
        return entity, entity_id

    def _body(self):
        """
        Lê o corpo JSON da requisição.
        """
        length = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(length)) if length > 0 else {}

    def _json(self, payload, status=200):
        """
        Envia uma resposta JSON padronizada com CORS liberado.
        """
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.end_headers()
        self.wfile.write(json.dumps(sanitize(payload), ensure_ascii=False).encode())

    def _send_error(self, msg, status=400):
        """
        Atalho para enviar erro em formato JSON.
        """
        self._json({"error": msg}, status)

    # ------------------------------------------------------------
    # CORS
    # ------------------------------------------------------------

    def do_OPTIONS(self):
        """
        Responde a preflight CORS.
        """
        self._json({}, 200)

    # ------------------------------------------------------------
    # GET
    # ------------------------------------------------------------

    def do_GET(self):
        entity, entity_id = self._parse_url()

        if not entity:
            self._send_error("Rota inválida", 404)
            return

        # Verificação de sessão
        if entity == "login-check":
            user = self._require_auth()
            if user:
                self._json({"user": user})
            return

        # Orientação de uso
        if entity == "login":
            self._json({"message": "Use POST /login"})
            return

        # Todas as demais rotas GET exigem usuário autenticado
        user = self._require_auth()
        if not user:
            return

        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)

            # ------------------------------------------------
            # LISTAGEM ESPECIAL DE FILMES COM RELAÇÕES
            # ------------------------------------------------
            if entity == "filme" and not entity_id:
                cursor.execute("SELECT * FROM filme")
                filmes = cursor.fetchall()

                for f in filmes:
                    fid = f["id_filme"]

                    cursor.execute("""
                        SELECT g.* FROM filme_genero fg
                        JOIN genero g ON g.id_genero = fg.id_genero
                        WHERE fg.id_filme = %s
                    """, (fid,))
                    f["generos"] = cursor.fetchall()

                    cursor.execute("""
                        SELECT d.* FROM filme_diretor fd
                        JOIN diretor d ON d.id_diretor = fd.id_diretor
                        WHERE fd.id_filme = %s
                    """, (fid,))
                    f["diretores"] = cursor.fetchall()

                    cursor.execute("""
                        SELECT p.* FROM filme_pais fp
                        JOIN pais p ON p.id_pais = fp.id_pais
                        WHERE fp.id_filme = %s
                    """, (fid,))
                    f["paises"] = cursor.fetchall()

                    cursor.execute("""
                        SELECT pr.* FROM filme_produtora fp
                        JOIN produtora pr ON pr.id_produtora = fp.id_produtora
                        WHERE fp.id_filme = %s
                    """, (fid,))
                    f["produtoras"] = cursor.fetchall()

                    cursor.execute("""
                        SELECT l.* FROM filme_linguagem fl
                        JOIN linguagem l ON l.id_linguagem = fl.id_linguagem
                        WHERE fl.id_filme = %s
                    """, (fid,))
                    f["linguagens"] = cursor.fetchall()

                conn.close()
                self._json(filmes)
                return

            # ------------------------------------------------
            # GET ESPECÍFICO PARA TABELAS DE RELAÇÃO
            # /filme_genero/<id_filme>
            # /filme_diretor/<id_filme>
            # ...
            # ------------------------------------------------
            if entity in RELATION_TABLES and entity_id:
                movie_col, _ = RELATION_TABLES[entity]
                cursor.execute(
                    f"SELECT * FROM {entity} WHERE {movie_col} = %s",
                    (entity_id,)
                )
                rows = cursor.fetchall()
                conn.close()
                self._json(rows)
                return

            # ------------------------------------------------
            # GET padrão para tabelas simples
            # ------------------------------------------------
            if entity_id:
                cursor.execute(
                    f"SELECT * FROM {entity} WHERE id_{entity} = %s",
                    (entity_id,)
                )
                row = cursor.fetchone()
                conn.close()

                if not row:
                    self._send_error("Não encontrado", 404)
                else:
                    self._json(row)
            else:
                cursor.execute(f"SELECT * FROM {entity}")
                rows = cursor.fetchall()
                conn.close()
                self._json(rows)

        except Exception as e:
            self._send_error(str(e), 500)

    # ------------------------------------------------------------
    # POST (login, register, logout, CRUD admin, relações)
    # ------------------------------------------------------------

    def do_POST(self):
        entity, entity_id = self._parse_url()

        # LOGIN
        if entity == "login":
            data = self._body()
            token, user = self.auth.login(data["username"], data["password"])
            if token:
                self._json({"token": token, "user": user})
            else:
                self._send_error("Credenciais inválidas", 401)
            return

        # REGISTRO
        if entity == "register":
            data = self._body()
            new_id = self.auth.register(
                data["username"], data["email"], data["password"]
            )
            if new_id:
                self._json({"id": new_id}, 201)
            else:
                self._send_error("Usuário já existe", 400)
            return

        # LOGOUT
        if entity == "logout":
            token = self._get_token()
            if self.auth.logout(token):
                self._json({"message": "Logout efetuado"})
            else:
                self._send_error("Token inválido")
            return

        # A partir daqui, somente admin
        user = self._require_auth("admin")
        if not user:
            return

        data = self._body()

        try:
            conn = get_connection()
            cursor = conn.cursor()

            # ------------------------------------------------
            # INSERT em tabelas de relação (filme_xxx)
            # payload esperado: {id_filme, id_xxx}
            # ------------------------------------------------
            if entity in RELATION_TABLES:
                movie_col, other_col = RELATION_TABLES[entity]

                if movie_col not in data or other_col not in data:
                    conn.close()
                    self._send_error("Corpo inválido para relação", 400)
                    return

                cursor.execute(
                    f"INSERT INTO {entity} ({movie_col}, {other_col}) VALUES (%s, %s)",
                    (data[movie_col], data[other_col])
                )
                conn.commit()
                conn.close()
                # não temos id artificial; retornamos os próprios campos
                self._json(
                    {movie_col: data[movie_col], other_col: data[other_col]},
                    201
                )
                return

            # ------------------------------------------------
            # INSERT genérico para demais tabelas simples
            # ------------------------------------------------
            cols = list(data.keys())
            vals = list(data.values())
            placeholders = ["%s"] * len(cols)

            cursor.execute(
                f"INSERT INTO {entity} ({','.join(cols)}) VALUES ({','.join(placeholders)})",
                tuple(vals)
            )
            conn.commit()
            new_id = cursor.lastrowid
            conn.close()

            self._json({"id": new_id}, 201)

        except Exception as e:
            self._send_error(str(e), 500)

    # ------------------------------------------------------------
    # PUT
    # ------------------------------------------------------------

    def do_PUT(self):
        entity, entity_id = self._parse_url()
        if not entity_id:
            self._send_error("ID obrigatório")
            return

        user = self._require_auth("admin")
        if not user:
            return

        data = self._body()

        # Não implementamos PUT para tabelas de relação, somente para entidades simples
        if entity in RELATION_TABLES:
            self._send_error("PUT não suportado para relações", 400)
            return

        try:
            conn = get_connection()
            cursor = conn.cursor()

            updates = [f"{k} = %s" for k in data.keys()]
            vals = list(data.values()) + [entity_id]

            cursor.execute(
                f"UPDATE {entity} SET {', '.join(updates)} WHERE id_{entity} = %s",
                tuple(vals)
            )
            conn.commit()
            conn.close()
            self._json({"message": "Atualizado com sucesso"})

        except Exception as e:
            self._send_error(str(e), 500)

    # ------------------------------------------------------------
    # DELETE
    # ------------------------------------------------------------

    def do_DELETE(self):
        entity, entity_id = self._parse_url()
        if not entity_id:
            self._send_error("ID obrigatório")
            return

        user = self._require_auth("admin")
        if not user:
            return

        try:
            conn = get_connection()
            cursor = conn.cursor()

            # ------------------------------------------------
            # DELETE em tabelas de relação:
            # /filme_genero/<id_filme>?remove=<id_genero>
            # ------------------------------------------------
            if entity in RELATION_TABLES:
                parsed = urlparse(self.path)
                qs = parse_qs(parsed.query)
                movie_col, other_col = RELATION_TABLES[entity]
                movie_id = entity_id
                other_ids = qs.get("remove")

                if not other_ids:
                    conn.close()
                    self._send_error("Parâmetro 'remove' obrigatório", 400)
                    return

                other_id = int(other_ids[0])

                cursor.execute(
                    f"DELETE FROM {entity} WHERE {movie_col} = %s AND {other_col} = %s",
                    (movie_id, other_id)
                )
                conn.commit()
                conn.close()
                self._json({"message": "Relação removida"})
                return

            # ------------------------------------------------
            # DELETE genérico em tabelas simples
            # ------------------------------------------------
            cursor.execute(
                f"DELETE FROM {entity} WHERE id_{entity} = %s",
                (entity_id,)
            )
            conn.commit()
            conn.close()
            self._json({"message": "Deletado com sucesso"})

        except Exception as e:
            self._send_error(str(e))


# ================================================================
# INICIALIZAÇÃO DO SERVIDOR
# ================================================================

def run_api(port=8000):
    with socketserver.TCPServer(("", port), FilmAPIHandler) as httpd:
        print(f"API ativa em http://localhost:{port}")
        httpd.serve_forever()


if __name__ == "__main__":
    run_api()
