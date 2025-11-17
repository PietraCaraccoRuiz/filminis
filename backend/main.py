import sqlite3
import json
import http.server
import socketserver
import urllib.parse
import os
import hashlib
import secrets
from datetime import datetime

# =============================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# =============================================

class DatabaseManager:
    def __init__(self, db_path="filmes.db"):
        self.db_path = db_path
    
    def create_database(self):
        """Cria o banco de dados e todas as tabelas"""
        if os.path.exists(self.db_path):
            os.remove(self.db_path)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Tabela de usuários
        cursor.execute('''
            CREATE TABLE usuario (
                id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                senha_hash VARCHAR(255) NOT NULL,
                tipo VARCHAR(10) CHECK(tipo IN ('admin', 'user')) DEFAULT 'user',
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Tabela de sessões para persistência
        cursor.execute('''
            CREATE TABLE sessoes (
                token VARCHAR(32) PRIMARY KEY,
                id_usuario INTEGER NOT NULL,
                data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE genero (
                id_genero INTEGER PRIMARY KEY AUTOINCREMENT,
                nome_genero VARCHAR(100) UNIQUE NOT NULL
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE pais (
                id_pais INTEGER PRIMARY KEY AUTOINCREMENT,
                nome_pais VARCHAR(100) UNIQUE NOT NULL
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE produtora (
                id_produtora INTEGER PRIMARY KEY AUTOINCREMENT,
                nome_produtora VARCHAR(100) UNIQUE NOT NULL
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE linguagem (
                id_linguagem INTEGER PRIMARY KEY AUTOINCREMENT,
                nome_linguagem VARCHAR(100) UNIQUE NOT NULL
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE dublador (
                id_dublador INTEGER PRIMARY KEY AUTOINCREMENT,
                nome VARCHAR(100) NOT NULL,
                sobrenome VARCHAR(100),
                id_pais INTEGER,
                FOREIGN KEY (id_pais) REFERENCES pais(id_pais)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE diretor (
                id_diretor INTEGER PRIMARY KEY AUTOINCREMENT,
                nome VARCHAR(100) NOT NULL,
                sobrenome VARCHAR(100),
                id_pais INTEGER,
                FOREIGN KEY (id_pais) REFERENCES pais(id_pais)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE filme (
                id_filme INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo VARCHAR(255) NOT NULL,
                orcamento REAL,
                tempo_duracao TIME,
                ano INTEGER,
                poster_url VARCHAR(500)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE filme_genero (
                id_filme INTEGER NOT NULL,
                id_genero INTEGER NOT NULL,
                PRIMARY KEY (id_filme, id_genero),
                FOREIGN KEY (id_filme) REFERENCES filme(id_filme),
                FOREIGN KEY (id_genero) REFERENCES genero(id_genero)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE filme_dublador (
                id_filme INTEGER NOT NULL,
                id_dublador INTEGER NOT NULL,
                PRIMARY KEY (id_filme, id_dublador),
                FOREIGN KEY (id_filme) REFERENCES filme(id_filme),
                FOREIGN KEY (id_dublador) REFERENCES dublador(id_dublador)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE filme_diretor (
                id_filme INTEGER NOT NULL,
                id_diretor INTEGER NOT NULL,
                PRIMARY KEY (id_filme, id_diretor),
                FOREIGN KEY (id_filme) REFERENCES filme(id_filme),
                FOREIGN KEY (id_diretor) REFERENCES diretor(id_diretor)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE filme_produtora (
                id_filme INTEGER NOT NULL,
                id_produtora INTEGER NOT NULL,
                PRIMARY KEY (id_filme, id_produtora),
                FOREIGN KEY (id_filme) REFERENCES filme(id_filme),
                FOREIGN KEY (id_produtora) REFERENCES produtora(id_produtora)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE filme_linguagem (
                id_filme INTEGER NOT NULL,
                id_linguagem INTEGER NOT NULL,
                PRIMARY KEY (id_filme, id_linguagem),
                FOREIGN KEY (id_filme) REFERENCES filme(id_filme),
                FOREIGN KEY (id_linguagem) REFERENCES linguagem(id_linguagem)
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE filme_pais (
                id_filme INTEGER NOT NULL,
                id_pais INTEGER NOT NULL,
                PRIMARY KEY (id_filme, id_pais),
                FOREIGN KEY (id_filme) REFERENCES filme(id_filme),
                FOREIGN KEY (id_pais) REFERENCES pais(id_pais)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def _hash_password(self, password):
        """Gera hash da senha"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def populate_sample_data(self):
        """Popula o banco com dados fictícios"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Limpar tabelas existentes (em ordem reversa por causa das FKs)
        tables = [
            'filme_genero', 'filme_diretor', 'filme_dublador', 
            'filme_produtora', 'filme_linguagem', 'filme_pais',
            'filme', 'genero', 'pais', 'produtora', 'linguagem', 
            'dublador', 'diretor', 'sessoes', 'usuario'
        ]
        
        for table in tables:
            try:
                cursor.execute(f"DELETE FROM {table}")
            except:
                pass
        
        # Reset autoincrement
        cursor.execute("DELETE FROM sqlite_sequence")
        
        # Inserir usuários de exemplo
        usuarios = [
            ('admin', 'admin@email.com', self._hash_password('admin123'), 'admin'),
            ('usuario1', 'usuario1@email.com', self._hash_password('user123'), 'user'),
            ('maria', 'maria@email.com', self._hash_password('maria123'), 'user'),
            ('joao', 'joao@email.com', self._hash_password('joao123'), 'user')
        ]
        
        for username, email, senha_hash, tipo in usuarios:
            cursor.execute(
                "INSERT INTO usuario (username, email, senha_hash, tipo) VALUES (?, ?, ?, ?)",
                (username, email, senha_hash, tipo)
            )
        
        # Inserir gêneros
        generos = ['Ação', 'Comédia', 'Drama', 'Ficção Científica', 'Terror', 'Romance', 'Animação', 'Aventura', 'Fantasia', 'Suspense']
        for genero in generos:
            cursor.execute("INSERT INTO genero (nome_genero) VALUES (?)", (genero,))
        
        # Inserir países
        paises = ['Brasil', 'Estados Unidos', 'França', 'Japão', 'Reino Unido', 'Alemanha', 'Itália', 'Canadá', 'Austrália', 'Coreia do Sul']
        for pais in paises:
            cursor.execute("INSERT INTO pais (nome_pais) VALUES (?)", (pais,))
        
        # Inserir produtoras
        produtoras = [
            'Warner Bros', 'Disney', 'Universal', 'Paramount', 'Sony Pictures',
            '20th Century Studios', 'Metro-Goldwyn-Mayer', 'Lionsgate', 'DreamWorks', 'Netflix'
        ]
        for produtora in produtoras:
            cursor.execute("INSERT INTO produtora (nome_produtora) VALUES (?)", (produtora,))
        
        # Inserir linguagens
        linguagens = ['Português', 'Inglês', 'Espanhol', 'Francês', 'Japonês', 'Alemão', 'Italiano', 'Coreano', 'Mandarim', 'Russo']
        for linguagem in linguagens:
            cursor.execute("INSERT INTO linguagem (nome_linguagem) VALUES (?)", (linguagem,))
        
        # Inserir dubladores
        dubladores = [
            ('João', 'Silva', 1), ('Maria', 'Santos', 1), ('Carlos', 'Oliveira', 1), 
            ('Pedro', 'Costa', 1), ('Ana', 'Ferreira', 1), ('John', 'Smith', 2),
            ('Emma', 'Johnson', 2), ('Michael', 'Brown', 2), ('Sarah', 'Davis', 2),
            ('Robert', 'Wilson', 2), ('Pierre', 'Dubois', 3), ('Marie', 'Laurent', 3),
            ('Kenji', 'Tanaka', 4), ('Yuki', 'Sato', 4), ('Hans', 'Müller', 6),
            ('Klaus', 'Schmidt', 6), ('Giovanni', 'Rossi', 7), ('Maria', 'Bianchi', 7)
        ]
        for nome, sobrenome, id_pais in dubladores:
            cursor.execute(
                "INSERT INTO dublador (nome, sobrenome, id_pais) VALUES (?, ?, ?)",
                (nome, sobrenome, id_pais)
            )
        
        # Inserir diretores
        diretores = [
            ('Pedro', 'Almeida', 1), ('Ana', 'Costa', 1), ('Carlos', 'Mendes', 1),
            ('Steven', 'Spielberg', 2), ('Christopher', 'Nolan', 5), ('James', 'Cameron', 2),
            ('Quentin', 'Tarantino', 2), ('Martin', 'Scorsese', 2), ('Hayao', 'Miyazaki', 4),
            ('Alfred', 'Hitchcock', 5), ('Tim', 'Burton', 2), ('Ridley', 'Scott', 5),
            ('Claude', 'Chabrol', 3), ('Luc', 'Besson', 3), ('Wong', 'Kar-wai', 9),
            ('Park', 'Chan-wook', 10), ('Federico', 'Fellini', 7), ('Roberto', 'Benigni', 7)
        ]
        for nome, sobrenome, id_pais in diretores:
            cursor.execute(
                "INSERT INTO diretor (nome, sobrenome, id_pais) VALUES (?, ?, ?)",
                (nome, sobrenome, id_pais)
            )
        
        # Inserir filmes
        filmes = [
            ('O Aventureiro', 50000000, '02:15:00', 2020, 'https://br.web.img3.acsta.net/pictures/14/10/06/18/23/355297.jpg'),
            ('Um Amor em Paris', 30000000, '01:45:00', 2019, 'https://br.web.img3.acsta.net/pictures/14/07/22/12/22/409138.jpg'),
            ('Guerra nas Estrelas', 200000000, '02:30:00', 2021, 'https://cdn.cineart.com.br/vibezz_993051148.jpg'),
            ('O Segredo', 25000000, '01:55:00', 2018, 'https://br.web.img3.acsta.net/pictures/20/03/12/16/31/4145074.jpg'),
            ('Noite de Terror', 15000000, '01:40:00', 2022, 'https://br.web.img3.acsta.net/img/ef/d3/efd3cc219ec876e4599b8975908e5ee4.jpg'),
            ('Riso Contagiante', 35000000, '01:50:00', 2020, 'https://coolturalblog.wordpress.com/wp-content/uploads/2013/07/patch-adams-dvd-inlay1.jpg?w=640'),
            ('Viagem Fantástica', 80000000, '02:05:00', 2021, 'https://br.web.img3.acsta.net/c_310_420/pictures/16/01/08/18/44/096148.jpg'),
            ('Coração de Herói', 60000000, '02:20:00', 2019, 'https://i.redd.it/yktee1raqq9f1.jpeg'),
            ('Mistério Final', 28000000, '01:48:00', 2023, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTpFfNhiN2MHmB_N6r0LKxhEDg7tX_86yHZzw&s'),
            ('Amizade Eterna', 22000000, '01:42:00', 2020, 'https://m.media-amazon.com/images/S/pv-target-images/7df79814385acf9542d7621fc0b86a1fd89cc91c5c41b04ae4ef33051f54ef3a.jpg')
        ]
        for titulo, orcamento, tempo_duracao, ano, poster_url in filmes:
            cursor.execute(
                "INSERT INTO filme (titulo, orcamento, tempo_duracao, ano, poster_url) VALUES (?, ?, ?, ?, ?)",
                (titulo, orcamento, tempo_duracao, ano, poster_url)
            )
        
        # =============================================
        # POPULAR TABELAS DE RELACIONAMENTO
        # =============================================
        
        # Relacionamentos Filme-Gênero
        filme_genero_relacoes = [
            (1, 1), (1, 8),  # O Aventureiro: Ação, Aventura
            (2, 3), (2, 6),  # Amor em Paris: Drama, Romance
            (3, 4), (3, 1), (3, 8),  # Guerra nas Estrelas: Ficção Científica, Ação, Aventura
            (4, 3), (4, 10),  # O Segredo: Drama, Suspense
            (5, 5), (5, 10),  # Noite de Terror: Terror, Suspense
            (6, 2), (6, 8),  # Riso Contagiante: Comédia, Aventura
            (7, 4), (7, 9), (7, 8),  # Viagem Fantástica: Ficção Científica, Fantasia, Aventura
            (8, 1), (8, 3), (8, 8),  # Coração de Herói: Ação, Drama, Aventura
            (9, 10), (9, 3),  # Mistério Final: Suspense, Drama
            (10, 3), (10, 6)  # Amizade Eterna: Drama, Romance
        ]
        for filme_id, genero_id in filme_genero_relacoes:
            cursor.execute("INSERT INTO filme_genero VALUES (?, ?)", (filme_id, genero_id))
        
        # Relacionamentos Filme-Diretor
        filme_diretor_relacoes = [
            (1, 1),   # O Aventureiro - Pedro Almeida
            (2, 2),   # Amor em Paris - Ana Costa
            (3, 4),   # Guerra nas Estrelas - Steven Spielberg
            (4, 3),   # O Segredo - Carlos Mendes
            (5, 10),  # Noite de Terror - Alfred Hitchcock
            (6, 11),  # Riso Contagiante - Tim Burton
            (7, 6),   # Viagem Fantástica - James Cameron
            (8, 5),   # Coração de Herói - Christopher Nolan
            (9, 16),  # Mistério Final - Park Chan-wook
            (10, 17)  # Amizade Eterna - Federico Fellini
        ]
        for filme_id, diretor_id in filme_diretor_relacoes:
            cursor.execute("INSERT INTO filme_diretor VALUES (?, ?)", (filme_id, diretor_id))
        
        # Relacionamentos Filme-Dublador
        filme_dublador_relacoes = [
            (1, 1), (1, 2), (1, 6),   # O Aventureiro
            (2, 3), (2, 4), (2, 12),  # Amor em Paris
            (3, 6), (3, 7), (3, 8), (3, 13),  # Guerra nas Estrelas
            (4, 5), (4, 9),           # O Segredo
            (5, 10), (5, 11), (5, 14),  # Noite de Terror
            (6, 1), (6, 3), (6, 15),   # Riso Contagiante
            (7, 7), (7, 8), (7, 16),   # Viagem Fantástica
            (8, 2), (8, 6), (8, 17),   # Coração de Herói
            (9, 10), (9, 18),          # Mistério Final
            (10, 4), (10, 5)           # Amizade Eterna
        ]
        for filme_id, dublador_id in filme_dublador_relacoes:
            cursor.execute("INSERT INTO filme_dublador VALUES (?, ?)", (filme_id, dublador_id))
        
        # Relacionamentos Filme-Produtora
        filme_produtora_relacoes = [
            (1, 1), (1, 3),   # O Aventureiro - Warner Bros, Universal
            (2, 4),           # Amor em Paris - Paramount
            (3, 2), (3, 5),   # Guerra nas Estrelas - Disney, Sony Pictures
            (4, 7),           # O Segredo - Metro-Goldwyn-Mayer
            (5, 8),           # Noite de Terror - Lionsgate
            (6, 9),           # Riso Contagiante - DreamWorks
            (7, 3), (7, 6),   # Viagem Fantástica - Universal, 20th Century
            (8, 1), (8, 4),   # Coração de Herói - Warner Bros, Paramount
            (9, 10),          # Mistério Final - Netflix
            (10, 5)           # Amizade Eterna - Sony Pictures
        ]
        for filme_id, produtora_id in filme_produtora_relacoes:
            cursor.execute("INSERT INTO filme_produtora VALUES (?, ?)", (filme_id, produtora_id))
        
        # Relacionamentos Filme-Linguagem
        filme_linguagem_relacoes = [
            (1, 1), (1, 2),           # O Aventureiro: Português, Inglês
            (2, 1), (2, 2), (2, 4),   # Amor em Paris: Português, Inglês, Francês
            (3, 2), (3, 5),           # Guerra nas Estrelas: Inglês, Japonês
            (4, 1), (4, 2),           # O Segredo: Português, Inglês
            (5, 2), (5, 6),           # Noite de Terror: Inglês, Alemão
            (6, 1), (6, 2), (6, 3),   # Riso Contagiante: Português, Inglês, Espanhol
            (7, 2), (7, 8),           # Viagem Fantástica: Inglês, Coreano
            (8, 2), (8, 7),           # Coração de Herói: Inglês, Italiano
            (9, 2), (9, 8), (9, 9),   # Mistério Final: Inglês, Coreano, Mandarim
            (10, 1), (10, 2), (10, 7) # Amizade Eterna: Português, Inglês, Italiano
        ]
        for filme_id, linguagem_id in filme_linguagem_relacoes:
            cursor.execute("INSERT INTO filme_linguagem VALUES (?, ?)", (filme_id, linguagem_id))
        
        # Relacionamentos Filme-País
        filme_pais_relacoes = [
            (1, 1), (1, 2),           # O Aventureiro: Brasil, EUA
            (2, 1), (2, 3),           # Amor em Paris: Brasil, França
            (3, 2), (3, 4), (3, 5),   # Guerra nas Estrelas: EUA, Japão, Reino Unido
            (4, 1), (4, 2),           # O Segredo: Brasil, EUA
            (5, 2), (5, 6),           # Noite de Terror: EUA, Alemanha
            (6, 1), (6, 2), (6, 3),   # Riso Contagiante: Brasil, EUA, França
            (7, 2), (7, 8), (7, 10),  # Viagem Fantástica: EUA, Canadá, Coreia do Sul
            (8, 2), (8, 5), (8, 7),   # Coração de Herói: EUA, Reino Unido, Itália
            (9, 10), (9, 9),          # Mistério Final: Coreia do Sul, Austrália
            (10, 1), (10, 7)          # Amizade Eterna: Brasil, Itália
        ]
        for filme_id, pais_id in filme_pais_relacoes:
            cursor.execute("INSERT INTO filme_pais VALUES (?, ?)", (filme_id, pais_id))
        
        conn.commit()
        conn.close()
        print("Banco de dados populado com sucesso!")

# =============================================
# SISTEMA DE AUTENTICAÇÃO
# =============================================

class AuthManager:
    def __init__(self, db_path="filmes.db"):
        self.db_path = db_path
    
    def _hash_password(self, password):
        """Gera hash da senha"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def login(self, username, password):
        """Faz login e retorna token de sessão"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id_usuario, username, email, tipo FROM usuario WHERE username = ? AND senha_hash = ?",
            (username, self._hash_password(password))
        )
        
        user = cursor.fetchone()
        
        if user:
            token = secrets.token_hex(16)
            
            cursor.execute(
                "INSERT INTO sessoes (token, id_usuario) VALUES (?, ?)",
                (token, user[0])
            )
            
            user_data = {
                'id_usuario': user[0],
                'username': user[1],
                'email': user[2],
                'tipo': user[3]
            }
            
            conn.commit()
            conn.close()
            return token, user_data
        
        conn.close()
        return None, None
    
    def verify_token(self, token):
        """Verifica se o token é válido no banco de dados"""
        if not token:
            return None
            
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT u.id_usuario, u.username, u.email, u.tipo 
            FROM usuario u
            JOIN sessoes s ON u.id_usuario = s.id_usuario
            WHERE s.token = ?
        ''', (token,))
        
        user = cursor.fetchone()
        conn.close()
        
        if user:
            return {
                'id_usuario': user[0],
                'username': user[1],
                'email': user[2],
                'tipo': user[3]
            }
        return None
    
    def logout(self, token):
        """Faz logout removendo a sessão do banco"""
        if not token:
            return False
            
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM sessoes WHERE token = ?", (token,))
        affected = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        return affected > 0
    
    def register_user(self, username, email, password, tipo='user'):
        """Registra novo usuário"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                "INSERT INTO usuario (username, email, senha_hash, tipo) VALUES (?, ?, ?, ?)",
                (username, email, self._hash_password(password), tipo)
            )
            user_id = cursor.lastrowid
            conn.commit()
            conn.close()
            return user_id
        except sqlite3.IntegrityError:
            conn.close()
            return None

# =============================================
# API HTTP ATUALIZADA COM RELACIONAMENTOS
# =============================================

class FilmAPIHandler(http.server.BaseHTTPRequestHandler):
    
    def __init__(self, *args, **kwargs):
        self.auth_manager = AuthManager()
        super().__init__(*args, **kwargs)
    
    def _get_token_from_header(self):
        """Extrai token do header Authorization"""
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            return auth_header[7:].strip()
        return None
    
    def _require_auth(self, required_type=None):
        """Verifica autenticação e permissões"""
        token = self._get_token_from_header()
        
        if not token:
            self._send_error('Token não fornecido', 401)
            return None
        
        user = self.auth_manager.verify_token(token)
        
        if not user:
            self._send_error('Token inválido ou expirado', 401)
            return None
        
        if required_type and user['tipo'] != required_type:
            self._send_error('Acesso negado. Permissões insuficientes.', 403)
            return None
        
        return user
    
    def _set_headers(self, status_code=200, content_type='application/json'):
        self.send_response(status_code)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def do_OPTIONS(self):
        self._set_headers(200)
    
    def _parse_path(self):
        path_parts = self.path.strip('/').split('/')
        entity = path_parts[0] if len(path_parts) > 0 else ''
        entity_id = int(path_parts[1]) if len(path_parts) > 1 and path_parts[1].isdigit() else None
        sub_entity = path_parts[2] if len(path_parts) > 2 else None
        sub_entity_id = int(path_parts[3]) if len(path_parts) > 3 and path_parts[3].isdigit() else None
        return entity, entity_id, sub_entity, sub_entity_id
    
    def _get_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            body = self.rfile.read(content_length)
            return json.loads(body.decode('utf-8'))
        return {}
    
    def _send_json_response(self, data, status_code=200):
        self._set_headers(status_code)
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def _send_error(self, message, status_code=400):
        """Envia erro em formato JSON"""
        try:
            self._set_headers(status_code)
            error_response = {'error': message}
            self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
        except Exception as e:
            self.send_response(status_code)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Error: {message}".encode('utf-8'))
    
    def do_GET(self):
        entity, entity_id, sub_entity, sub_entity_id = self._parse_path()
        
        # Endpoints públicos
        if entity == 'login':
            self._send_json_response({
                'message': 'Use POST /login para autenticar',
                'usuarios_exemplo': [
                    {'username': 'admin', 'password': 'admin123', 'tipo': 'admin'},
                    {'username': 'usuario1', 'password': 'user123', 'tipo': 'user'}
                ]
            })
            return
        
        if not entity:
            self._send_json_response({
                'message': 'API de Filmes - CRUD Completo',
                'endpoints_publicos': ['POST /login', 'POST /register', 'POST /logout'],
                'endpoints_autenticados': [
                    'GET /filme', 'GET /genero', 'GET /pais', 'GET /produtora', 
                    'GET /linguagem', 'GET /dublador', 'GET /diretor',
                    'GET /filme_genero', 'GET /filme_diretor', 'GET /filme_dublador',
                    'GET /filme_produtora', 'GET /filme_linguagem', 'GET /filme_pais'
                ],
                'endpoints_admin': [
                    'POST, PUT, DELETE em todas as entidades'
                ]
            })
            return
        
        # Para leitura (GET), apenas autenticação básica é necessária
        user = self._require_auth()
        if not user:
            return
        
        try:
            conn = sqlite3.connect('filmes.db')
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Verificar se é uma tabela de relacionamento
            if entity.startswith('filme_'):
                # Endpoints para relacionamentos
                if entity_id and sub_entity and sub_entity_id:
                    # GET /filme_genero/1/1 - Buscar relação específica
                    cursor.execute(f"SELECT * FROM {entity} WHERE id_filme = ? AND {sub_entity} = ?", 
                                 (entity_id, sub_entity_id))
                    row = cursor.fetchone()
                    if row:
                        self._send_json_response(dict(row))
                    else:
                        self._send_error('Relação não encontrada', 404)
                elif entity_id:
                    # GET /filme_genero/1 - Buscar todas as relações de um filme
                    cursor.execute(f"SELECT * FROM {entity} WHERE id_filme = ?", (entity_id,))
                    rows = cursor.fetchall()
                    self._send_json_response([dict(row) for row in rows])
                else:
                    # GET /filme_genero - Buscar todas as relações
                    cursor.execute(f"SELECT * FROM {entity}")
                    rows = cursor.fetchall()
                    self._send_json_response([dict(row) for row in rows])
            else:
                # Endpoints normais para entidades
                if entity_id:
                    cursor.execute(f"SELECT * FROM {entity} WHERE id_{entity} = ?", (entity_id,))
                    row = cursor.fetchone()
                    if row:
                        self._send_json_response(dict(row))
                    else:
                        self._send_error(f'{entity.capitalize()} não encontrado', 404)
                else:
                    cursor.execute(f"SELECT * FROM {entity}")
                    rows = cursor.fetchall()
                    self._send_json_response([dict(row) for row in rows])
            
            conn.close()
        except Exception as e:
            self._send_error(str(e), 500)
    
    def do_POST(self):
        entity, entity_id, sub_entity, sub_entity_id = self._parse_path()
        
        # Endpoints de autenticação (públicos)
        if entity == 'login':
            self._handle_login()
            return
        elif entity == 'register':
            self._handle_register()
            return
        elif entity == 'logout':
            self._handle_logout()
            return
        
        # Para outras operações POST, verificar se é admin
        user = self._require_auth('admin')
        if not user:
            return
        
        if entity_id:
            self._send_error('ID não permitido em POST', 400)
            return
        
        try:
            data = self._get_body()
            conn = sqlite3.connect('filmes.db')
            cursor = conn.cursor()
            
            # Verificar se é uma tabela de relacionamento
            if entity.startswith('filme_'):
                # POST para relacionamentos - espera id_filme e id_<entidade>
                required_fields = ['id_filme', f'id_{entity.replace("filme_", "")}']
                for field in required_fields:
                    if field not in data:
                        conn.close()
                        self._send_error(f'Campo {field} é obrigatório', 400)
                        return
                
                # Verificar se a relação já existe
                cursor.execute(f"SELECT 1 FROM {entity} WHERE id_filme = ? AND {required_fields[1]} = ?", 
                             (data['id_filme'], data[required_fields[1]]))
                if cursor.fetchone():
                    conn.close()
                    self._send_error('Relação já existe', 400)
                    return
                
                # Inserir relação
                columns = ['id_filme', required_fields[1]]
                placeholders = ['?', '?']
                values = [data['id_filme'], data[required_fields[1]]]
                
                query = f"INSERT INTO {entity} ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
                cursor.execute(query, values)
                new_id = f"{data['id_filme']}_{data[required_fields[1]]}"
                
                conn.commit()
                conn.close()
                
                self._send_json_response({'id': new_id, 'message': f'Relação criada com sucesso'}, 201)
            else:
                # POST normal para entidades
                columns = []
                placeholders = []
                values = []
                
                for key, value in data.items():
                    if key.startswith('id_'):
                        continue
                    columns.append(key)
                    placeholders.append('?')
                    values.append(value)
                
                query = f"INSERT INTO {entity} ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
                cursor.execute(query, values)
                new_id = cursor.lastrowid
                
                conn.commit()
                conn.close()
                
                self._send_json_response({'id': new_id, 'message': f'{entity.capitalize()} criado com sucesso'}, 201)
        
        except Exception as e:
            self._send_error(str(e), 500)

    def do_PUT(self):
        entity, entity_id, sub_entity, sub_entity_id = self._parse_path()
        
        # Para operações PUT, verificar se é admin
        user = self._require_auth('admin')
        if not user:
            return
        
        if not entity_id:
            self._send_error('ID obrigatório para PUT', 400)
            return
        
        try:
            data = self._get_body()
            conn = sqlite3.connect('filmes.db')
            cursor = conn.cursor()
            
            # Verificar se é uma tabela de relacionamento
            if entity.startswith('filme_'):
                # PUT para relacionamentos - atualizar relação específica
                if sub_entity_id:
                    relation_field = f'id_{entity.replace("filme_", "")}'
                    
                    # Verificar se a relação existe
                    cursor.execute(f"SELECT 1 FROM {entity} WHERE id_filme = ? AND {relation_field} = ?", 
                                 (entity_id, sub_entity_id))
                    if not cursor.fetchone():
                        conn.close()
                        self._send_error('Relação não encontrada', 404)
                        return
                    
                    # Para relacionamentos, geralmente não faz sentido atualizar, apenas criar/deletar
                    # Mas podemos permitir atualização se necessário
                    set_clause = []
                    values = []
                    
                    for key, value in data.items():
                        if key in ['id_filme', relation_field]:
                            continue  # Não permitir atualizar as chaves primárias
                        set_clause.append(f"{key} = ?")
                        values.append(value)
                    
                    if set_clause:
                        values.extend([entity_id, sub_entity_id])
                        query = f"UPDATE {entity} SET {', '.join(set_clause)} WHERE id_filme = ? AND {relation_field} = ?"
                        cursor.execute(query, values)
                    else:
                        conn.close()
                        self._send_error('Nenhum campo válido para atualização', 400)
                        return
                else:
                    conn.close()
                    self._send_error('ID da relação é obrigatório para PUT', 400)
                    return
            else:
                # PUT normal para entidades
                cursor.execute(f"SELECT 1 FROM {entity} WHERE id_{entity} = ?", (entity_id,))
                if not cursor.fetchone():
                    conn.close()
                    self._send_error(f'{entity.capitalize()} não encontrado', 404)
                    return
                
                set_clause = []
                values = []
                
                for key, value in data.items():
                    if key == f'id_{entity}':
                        continue  # Não atualizar a chave primária
                    set_clause.append(f"{key} = ?")
                    values.append(value)
                
                values.append(entity_id)
                query = f"UPDATE {entity} SET {', '.join(set_clause)} WHERE id_{entity} = ?"
                cursor.execute(query, values)
            
            conn.commit()
            conn.close()
            
            self._send_json_response({'message': f'{entity.capitalize()} atualizado com sucesso'})
        
        except Exception as e:
            self._send_error(str(e), 500)
    
    def do_DELETE(self):
        entity, entity_id, sub_entity, sub_entity_id = self._parse_path()
        
        # Para operações DELETE, verificar se é admin
        user = self._require_auth('admin')
        if not user:
            return
        
        if not entity_id:
            self._send_error('ID obrigatório para DELETE', 400)
            return
        
        try:
            conn = sqlite3.connect('filmes.db')
            cursor = conn.cursor()
            
            # Verificar se é uma tabela de relacionamento
            if entity.startswith('filme_'):
                if sub_entity_id:
                    # DELETE /filme_genero/1/1 - Deletar relação específica
                    relation_field = f'id_{entity.replace("filme_", "")}'
                    cursor.execute(f"SELECT 1 FROM {entity} WHERE id_filme = ? AND {relation_field} = ?", 
                                 (entity_id, sub_entity_id))
                    if not cursor.fetchone():
                        conn.close()
                        self._send_error('Relação não encontrada', 404)
                        return
                    
                    cursor.execute(f"DELETE FROM {entity} WHERE id_filme = ? AND {relation_field} = ?", 
                                 (entity_id, sub_entity_id))
                else:
                    # DELETE /filme_genero/1 - Deletar todas as relações de um filme
                    cursor.execute(f"SELECT 1 FROM {entity} WHERE id_filme = ?", (entity_id,))
                    if not cursor.fetchone():
                        conn.close()
                        self._send_error('Nenhuma relação encontrada', 404)
                        return
                    
                    cursor.execute(f"DELETE FROM {entity} WHERE id_filme = ?", (entity_id,))
            else:
                # DELETE normal para entidades
                cursor.execute(f"SELECT 1 FROM {entity} WHERE id_{entity} = ?", (entity_id,))
                if not cursor.fetchone():
                    conn.close()
                    self._send_error(f'{entity.capitalize()} não encontrado', 404)
                    return
                
                cursor.execute(f"DELETE FROM {entity} WHERE id_{entity} = ?", (entity_id,))
            
            conn.commit()
            conn.close()
            
            self._send_json_response({'message': f'{entity.capitalize()} deletado com sucesso'})
        
        except Exception as e:
            self._send_error(str(e), 500)
    
    def _handle_login(self):
        """Manipula requisições de login"""
        try:
            data = self._get_body()
            username = data.get('username')
            password = data.get('password')
            
            if not username or not password:
                self._send_error('Username e password são obrigatórios', 400)
                return
            
            token, user_data = self.auth_manager.login(username, password)
            
            if token:
                self._send_json_response({
                    'token': token,
                    'user': user_data,
                    'message': 'Login realizado com sucesso'
                })
            else:
                self._send_error('Credenciais inválidas', 401)
        
        except Exception as e:
            self._send_error(f'Erro no login: {str(e)}', 500)
    
    def _handle_register(self):
        """Manipula requisições de registro"""
        try:
            data = self._get_body()
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            
            if not username or not email or not password:
                self._send_error('Username, email e password são obrigatórios', 400)
                return
            
            user_id = self.auth_manager.register_user(username, email, password)
            
            if user_id:
                self._send_json_response({
                    'id': user_id,
                    'message': 'Usuário registrado com sucesso'
                }, 201)
            else:
                self._send_error('Username ou email já existem', 400)
        
        except Exception as e:
            self._send_error(str(e), 500)
    
    def _handle_logout(self):
        """Manipula requisições de logout"""
        token = self._get_token_from_header()
        if token and self.auth_manager.logout(token):
            self._send_json_response({'message': 'Logout realizado com sucesso'})
        else:
            self._send_error('Token inválido', 400)

# =============================================
# EXECUÇÃO DO PROGRAMA
# =============================================

def run_api_server(port=8000):
    """Executa o servidor da API"""
    with socketserver.TCPServer(("", port), FilmAPIHandler) as httpd:
        print(f"API rodando em http://localhost:{port}")
        print("\n=== SISTEMA DE AUTENTICAÇÃO ===")
        print("Usuários de exemplo criados:")
        print("  Admin: username='admin', password='admin123'")
        print("  User:  username='usuario1', password='user123'")
        print("\n=== ENDPOINTS DISPONÍVEIS ===")
        print("Entidades: filme, genero, pais, produtora, linguagem, dublador, diretor")
        print("Relacionamentos: filme_genero, filme_diretor, filme_dublador, filme_produtora, filme_linguagem, filme_pais")
        print("\n=== EXEMPLOS DE USO ===")
        print("GET /filme_genero/1 - Buscar gêneros do filme 1")
        print("POST /filme_genero - Adicionar gênero ao filme")
        print("DELETE /filme_genero/1/1 - Remover gênero 1 do filme 1")
        print("\nPressione Ctrl+C para parar o servidor")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor parado")

def main():
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "init":
        print("Criando banco de dados...")
        db_manager = DatabaseManager()
        db_manager.create_database()
        db_manager.populate_sample_data()
        print("Banco de dados criado e populado com sucesso!")
        print("Arquivo: filmes.db")
    else:
        if not os.path.exists("filmes.db"):
            print("Banco de dados não encontrado. Execute primeiro:")
            print("python main.py init")
            return
        
        print("Iniciando servidor API...")
        run_api_server()

if __name__ == "__main__":
    main()