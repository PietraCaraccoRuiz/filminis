import json
import http.server
import socketserver
import hashlib
import datetime
import jwt
import mysql.connector

# ============================================================
# CONFIG MYSQL
# ============================================================

MYSQL_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "root",
    "database": "filminis",
}

SECRET_KEY = "SEGREDO_SUPER_CASCUDO_IGUAL_SENHA_DE_WIFI_DE_EMPRESA"
ALGORITHM = "HS256"
TOKEN_EXPIRATION_MIN = 120

ALLOWED_ENTITIES = {
    "filme",
    "genero",
    "pais",
    "produtora",
    "linguagem",
    "dublador",
    "diretor",
    "usuario",
    "filme_genero",
    "filme_dublador",
    "filme_diretor",
    "filme_produtora",
    "filme_linguagem",
    "filme_pais",
}

RELATION_TABLES = {
    "filme_genero": ("id_filme", "id_genero"),
    "filme_dublador": ("id_filme", "id_dublador"),
    "filme_diretor": ("id_filme", "id_diretor"),
    "filme_produtora": ("id_filme", "id_produtora"),
    "filme_linguagem": ("id_filme", "id_linguagem"),
    "filme_pais": ("id_filme", "id_pais"),
}


# ============================================================
# JWT
# ============================================================

def create_jwt(payload: dict) -> str:
    payload = dict(payload)
    payload["exp"] = datetime.datetime.utcnow() + datetime.timedelta(minutes=TOKEN_EXPIRATION_MIN)
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token.decode("utf-8") if isinstance(token, bytes) else token


def decode_jwt(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except:
        return None


# ============================================================
# DB WRAPPER
# ============================================================

class DB:
    def __init__(self, config):
        self.config = config

    def connect(self, with_database=True):
        cfg = dict(self.config)
        if not with_database:
            cfg.pop("database", None)
        return mysql.connector.connect(**cfg)

    def hash_password(self, pwd):
        return hashlib.sha256(pwd.encode()).hexdigest()

    def init_schema_and_data(self):
        conn = self.connect(with_database=False)
        cur = conn.cursor()
        cur.execute("CREATE DATABASE IF NOT EXISTS filminis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        conn.commit()
        cur.close()
        conn.close()

        conn = self.connect()
        cur = conn.cursor()

        # --- DROP SAFE ---
        cur.execute("SET FOREIGN_KEY_CHECKS = 0;")
        drop_order = [
            "filme_genero",
            "filme_dublador",
            "filme_diretor",
            "filme_produtora",
            "filme_linguagem",
            "filme_pais",
            "filme",
            "genero",
            "pais",
            "produtora",
            "linguagem",
            "dublador",
            "diretor",
            "usuario",
        ]
        for t in drop_order:
            cur.execute(f"DROP TABLE IF EXISTS {t}")
        cur.execute("SET FOREIGN_KEY_CHECKS = 1;")

        # --- TABELAS ---
        cur.execute("""
            CREATE TABLE usuario (
                id_usuario INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                senha_hash VARCHAR(255) NOT NULL,
                tipo ENUM('admin','user') DEFAULT 'user'
            );
        """)

        cur.execute("""
            CREATE TABLE genero (
                id_genero INT AUTO_INCREMENT PRIMARY KEY,
                nome_genero VARCHAR(100) UNIQUE NOT NULL
            );
        """)

        cur.execute("""
            CREATE TABLE pais (
                id_pais INT AUTO_INCREMENT PRIMARY KEY,
                nome_pais VARCHAR(100) UNIQUE NOT NULL
            );
        """)

        cur.execute("""
            CREATE TABLE produtora (
                id_produtora INT AUTO_INCREMENT PRIMARY KEY,
                nome_produtora VARCHAR(100) UNIQUE NOT NULL
            );
        """)

        cur.execute("""
            CREATE TABLE linguagem (
                id_linguagem INT AUTO_INCREMENT PRIMARY KEY,
                nome_linguagem VARCHAR(100) UNIQUE NOT NULL
            );
        """)

        cur.execute("""
            CREATE TABLE dublador (
                id_dublador INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(100),
                sobrenome VARCHAR(100),
                id_pais INT,
                FOREIGN KEY (id_pais) REFERENCES pais(id_pais)
                    ON DELETE SET NULL ON UPDATE CASCADE
            );
        """)

        cur.execute("""
            CREATE TABLE diretor (
                id_diretor INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(100),
                sobrenome VARCHAR(100),
                id_pais INT,
                FOREIGN KEY (id_pais) REFERENCES pais(id_pais)
                    ON DELETE SET NULL ON UPDATE CASCADE
            );
        """)

        cur.execute("""
            CREATE TABLE filme (
                id_filme INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(255) NOT NULL,
                orcamento DECIMAL(15,2),
                tempo_duracao TIME,
                ano INT,
                poster_url VARCHAR(500)
            );
        """)

        # --- RELAÇÕES ---
        for table, (fk1, fk2) in RELATION_TABLES.items():
            cur.execute(f"""
                CREATE TABLE {table}(
                    {fk1} INT,
                    {fk2} INT,
                    PRIMARY KEY ({fk1},{fk2}),
                    FOREIGN KEY ({fk1}) REFERENCES filme(id_filme) ON DELETE CASCADE ON UPDATE CASCADE,
                    FOREIGN KEY ({fk2}) REFERENCES {fk2[3:]}({fk2}) ON DELETE CASCADE ON UPDATE CASCADE
                );
            """)

        # --- POPULAR DADOS ---
        cur.executemany("INSERT INTO usuario (username,email,senha_hash,tipo) VALUES (%s,%s,%s,%s)", [
            ("admin", "admin@email.com", self.hash_password("admin123"), "admin"),
            ("usuario1", "usuario1@email.com", self.hash_password("user123"), "user"),
        ])

        cur.executemany("INSERT INTO genero (nome_genero) VALUES (%s)", [(g,) for g in [
            "Ação", "Comédia", "Drama", "Ficção Científica", "Terror"
        ]])

        cur.executemany("INSERT INTO pais (nome_pais) VALUES (%s)", [(p,) for p in [
            "Brasil", "Estados Unidos", "França"
        ]])

        cur.executemany("INSERT INTO produtora (nome_produtora) VALUES (%s)", [(p,) for p in [
            "Warner Bros", "Disney", "Universal"
        ]])

        cur.executemany("INSERT INTO linguagem (nome_linguagem) VALUES (%s)", [(l,) for l in [
            "Português", "Inglês", "Espanhol"
        ]])

        # um filme básico
        cur.execute("""
            INSERT INTO filme (titulo, orcamento, tempo_duracao, ano, poster_url)
            VALUES ('Filme Teste', 1000000, '01:40:00', 2023, 'https://image.com/img.jpg')
        """)

        conn.commit()
        conn.close()
        print("🏁 Banco MySQL criado e populado com sucesso.")


db = DB(MYSQL_CONFIG)

# ============================================================
# HTTP HANDLER
# ============================================================

class API(http.server.BaseHTTPRequestHandler):

    def _headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.end_headers()

    def _json(self, data, status=200):
        self._headers(status)
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def _body(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length == 0:
                return {}
            raw = self.rfile.read(length).decode()
            return json.loads(raw or "{}")
        except:
            return {}

    def _get_token(self):
        h = self.headers.get("Authorization")
        if not h or not h.startswith("Bearer "):
            return None
        return h[7:]

    def _require_auth(self, require_admin=False):
        token = self._get_token()
        if not token:
            return None, "Token ausente"

        data = decode_jwt(token)
        if not data:
            return None, "Token inválido ou expirado"

        if require_admin and data.get("tipo") != "admin":
            return None, "Apenas admins podem fazer isso"

        return data, None

    def _parse_path(self):
        parts = self.path.split("?")[0].strip("/").split("/")
        if not parts or parts[0] == "":
            return "", None, None, None
        entity = parts[0]
        entity_id = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else None
        sub = parts[2] if len(parts) > 2 else None
        sub_id = int(parts[3]) if len(parts) > 3 and parts[3].isdigit() else None
        return entity, entity_id, sub, sub_id

    # OPTIONS
    def do_OPTIONS(self):
        self._headers()

    # POST
    def do_POST(self):
        entity, eid, sub, subid = self._parse_path()

        if entity == "login":
            return self._handle_login()
        if entity == "register":
            return self._handle_register()
        if entity == "logout":
            return self._json({"message": "OK"})

        user, err = self._require_auth(require_admin=True)
        if err:
            return self._json({"error": err}, 401)

        if entity not in ALLOWED_ENTITIES:
            return self._json({"error": "Entidade inválida"}, 404)

        body = self._body()
        conn = db.connect()
        cur = conn.cursor()

        try:
            if entity in RELATION_TABLES:
                fk1, fk2 = RELATION_TABLES[entity]
                cur.execute(f"INSERT INTO {entity} ({fk1},{fk2}) VALUES (%s,%s)", (body[fk1], body[fk2]))
                conn.commit()
                return self._json({"message": "Relação criada"}, 201)

            cols = [k for k in body.keys()]
            vals = [body[k] for k in cols]
            placeholders = ",".join(["%s"] * len(cols))
            cur.execute(f"INSERT INTO {entity} ({','.join(cols)}) VALUES ({placeholders})", vals)
            conn.commit()
            return self._json({"message": "Criado com sucesso"}, 201)

        except Exception as e:
            return self._json({"error": str(e)}, 500)
        finally:
            conn.close()

    # GET
    def do_GET(self):
        entity, eid, sub, subid = self._parse_path()

        if entity == "":
            return self._json({"status": "API OK"})

        if entity == "login":
            return self._json({"message": "Use POST /login"})

        user, err = self._require_auth()
        if err:
            return self._json({"error": err}, 401)

        if entity not in ALLOWED_ENTITIES:
            return self._json({"error": "Entidade inválida"}, 404)

        conn = db.connect()
        cur = conn.cursor(dictionary=True)

        try:
            if entity in RELATION_TABLES:
                fk1, fk2 = RELATION_TABLES[entity]
                if eid and subid:
                    cur.execute(f"SELECT * FROM {entity} WHERE {fk1}=%s AND {fk2}=%s", (eid, subid))
                    row = cur.fetchone()
                    return self._json(row or {})

                if eid:
                    cur.execute(f"SELECT * FROM {entity} WHERE {fk1}=%s", (eid,))
                    return self._json(cur.fetchall())

                cur.execute(f"SELECT * FROM {entity}")
                return self._json(cur.fetchall())

            if eid:
                cur.execute(f"SELECT * FROM {entity} WHERE id_{entity}=%s", (eid,))
                row = cur.fetchone()
                return self._json(row or {})

            cur.execute(f"SELECT * FROM {entity}")
            return self._json(cur.fetchall())

        except Exception as e:
            return self._json({"error": str(e)}, 500)
        finally:
            conn.close()

    # PUT
    def do_PUT(self):
        entity, eid, _, _ = self._parse_path()
        user, err = self._require_auth(require_admin=True)
        if err:
            return self._json({"error": err}, 401)

        body = self._body()
        conn = db.connect()
        cur = conn.cursor()

        try:
            set_sql = ", ".join([f"{k}=%s" for k in body.keys()])
            vals = list(body.values()) + [eid]
            cur.execute(f"UPDATE {entity} SET {set_sql} WHERE id_{entity}=%s", vals)
            conn.commit()
            return self._json({"message": "Atualizado"})
        except Exception as e:
            return self._json({"error": str(e)}, 500)
        finally:
            conn.close()

    # DELETE
    def do_DELETE(self):
        entity, eid, sub, subid = self._parse_path()
        user, err = self._require_auth(require_admin=True)
        if err:
            return self._json({"error": err}, 401)

        conn = db.connect()
        cur = conn.cursor()

        try:
            if entity in RELATION_TABLES:
                fk1, fk2 = RELATION_TABLES[entity]
                if subid:
                    cur.execute(f"DELETE FROM {entity} WHERE {fk1}=%s AND {fk2}=%s",
                                (eid, subid))
                else:
                    cur.execute(f"DELETE FROM {entity} WHERE {fk1}=%s", (eid,))
                conn.commit()
                return self._json({"message": "Relação deletada"})

            cur.execute(f"DELETE FROM {entity} WHERE id_{entity}=%s", (eid,))
            conn.commit()
            return self._json({"message": "Deletado"})

        except Exception as e:
            return self._json({"error": str(e)}, 500)
        finally:
            conn.close()

    # LOGIN
    def _handle_login(self):
        body = self._body()
        username = body.get("username")
        password = body.get("password")

        if not username or not password:
            return self._json({"error": "credenciais obrigatórias"}, 400)

        conn = db.connect()
        cur = conn.cursor(dictionary=True)

        cur.execute("SELECT * FROM usuario WHERE username=%s", (username,))
        user = cur.fetchone()
        conn.close()

        if not user or user["senha_hash"] != db.hash_password(password):
            return self._json({"error": "Credenciais inválidas"}, 401)

        token = create_jwt({
            "id_usuario": user["id_usuario"],
            "username": user["username"],
            "email": user["email"],
            "tipo": user["tipo"],
        })

        return self._json({"token": token, "user": user})

    # REGISTER
    def _handle_register(self):
        body = self._body()
        username = body.get("username")
        email = body.get("email")
        password = body.get("password")

        if not username or not email or not password:
            return self._json({"error": "campos obrigatórios"}, 400)

        conn = db.connect()
        cur = conn.cursor()

        try:
            cur.execute(
                "INSERT INTO usuario (username,email,senha_hash) VALUES (%s,%s,%s)",
                (username, email, db.hash_password(password)),
            )
            conn.commit()
            return self._json({"message": "Usuário registrado"})
        except mysql.connector.IntegrityError:
            return self._json({"error": "Usuário ou email já existem"}, 400)
        finally:
            conn.close()


# ============================================================
# MAIN
# ============================================================

def main():
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "init":
        db.init_schema_and_data()
        return

    PORT = 8000
    with socketserver.TCPServer(("", PORT), API) as httpd:
        print(f"🔥 API rodando em http://localhost:{PORT}")
        print("Usuário admin: admin / admin123")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
