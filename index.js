const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json({ limit: '1mb' }));

const db = new sqlite3.Database('./gameData.db', (err) => {
    if (err) console.error(err);
    else {
        console.log('Connected to DB. Applying Balance & Scroll Crafting Update...');
        initializeDatabase();
    }
});

const defaultEquip = '{"helmet":0,"armor":0,"gloves":0,"boots":0,"ring":0}';
const defaultScrolls = '{"F":0,"E":0,"D":0,"C":0,"B":0,"A":0,"S":0,"SS":0,"SSS":0,"UR":0}';

function initializeDatabase() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, level INTEGER DEFAULT 1, exp INTEGER DEFAULT 0, gold INTEGER DEFAULT 100, mana INTEGER DEFAULT 50, max_mana INTEGER DEFAULT 50, hp_potions INTEGER DEFAULT 0, mana_potions INTEGER DEFAULT 0, scrolls TEXT DEFAULT '${defaultScrolls}', cheat_mode INTEGER DEFAULT 0, equipment TEXT DEFAULT '${defaultEquip}'
        )`);

        db.get('SELECT count(*) as count FROM players', (err, row) => {
            if (row && row.count === 0) db.run('INSERT INTO players (id, username) VALUES (1, ?)', ['Hero']);
        });

        db.run(`DROP TABLE IF EXISTS monsters`);
        db.run(`CREATE TABLE monsters (id INTEGER PRIMARY KEY AUTOINCREMENT, family TEXT, type TEXT, combat_style TEXT, base_hp INTEGER, base_atk INTEGER, base_def INTEGER, base_agi INTEGER)`);

        const baseFamilies = [
            { f: 'Goblin', t: 'Attack', style: 'Melee', hp: 50, atk: 12, def: 2, agi: 5 },
            { f: 'Snake', t: 'Attack', style: 'Ranged', hp: 40, atk: 15, def: 1, agi: 10 },
            { f: 'Skeleton', t: 'Defense', style: 'Melee', hp: 100, atk: 5, def: 10, agi: 0 },
            { f: 'Puppy', t: 'Attack', style: 'Melee', hp: 60, atk: 14, def: 4, agi: 12 },
            { f: 'Pixie', t: 'Support', style: 'Ranged', hp: 40, atk: 8, def: 2, agi: 20 },
            { f: 'Imp', t: 'Attack', style: 'Ranged', hp: 45, atk: 14, def: 3, agi: 15 },
            { f: 'Human', t: 'Attack', style: 'Melee', hp: 55, atk: 10, def: 5, agi: 8 },
            { f: 'Slime', t: 'Defense', style: 'Melee', hp: 120, atk: 4, def: 15, agi: 0 },
            { f: 'Insect', t: 'Attack', style: 'Melee', hp: 30, atk: 18, def: 1, agi: 25 },
            { f: 'Golem', t: 'Defense', style: 'Melee', hp: 150, atk: 8, def: 20, agi: 0 },
            { f: 'Fish', t: 'Attack', style: 'Ranged', hp: 45, atk: 12, def: 3, agi: 10 },
            { f: 'Fireball', t: 'Attack', style: 'Ranged', hp: 20, atk: 25, def: 0, agi: 5 },
            { f: 'Sprout', t: 'Support', style: 'Ranged', hp: 80, atk: 5, def: 10, agi: 0 },
            { f: 'Bear', t: 'Defense', style: 'Melee', hp: 110, atk: 9, def: 12, agi: 2 },
            { f: 'Bird', t: 'Support', style: 'Ranged', hp: 45, atk: 11, def: 2, agi: 25 },
            { f: 'Lizard', t: 'Attack', style: 'Melee', hp: 65, atk: 13, def: 8, agi: 8 },
            { f: 'Ghost', t: 'Support', style: 'Ranged', hp: 35, atk: 15, def: 0, agi: 30 },
            { f: 'Plant', t: 'Defense', style: 'Melee', hp: 130, atk: 6, def: 14, agi: 0 },
            { f: 'Rat', t: 'Attack', style: 'Melee', hp: 35, atk: 16, def: 1, agi: 20 },
            { f: 'Orc', t: 'Attack', style: 'Melee', hp: 75, atk: 11, def: 6, agi: 4 },
            { f: 'Troll', t: 'Defense', style: 'Melee', hp: 140, atk: 7, def: 8, agi: 1 },
            { f: 'Elemental', t: 'Attack', style: 'Ranged', hp: 50, atk: 18, def: 4, agi: 10 },
            { f: 'Dragon', t: 'Attack', style: 'Ranged', hp: 90, atk: 20, def: 10, agi: 5 },
            { f: 'Angel', t: 'Support', style: 'Ranged', hp: 70, atk: 10, def: 8, agi: 15 }
        ];

        const stmt = db.prepare('INSERT INTO monsters (family, type, combat_style, base_hp, base_atk, base_def, base_agi) VALUES (?, ?, ?, ?, ?, ?, ?)');
        baseFamilies.forEach(b => { stmt.run(b.f, b.t, b.style, b.hp, b.atk, b.def, b.agi); });
        stmt.finalize();
    });
}

function parsePlayer(row) {
    if (!row) return null;
    if (typeof row.equipment === 'string') {
        try { row.equipment = JSON.parse(row.equipment); } catch (e) { row.equipment = JSON.parse(defaultEquip); }
    }
    if (typeof row.scrolls === 'string') {
        try { row.scrolls = JSON.parse(row.scrolls); } catch (e) { row.scrolls = JSON.parse(defaultScrolls); }
    }
    return row;
}

app.get('/api/player', (req, res) => {
    db.get('SELECT * FROM players LIMIT 1', [], (err, row) => res.json({ player: parsePlayer(row) }));
});

app.post('/api/player/rename', (req, res) => {
    const name = (req.body.name || 'Hero').substring(0, 15);
    db.run('UPDATE players SET username = ? WHERE id = 1', [name], () => {
        db.get('SELECT * FROM players WHERE id = 1', [], (err, row) => res.json({ player: parsePlayer(row) }));
    });
});

app.post('/api/player/cheat', (req, res) => {
    const state = req.body.state ? 1 : 0;
    db.run('UPDATE players SET cheat_mode = ? WHERE id = 1', [state], () => {
        db.get('SELECT * FROM players WHERE id = 1', [], (err, row) => res.json({ player: parsePlayer(row) }));
    });
});

app.post('/api/player/reset', (req, res) => {
    db.run(`UPDATE players SET username='Hero', level=1, exp=0, gold=100, mana=50, max_mana=50, hp_potions=0, mana_potions=0, cheat_mode=0, scrolls=?, equipment=? WHERE id = 1`, [defaultScrolls, defaultEquip], () => {
        res.json({ success: true });
    });
});

app.post('/api/player/sync', (req, res) => {
    const p = req.body;
    db.run(`UPDATE players SET 
        level = ?, exp = ?, gold = ?, mana = ?, max_mana = ?, 
        hp_potions = ?, mana_potions = ?, cheat_mode = ?, scrolls = ?, equipment = ? 
        WHERE id = 1`, 
    [
        p.level, p.exp, p.gold, p.mana, p.max_mana, 
        p.hp_potions, p.mana_potions, p.cheat_mode, JSON.stringify(p.scrolls), JSON.stringify(p.equipment)
    ], () => {
        res.json({ success: true });
    });
});

app.post('/api/battle/win', (req, res) => {
    const g = Number(req.body.goldReward) || 0;
    const m = Number(req.body.manaReward) || 0;
    const e = Number(req.body.expReward) || 0;
    const scrollRank = req.body.scrollRank;

    db.get('SELECT * FROM players WHERE id = 1', [], (err, p) => {
        if (!p) return res.json({ error: "Player not found" });

        let newExp = (Number(p.exp) || 0) + e;
        let newLevel = Number(p.level) || 1;
        while (newExp >= newLevel * 100) {
            newExp -= newLevel * 100;
            newLevel++;
        }

        let scr = {};
        try { scr = JSON.parse(p.scrolls); } catch(err) { scr = JSON.parse(defaultScrolls); }
        if (scrollRank && scr[scrollRank] !== undefined) {
            scr[scrollRank]++;
        }

        db.run(`UPDATE players SET gold = gold + ?, mana = MIN(max_mana, mana + ?), exp = ?, level = ?, scrolls = ? WHERE id = 1`,
            [g, m, newExp, newLevel, JSON.stringify(scr)], () => res.json({ success: true })
        );
    });
});

app.post('/api/inventory/update', (req, res) => {
    const { action, item, cost, equipData, scrollsData } = req.body;
    db.get('SELECT * FROM players WHERE id = 1', [], (err, p) => {
        if (!p) return res.status(500).json({ error: "Player not found" });

        let q = '';
        if (action === 'buy') {
            if (p.cheat_mode === 0 && p.gold < cost) return res.status(400).json({ error: "Not enough gold" });
            const gDed = p.cheat_mode ? 0 : cost;

            if (item === 'hp') q = `UPDATE players SET gold = gold - ${gDed}, hp_potions = hp_potions + 1 WHERE id = 1`;
            else if (item === 'mana') q = `UPDATE players SET gold = gold - ${gDed}, mana_potions = mana_potions + 1 WHERE id = 1`;
            else q = `UPDATE players SET gold = gold - ${gDed}, equipment = '${JSON.stringify(equipData)}' WHERE id = 1`;
        }
        
        if (action === 'use') {
            if (item === 'hp') q = `UPDATE players SET hp_potions = hp_potions - 1 WHERE id = 1 AND hp_potions > 0`;
            if (item === 'mana') q = `UPDATE players SET mana_potions = mana_potions - 1, mana = max_mana WHERE id = 1 AND mana_potions > 0`;
        }

        if (q) {
            db.run(q, [], () => {
                db.get('SELECT * FROM players LIMIT 1', [], (e, row) => res.json({ player: parsePlayer(row) }));
            });
        } else {
            res.json({ player: parsePlayer(p) });
        }
    });
});

app.get('/api/monsters', (req, res) => {
    db.all('SELECT * FROM monsters', [], (err, rows) => res.json({ monsters: rows }));
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
