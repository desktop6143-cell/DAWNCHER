const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// === CORS (muito importante!) ===
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'], // permite o Live Server
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json());
// === SERVIR ARQUIVOS DE VÍDEO (IMPORTANTE!) ===
const path = require('path');

// Serve a pasta ANIMES diretamente na URL /ANIMES
app.use('/ANIMES', express.static(path.join(__dirname, 'ANIMES')));

// Se quiser servir também outros arquivos da pasta atual
app.use(express.static(__dirname));

// === Banco SQLite ===
const db = new sqlite3.Database('./historico.db', (err) => {
    if (err) console.error('Erro ao abrir banco:', err);
    else console.log('Banco SQLite conectado!');
});

// Cria a tabela se não existir
db.run(`CREATE TABLE IF NOT EXISTS historico (
    video_id TEXT PRIMARY KEY,
    titulo TEXT,
    tempo REAL DEFAULT 0,
    ultima_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// === ROTAS ===

// 1. Registrar vídeo no histórico (quando abre o player)
app.post('/historico', (req, res) => {
    const { video_id, titulo } = req.body;

    if (!video_id) return res.status(400).json({ erro: "video_id obrigatório" });

    db.run(`INSERT OR IGNORE INTO historico (video_id, titulo) VALUES (?, ?)`,
        [video_id, titulo || 'Sem título'],
        function (err) {
            if (err) return res.status(500).json({ erro: err.message });
            res.json({ mensagem: "Vídeo registrado no histórico" });
        }
    );
});

// 2. Buscar todo o histórico (para recuperar tempo salvo)
app.get('/historico', (req, res) => {
    db.all("SELECT * FROM historico", [], (err, rows) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(rows);
    });
});

// 3. Atualizar o tempo assistido (chamado a cada 5 segundos)
app.post('/atualizar-tempo', (req, res) => {
    const { video_id, tempo } = req.body;

    if (!video_id || tempo === undefined) {
        return res.status(400).json({ erro: "video_id e tempo são obrigatórios" });
    }

    db.run(`UPDATE historico 
            SET tempo = ?, ultima_atualizacao = CURRENT_TIMESTAMP 
            WHERE video_id = ?`,
        [tempo, video_id],
        function (err) {
            if (err) return res.status(500).json({ erro: err.message });
            res.json({ mensagem: "Tempo atualizado", linhas: this.changes });
        }
    );
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});