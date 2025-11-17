import json
import http.server
import socketserver
import hashlib
import datetime
import jwt
import mysql.connector
from decimal import Decimal

# ===========================================
# CONFIG
# ===========================================

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
    "filme", "genero", "pais", "produtora", "linguagem",
    "dublador", "diretor", "usuario",
    "filme_genero", "filme_dublador", "filme_diretor",
    "filme_produtora", "filme_linguagem", "filme_pais"
}

RELATIONS = {
    "filme_genero": ("id_filme", "id_genero"),
    "filme_dublador": ("id_filme", "id_dublador"),
    "filme_diretor": ("id_filme", "id_diretor"),
    "filme_produtora": ("id_filme", "id_produtora"),
    "filme_linguagem": ("id_filme", "id_linguagem"),
    "filme_pais": ("id_filme", "id_pais"),
}


# ===========================================
# JSON SANITIZER
# ===========================================

def json_clean(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, datetime.time):
        return obj.strftime("%H:%M:%S")
    if isinstance(obj, bytes):
        return obj.decode()
    return obj


# ===========================================
# JWT
# ===========================================

def create_jwt(payload):
    payload = dict(payload)
    payload["exp"] = datetime.datetime.utcnow() + datetime.timedelta(
        minutes=TOKEN_EXPIRATION_MIN
    )
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_jwt(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except:
        return None


# ===========================================
# DB WRAPPER
# ===========================================

class DB:
    def __init__(self, config):
        self.config = config

    def connect(self):
        return mysql.connector.connect(**self.config)

    def hash(self, pwd):
        return hashlib.sha256(pwd.encode()).hexdigest()


db = DB(MYSQL_CONFIG)


# ===========================================
# API
# ===========================================

class API(http.server.BaseHTTPRequestHandler):

    # ---------------------------------------
    # Helpers
    # ---------------------------------------
    def _headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.end_headers()

    def _json(self, data, status=200):
        self._headers(status)
        self.wfile.write(json.dumps(data, default=json_clean).encode("utf-8"))

    def _body(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length == 0:
                return {}
            return json.loads(self.rfile.read(length).decode())
        except:
            return {}

    def _token(self):
        h = self.headers.get("Authorization")
        if h and h.startswith("Bearer "):
            return h[7:]
        return None

    def _auth(self, admin=False):
        token = self._token()
        if not token:
            return None, "Token ausente"

        data = decode_jwt(token)
        if not data:
            return None, "Token inválido"

        if admin and data.get("tipo") != "admin":
            return None, "Apenas admin"

        return data, None

    def _parse(self):
        parts = self.path.strip("/").split("/")
        entity = parts[0] if parts else ""
        eid = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else None
        sid = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else None
        return entity, eid, sid

    # ---------------------------------------
    # OPTIONS
    # ---------------------------------------
    def do_OPTIONS(self):
        self._headers()

    # ---------------------------------------
    # GET
    # ---------------------------------------
    def do_GET(self):
        entity, eid, sid = self._parse()

        if entity == "":
            return self._json({"status": "online"})

        if entity == "login":
            return self._json({"use": "POST /login"})

        if entity == "me":
            user, err = self._auth()
            if err:
                return self._json({"error": err}, 401)

            conn = db.connect()
            cur = conn.cursor(dictionary=True)
            cur.execute(
                "SELECT id_usuario, username, email, tipo FROM usuario WHERE id_usuario=%s",
                (user["id_usuario"],)
            )
            row = cur.fetchone()
            conn.close()

            return self._json({"user": row})

        # GET requires auth
        user, err = self._auth()
        if err:
            return self._json({"error": err}, 401)

        if entity not in ALLOWED_ENTITIES:
            return self._json({"error": "entidade inválida"}, 404)

        conn = db.connect()
        cur = conn.cursor(dictionary=True)

        try:
            if entity in RELATIONS:
                fk1, fk2 = RELATIONS[entity]
                if eid and sid:
                    cur.execute(
                        f"SELECT * FROM {entity} WHERE {fk1}=%s AND {fk2}=%s",
                        (eid, sid),
                    )
                    return self._json(cur.fetchone() or {})

                if eid:
                    cur.execute(f"SELECT * FROM {entity} WHERE {fk1}=%s", (eid,))
                    return self._json(cur.fetchall())

                cur.execute(f"SELECT * FROM {entity}")
                return self._json(cur.fetchall())

            # simple entity
            if eid:
                cur.execute(
                    f"SELECT * FROM {entity} WHERE id_{entity}=%s",
                    (eid,),
                )
                return self._json(cur.fetchone() or {})

            cur.execute(f"SELECT * FROM {entity}")
            return self._json(cur.fetchall())

        except Exception as e:
            return self._json({"error": str(e)}, 500)
        finally:
            conn.close()

    # ---------------------------------------
    # POST
    # ---------------------------------------
    def do_POST(self):
        entity, eid, sid = self._parse()
        body = self._body()

        # LOGIN
        if entity == "login":
            username = body.get("username")
            password = body.get("password")

            conn = db.connect()
            cur = conn.cursor(dictionary=True)
            cur.execute("SELECT * FROM usuario WHERE username=%s", (username,))
            user = cur.fetchone()
            conn.close()

            if not user or user["senha_hash"] != db.hash(password):
                return self._json({"error": "Credenciais inválidas"}, 401)

            token = create_jwt(user)

            return self._json({"token": token, "user": user})

        # LOGOUT
        if entity == "logout":
            return self._json({"status": "ok"})

        # all other POST require admin
        user, err = self._auth(admin=True)
        if err:
            return self._json({"error": err}, 401)

        if entity not in ALLOWED_ENTITIES:
            return self._json({"error": "entidade inválida"}, 404)

        conn = db.connect()
        cur = conn.cursor()

        try:
            if entity in RELATIONS:
                fk1, fk2 = RELATIONS[entity]
                cur.execute(
                    f"INSERT INTO {entity} ({fk1},{fk2}) VALUES (%s,%s)",
                    (body[fk1], body[fk2]),
                )
                conn.commit()
                return self._json({"message": "ok"}, 201)

            cols = list(body.keys())
            vals = [body[k] for k in cols]
            placeholders = ",".join(["%s"] * len(vals))

            cur.execute(
                f"INSERT INTO {entity} ({','.join(cols)}) VALUES ({placeholders})",
                vals,
            )
            conn.commit()

            return self._json({"message": "criado", "id": cur.lastrowid}, 201)

        except Exception as e:
            return self._json({"error": str(e)}, 500)
        finally:
            conn.close()

    # ---------------------------------------
    # PUT
    # ---------------------------------------
    def do_PUT(self):
        entity, eid, sid = self._parse()
        body = self._body()

        user, err = self._auth(admin=True)
        if err:
            return self._json({"error": err}, 401)

        conn = db.connect()
        cur = conn.cursor()

        try:
            set_sql = ", ".join([f"{k}=%s" for k in body.keys()])
            values = list(body.values()) + [eid]

            cur.execute(
                f"UPDATE {entity} SET {set_sql} WHERE id_{entity}=%s",
                values,
            )
            conn.commit()

            return self._json({"message": "atualizado"})

        except Exception as e:
            return self._json({"error": str(e)}, 500)
        finally:
            conn.close()

    # ---------------------------------------
    # DELETE
    # ---------------------------------------
    def do_DELETE(self):
        entity, eid, sid = self._parse()

        user, err = self._auth(admin=True)
        if err:
            return self._json({"error": err}, 401)

        conn = db.connect()
        cur = conn.cursor()

        try:
            if entity in RELATIONS:
                fk1, fk2 = RELATIONS[entity]

                if sid:
                    cur.execute(
                        f"DELETE FROM {entity} WHERE {fk1}=%s AND {fk2}=%s",
                        (eid, sid)
                    )
                else:
                    cur.execute(
                        f"DELETE FROM {entity} WHERE {fk1}=%s",
                        (eid,)
                    )
                conn.commit()
                return self._json({"message": "deletado"})

            cur.execute(
                f"DELETE FROM {entity} WHERE id_{entity}=%s",
                (eid,),
            )
            conn.commit()

            return self._json({"message": "deletado"})

        except Exception as e:
            return self._json({"error": str(e)}, 500)
        finally:
            conn.close()


# ===========================================
# MAIN
# ===========================================

def main():
    PORT = 8000
    with socketserver.TCPServer(("", PORT), API) as httpd:
        print(f"🔥 API rodando em http://localhost:{PORT}")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
