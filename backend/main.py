import mysql.connector
import json
import http.server
import socketserver
import hashlib
import secrets

# =============================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# =============================================

MYSQL_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "1234",
    "database": "filminis"
}

def get_connection():
    return mysql.connector.connect(
        host=MYSQL_CONFIG["host"],
        user=MYSQL_CONFIG["user"],
        password=MYSQL_CONFIG["password"],
        database=MYSQL_CONFIG["database"]
    )

# =============================================
# AUTH MANAGER
# =============================================

class AuthManager:
    def _hash_password(self, password):
        return hashlib.sha256(password.encode()).hexdigest()

    def login(self, username, password):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM usuario WHERE username = %s AND senha_hash = %s",
            (username, self._hash_password(password))
        )

        user = cursor.fetchone()
        if user:
            token = secrets.token_hex(16)

            cursor.execute(
                "INSERT INTO sessoes (token, id_usuario) VALUES (%s, %s)",
                (token, user["id_usuario"])
            )
            conn.commit()
            conn.close()
            return token, user

        conn.close()
        return None, None

    def verify_token(self, token):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT u.* 
            FROM usuario u
            JOIN sessoes s ON u.id_usuario = s.id_usuario
            WHERE s.token = %s
        """, (token,))

        user = cursor.fetchone()
        conn.close()
        return user

    def logout(self, token):
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sessoes WHERE token = %s", (token,))
        affected = cursor.rowcount
        conn.commit()
        conn.close()
        return affected > 0

    def register_user(self, username, email, password, tipo="user"):
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO usuario (username, email, senha_hash, tipo) 
                VALUES (%s, %s, %s, %s)
            """, (username, email, self._hash_password(password), tipo))
            conn.commit()
            return cursor.lastrowid
        except:
            return None
        finally:
            conn.close()

# =============================================
# API HANDLER
# =============================================

class FilmAPIHandler(http.server.BaseHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        self.auth_manager = AuthManager()
        super().__init__(*args, **kwargs)

    # ==============================
    # HELPERS
    # ==============================

    def _get_token(self):
        auth = self.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            return auth[7:]
        return None

    def _require_auth(self, required_type=None):
        token = self._get_token()
        if not token:
            self._send_error("Token não fornecido", 401)
            return None

        user = self.auth_manager.verify_token(token)
        if not user:
            self._send_error("Token inválido", 401)
            return None

        if required_type and user["tipo"] != required_type:
            self._send_error("Acesso negado", 403)
            return None

        return user

    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.end_headers()

    def _send_json(self, data, status=200):
        self._set_headers(status)
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    def _send_error(self, msg, status=400):
        self._send_json({"error": msg}, status)

    def _parse_url(self):
        path = self.path.strip("/").split("/")
        entity = path[0] if len(path) > 0 else None
        entity_id = int(path[1]) if len(path) > 1 and path[1].isdigit() else None
        return entity, entity_id

    def _get_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        return json.loads(self.rfile.read(length))

    # =============================================
    # OPTIONS (CORS)
    # =============================================
    def do_OPTIONS(self):
        self._set_headers()

    # =============================================
    # GET
    # =============================================
    def do_GET(self):
        entity, entity_id = self._parse_url()

        # 🔥 NOVO ENDPOINT PRA VALIDAR SESSÃO
        if entity == "login-check":
            user = self._require_auth()
            if user:
                self._send_json({"user": user})
            return

        if entity == "login":
            self._send_json({"message": "Use POST /login"})
            return

        # Autenticação obrigatória
        user = self._require_auth()
        if not user:
            return

        try:
            conn = get_connection()
            cursor = conn.cursor(dictionary=True)

            if entity_id:
                cursor.execute(f"SELECT * FROM {entity} WHERE id_{entity} = %s", (entity_id,))
                row = cursor.fetchone()
                if row:
                    self._send_json(row)
                else:
                    self._send_error("Não encontrado", 404)
            else:
                cursor.execute(f"SELECT * FROM {entity}")
                rows = cursor.fetchall()
                self._send_json(rows)

            conn.close()
        except Exception as e:
            self._send_error(str(e), 500)

    # =============================================
    # POST
    # =============================================
    def do_POST(self):
        entity, entity_id = self._parse_url()

        # -------- LOGIN ---------
        if entity == "login":
            data = self._get_body()
            token, user = self.auth_manager.login(data["username"], data["password"])
            if token:
                self._send_json({"token": token, "user": user})
            else:
                self._send_error("Credenciais inválidas", 401)
            return

        # -------- REGISTER ---------
        if entity == "register":
            data = self._get_body()
            new_id = self.auth_manager.register_user(
                data["username"], data["email"], data["password"]
            )
            if new_id:
                self._send_json({"id": new_id}, 201)
            else:
                self._send_error("Usuário já existe", 400)
            return

        # -------- LOGOUT ---------
        if entity == "logout":
            token = self._get_token()
            if self.auth_manager.logout(token):
                self._send_json({"message": "Logout OK"})
            else:
                self._send_error("Token inválido")
            return

        # Autorização de ADMIN
        user = self._require_auth("admin")
        if not user:
            return

        data = self._get_body()

        try:
            conn = get_connection()
            cursor = conn.cursor()

            cols = []
            vals = []
            placeholders = []

            for k, v in data.items():
                cols.append(k)
                vals.append(v)
                placeholders.append("%s")

            cursor.execute(
                f"INSERT INTO {entity} ({','.join(cols)}) VALUES ({','.join(placeholders)})",
                tuple(vals)
            )

            conn.commit()
            self._send_json({"id": cursor.lastrowid}, 201)
            conn.close()

        except Exception as e:
            self._send_error(str(e), 500)

    # =============================================
    # PUT
    # =============================================
    def do_PUT(self):
        entity, entity_id = self._parse_url()

        if not entity_id:
            self._send_error("ID obrigatório")
            return

        user = self._require_auth("admin")
        if not user:
            return

        data = self._get_body()

        try:
            conn = get_connection()
            cursor = conn.cursor()

            updates = []
            vals = []

            for k, v in data.items():
                updates.append(f"{k} = %s")
                vals.append(v)

            vals.append(entity_id)

            cursor.execute(
                f"UPDATE {entity} SET {', '.join(updates)} WHERE id_{entity} = %s",
                tuple(vals)
            )

            conn.commit()
            conn.close()
            self._send_json({"message": "Atualizado com sucesso"})

        except Exception as e:
            self._send_error(str(e), 500)

    # =============================================
    # DELETE
    # =============================================
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

            cursor.execute(f"DELETE FROM {entity} WHERE id_{entity} = %s", (entity_id,))
            conn.commit()
            conn.close()

            self._send_json({"message": "Deletado com sucesso"})

        except Exception as e:
            self._send_error(str(e))


# =============================================
# SERVER
# =============================================

def run_api(port=8000):
    with socketserver.TCPServer(("", port), FilmAPIHandler) as httpd:
        print(f"🔥 API rodando em: http://localhost:{port}")
        print("Endpoint novo: GET /login-check")
        httpd.serve_forever()


if __name__ == "__main__":
    run_api()
