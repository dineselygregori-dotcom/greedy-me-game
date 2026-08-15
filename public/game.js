// @ts-nocheck
document.addEventListener('contextmenu', event => event.preventDefault());

const defaultScrolls = {"F":0,"E":0,"D":0,"C":0,"B":0,"A":0,"S":0,"SS":0,"SSS":0,"UR":0};
let player = { username: 'Hero', level: 1, exp: 0, gold: 100, mana: 50, max_mana: 50, hp_potions: 0, mana_potions: 0, scrolls: {...defaultScrolls}, cheat_mode: 0, equipment: { helmet: 0, armor: 0, gloves: 0, boots: 0, ring: 0 } };
let baseMonsters = [];
let battleActive = false;
let battleInterval = null;
let battleSpeed = 1;
let lvlMult = 1;
let isPaused = false;
let isAuto = true;
const mults = [1, 10, 20, 50, 100];

let playerUnits = new Array(25).fill(null);
let enemyUnits = new Array(25).fill(null);
let stage = 1;
let waveCount = 1;

let selectingCellIndex = -1;
let selectedUnitIndex = -1;
let movingUnitIndex = -1;

const rankOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'UR'];

// Specific Rank Up Requirements requested by user
const rankUpReqs = {
    'E': { g: 1000, m: 200, s: 5 },
    'D': { g: 10000, m: 1000, s: 10 },
    'C': { g: 100000, m: 2000, s: 20 },
    'B': { g: 500000, m: 4000, s: 30 },
    'A': { g: 1000000, m: 8000, s: 40 },
    'S': { g: 5000000, m: 16000, s: 50 },
    'SS': { g: 10000000, m: 32000, s: 60 },
    'SSS': { g: 50000000, m: 64000, s: 70 },
    'UR': { g: 100000000, m: 128000, s: 100 }
};

const evoPaths = {
    'Goblin': { names: ['Goblin', 'Hobgoblin', 'Goblin Warrior', 'Goblin Berserker', 'Goblin Raider', 'Goblin General', 'Goblin Commander', 'Goblin King', 'Goblin Emperor'], icons: ['👺', '👺', '👹', '👹', '👹', '🧌', '🧌', '🧌', '👑'] },
    'Snake': { names: ['Snake', 'Viper', 'Python', 'Cobra', 'Basilisk', 'Hydra', 'Leviathan', 'Orochi', 'Nine Head Dragon'], icons: ['🐍', '🐍', '🐍', '🐍', '🦎', '🐉', '🐉', '🐉', '🐲'] },
    'Skeleton': { names: ['Skeleton', 'Skeleton Guard', 'Skeleton Knight', 'Skeleton Captain', 'Dullahan', 'Lich', 'Bone Dragon', 'Death Lord', 'Undead King'], icons: ['💀', '💀', '💀', '💀', '👽', '🧙‍♂️', '🐉', '☠️', '👑'] },
    'Puppy': { names: ['Puppy', 'Hellhound', 'Dire Wolf', 'Shadow Wolf', 'Fenrir', 'Orthrus', 'Cerberus', 'Manticore', 'Chimera'], icons: ['🐕', '🐕‍🦺', '🐺', '🐺', '🐺', '🦁', '🦁', '🐯', '🐉'] },
    'Pixie': { names: ['Pixie', 'Sprite', 'Fairy', 'Sylph', 'Nymph', 'Dryad', 'Valkyrie', 'Angel', 'Goddess'], icons: ['🦋', '🦋', '🧚', '🧚', '🧜‍♀️', '🧝‍♀️', '👼', '👼', '👑'] },
    'Imp': { names: ['Imp', 'Fiend', 'Gargoyle', 'Demon', 'Archdemon', 'Balrog', 'Diablo', 'Devil', 'Death Scythe'], icons: ['🦇', '🦇', '👿', '👿', '😈', '😈', '👺', '👹', '☠️'] },
    'Human': { names: ['Peasant', 'Militia', 'Swordsman', 'Knight', 'Paladin', 'Holy Knight', 'Hero', 'King', 'Demi-God'], icons: ['🧑‍🌾', '💂', '🗡️', '🤺', '🏇', '🥷', '🦸‍♂️', '🤴', '👼'] },
    'Slime': { names: ['Slime', 'Big Slime', 'Giant Slime', 'King Slime', 'Acid Slime', 'Magma Slime', 'Crystal Slime', 'Divine Slime', 'Cosmic Slime'], icons: ['💧', '🧊', '🫧', '🧪', '🟢', '🟡', '🔴', '💎', '🌌'] },
    'Insect': { names: ['Grub', 'Larva', 'Worker', 'Soldier', 'Elite', 'Guard', 'Queen', 'Empress', 'Hive Mind'], icons: ['🐛', '🐛', '🐜', '🪲', '🪳', '🕷️', '🦂', '🦗', '🦋'] },
    'Golem': { names: ['Mud Golem', 'Clay Golem', 'Stone Golem', 'Iron Golem', 'Steel Golem', 'Mithril Golem', 'Adamantite Golem', 'Orichalcum Golem', 'Titan'], icons: ['🪨', '🧱', '🗿', '🔩', '⚙️', '🛡️', '💎', '🕋', '⛩️'] },
    'Fish': { names: ['Minnow', 'Salmon', 'Koi', 'Shark', 'Sea Serpent', 'Leviathan', 'Kraken', 'Ocean Lord', 'Poseidon'], icons: ['🐟', '🐠', '🐡', '🐬', '🦈', '🐋', '🦑', '🐙', '🐉'] },
    'Fireball': { names: ['Spark', 'Flame', 'Fireball', 'Fireblast', 'Inferno', 'Hellfire', 'Solar Flare', 'Supernova', 'Big Bang'], icons: ['🪔', '🕯️', '🔥', '☄️', '💥', '🌋', '☀️', '🌟', '💫'] },
    'Sprout': { names: ['Seedling', 'Sapling', 'Tree', 'Elder Tree', 'Treant', 'Guardian Treant', 'World Tree', 'Yggdrasil', 'Nature Goddess'], icons: ['🌱', '🌿', '☘️', '🌳', '🌲', '🌴', '🎋', '⛩️', '🌌'] },
    'Bear': { names: ['Cub', 'Brown Bear', 'Grizzly Bear', 'Cave Bear', 'Dire Bear', 'Armored Bear', 'Rune Bear', 'Ursa Major', 'Behemoth'], icons: ['🧸', '🐻', '🐻', '🐻', '🐻‍❄️', '🛡️', '🐾', '🌟', '👹'] },
    'Bird': { names: ['Chick', 'Finch', 'Crow', 'Raven', 'Eagle', 'Falcon', 'Griffin', 'Thunderbird', 'Phoenix'], icons: ['🐣', '🐤', '🐦', '🐦‍⬛', '🦅', '🦅', '🦁', '⚡', '🔥'] },
    'Lizard': { names: ['Gecko', 'Iguana', 'Chameleon', 'Monitor', 'Komodo', 'Raptor', 'Drake', 'Wyvern', 'Bahamut'], icons: ['🦎', '🦎', '🦎', '🦎', '🦖', '🦖', '🐉', '🐉', '🐲'] },
    'Ghost': { names: ['Wisp', 'Spirit', 'Ghost', 'Specter', 'Wraith', 'Phantom', 'Banshee', 'Reaper', 'Soul King'], icons: ['💨', '👻', '👻', '👻', '🌫️', '🌫️', '🧟', '☠️', '👑'] },
    'Plant': { names: ['Spore', 'Weed', 'Vine', 'Thorn', 'Bramble', 'Carnivore Plant', 'Mandrake', 'Overgrowth', 'Gaia'], icons: ['🍄', '🌾', '🌿', '🥀', '🌹', '🌺', '🌵', '🌲', '🌍'] },
    'Rat': { names: ['Mouse', 'Rat', 'Giant Rat', 'Plague Rat', 'Dire Rat', 'Mutant Rat', 'Rat King', 'Rat Emperor', 'Vermin God'], icons: ['🐭', '🐁', '🐀', '🐀', '🐀', '🦠', '👑', '👑', '👹'] },
    'Orc': { names: ['Orc Peon', 'Orc Grunt', 'Orc Warrior', 'Orc Shaman', 'Orc Warlord', 'Orc Chieftain', 'Orc King', 'Orc Emperor', 'Orc God'], icons: ['🧌', '🧌', '🧌', '🧙‍♂️', '🧌', '🧌', '👑', '👑', '👹'] },
    'Troll': { names: ['Troll Whelp', 'Troll', 'Cave Troll', 'Forest Troll', 'Mountain Troll', 'Ice Troll', 'Fire Troll', 'Troll King', 'Troll Titan'], icons: ['🧟', '🧟', '🧟', '🧟', '🧟', '🧊', '🔥', '👑', '🗻'] },
    'Elemental': { names: ['Dust', 'Breeze', 'Spark', 'Ripple', 'Earth Element', 'Wind Element', 'Fire Element', 'Water Element', 'Avatar'], icons: ['✨', '💨', '🔥', '💧', '🪨', '🌪️', '🌋', '🌊', '🌌'] },
    'Dragon': { names: ['Hatchling', 'Whelp', 'Drake', 'Wyrm', 'Dragon', 'Elder Dragon', 'Ancient Dragon', 'Aspect', 'Dragon God'], icons: ['🥚', '🦎', '🐉', '🐉', '🐲', '🐲', '🌋', '🌟', '🌌'] },
    'Angel': { names: ['Cherub', 'Seraph', 'Angel', 'Archangel', 'Principality', 'Throne', 'Dominion', 'Virtue', 'Seraphim'], icons: ['👼', '👼', '👼', '🧚', '🕊️', '🛡️', '⚖️', '⚔️', '👑'] }
};

function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => {});
    else if (document.exitFullscreen) document.exitFullscreen();
}

async function init() {
    await fetchPlayer();
    await fetchMonsters();

    setInterval(() => {
        let maxM = 50 + (Number(player.level) * 10);
        player.max_mana = maxM;
        
        let regen = 1 + ((player.equipment?.ring || 0) * 10);
        let cur = Number(player.mana) || 0;
        
        if (cur < maxM) {
            player.mana = Math.min(maxM, cur + regen);
            updateUI();
        }
    }, 1000);
}

function syncSave() {
    if (!player) return;
    fetch('/api/player/sync', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(player)
    });
}

async function fetchPlayer() {
    try {
        const res = await fetch('/api/player');
        const data = await res.json();
        if (data.player) {
            player = data.player;
            if(!player.scrolls || typeof player.scrolls !== 'object') player.scrolls = {...defaultScrolls};
            updateUI();
            renderEquipGrid();
            renderShop();
            renderBagScrolls();
        }
    } catch (e) {}
}

async function fetchMonsters() {
    try {
        const res = await fetch('/api/monsters');
        const data = await res.json();
        if (data.monsters) {
            baseMonsters = data.monsters;
            populateBag();
        }
    } catch (e) {}
}

function getMaxSummons() { return 2 + Math.floor((Number(player.level) || 1) / 10); }
function getHeroDef() { return ((player.equipment?.helmet || 0) * 10) + ((player.equipment?.armor || 0) * 25) + ((player.equipment?.boots || 0) * 10) + ((player.equipment?.gloves || 0) * 5); }
function getHeroAgi() { return 10 + ((player.equipment?.boots || 0) * 5); }

// Exponential Level Up Cost Formula requested by User
function getLvlCost(lvl) {
    if (lvl === 1) return 100;
    if (lvl === 2) return 200;
    if (lvl === 3) return 300;
    if (lvl === 4) return 500;
    if (lvl === 5) return 1000;
    return Math.floor(1000 * Math.pow(1.15, lvl - 5));
}
function getMultiLvlCost(startLvl, mult) {
    let total = 0;
    for (let i = 0; i < mult; i++) total += getLvlCost(startLvl + i);
    return total;
}

function updateHeroStats() {
    if (!playerUnits[12]) return;
    let bHp = 1000, bAtk = 50;
    let bDef = getHeroDef(), bAgi = getHeroAgi();

    playerUnits.forEach((u, i) => {
        if (u && i !== 12) {
            bHp += u.maxHp * 0.20; 
            bAtk += u.atk * 0.20;
            bDef += u.def * 0.20;
        }
    });

    playerUnits[12].maxHp = bHp;
    playerUnits[12].atk = bAtk;
    playerUnits[12].def = bDef;
    playerUnits[12].agi = bAgi;
    if (playerUnits[12].hp > bHp) playerUnits[12].hp = bHp;
}

function updateUI() {
    const el = (id, val) => {
        const target = document.getElementById(id);
        if (target) target.textContent = val;
    };
    el('pName', player.cheat_mode ? '[GOD] ' + player.username : player.username);
    el('pLevel', player.level);
    el('pExp', player.exp);
    el('pMaxExp', player.level * 100);
    
    el('pMana', player.cheat_mode ? '∞' : Math.floor(player.mana || 0));
    el('pGold', player.cheat_mode ? '∞' : Math.floor(player.gold || 0));

    el('hudHpPot', player.hp_potions || 0);
    el('hudManaPot', player.mana_potions || 0);

    el('statDef', getHeroDef());
    el('statAgi', getHeroAgi() + '%');
    const regen = 1 + ((player.equipment?.ring || 0) * 10);
    el('statRegen', `+${regen}/s`);
    el('statSummons', getMaxSummons());

    const currentSummons = playerUnits.filter(u => u && !u.isHero).length;
    el('summonLimitTxt', `Summons: ${currentSummons}/${getMaxSummons()}`);
}

// --- SETTINGS & CHEATS ---
function openSettings() { document.getElementById('settingsPanel').style.display = 'flex'; }

function renameHero() {
    const name = prompt("Type new Hero Name.\nType 'CHEAT ON' to toggle God Mode.");
    if (!name || name.trim().length === 0) return;
    
    if (name === 'CHEAT ON') { player.cheat_mode = 1; updateUI(); syncSave(); alert("God Mode ON!"); return; }
    if (name === 'CHEAT OFF') { player.cheat_mode = 0; updateUI(); syncSave(); alert("God Mode OFF!"); return; }

    player.username = name.substring(0, 15);
    updateUI();
    syncSave();
}

async function hardReset() {
    if (confirm("WARNING: Erase all progress, gold, items, and levels? This cannot be undone.")) {
        const res = await fetch('/api/player/reset', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            window.location.reload(true);
        }
    }
}

function renderEquipGrid() {
    const grid = document.getElementById('equipGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const slots = [
        { key: 'helmet', icon: '🪖' }, { key: 'armor', icon: '👕' },
        { key: 'gloves', icon: '🧤' }, { key: 'boots', icon: '🥾' },
        { key: 'ring', icon: '💍' }
    ];

    slots.forEach(s => {
        let lvl = player.equipment ? (player.equipment[s.key] || 0) : 0;
        const hasItem = lvl > 0;
        const rClass = hasItem ? `b-${rankOrder[Math.min(8, lvl - 1)]}` : '';
        grid.innerHTML += `<div class="equip-slot ${hasItem ? 'active' : ''} ${rClass}">${s.icon}</div>`;
    });
}

function openPanel(id) {
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    document.getElementById(id).style.display = 'flex';
    if (id === 'campaignPanel') startBattle();
    if (id === 'bagPanel') renderBagScrolls();
}

function closePanels() {
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    stopBattle();
}

function logMsg(msg, color = "#fff") {
    const log = document.getElementById('battleLog');
    if (log) {
        log.innerHTML += `<p style="color:${color}">> ${msg}</p>`;
        log.scrollTop = log.scrollHeight;
    }
}

function toggleSpeed() {
    battleSpeed = battleSpeed >= 5 ? 1 : battleSpeed + 1;
    document.getElementById('btnSpeed').textContent = `Speed: ${battleSpeed}x`;
    if (battleActive) {
        clearInterval(battleInterval);
        battleInterval = setInterval(() => processCombatTick(), 1500 / battleSpeed);
    }
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('btnPause').textContent = isPaused ? "▶️ Play" : "⏸️ Pause";
    document.getElementById('btnPause').style.background = isPaused ? "#ff9800" : "#ffeb3b";
}

function toggleAuto() {
    isAuto = !isAuto;
    document.getElementById('btnAuto').textContent = isAuto ? "Auto: ON" : "Auto: OFF";
    document.getElementById('btnAuto').style.background = isAuto ? "#81c784" : "#ff5252";
}

function toggleLvlMult() {
    const idx = mults.indexOf(lvlMult);
    lvlMult = mults[(idx + 1) % mults.length];
    document.getElementById('btnLvlMult').textContent = `x${lvlMult}`;
    if (selectedUnitIndex > -1) openUnitMenu(playerUnits[selectedUnitIndex]);
}

// --- SHOP ---
function renderShop() {
    const grid = document.getElementById('shopGridRender');
    if (!grid) return;
    grid.innerHTML = `
        <div class="shop-item"><div style="font-size:4vh;">🧪</div><h4>HP Pot</h4><button class="shop-btn" onclick="buyItem('hp', 30)">30 💰</button></div>
        <div class="shop-item"><div style="font-size:4vh;">🍼</div><h4>MP Pot</h4><button class="shop-btn" onclick="buyItem('mana', 50)">50 💰</button></div>
    `;

    const equips = [
        { id: 'ring', name: 'Ring', key: 'ring', max: 9, baseCost: 500 },
        { id: 'helmet', name: 'Helmet', key: 'helmet', max: 9, baseCost: 100 },
        { id: 'armor', name: 'Armor', key: 'armor', max: 9, baseCost: 150 },
        { id: 'gloves', name: 'Gloves', key: 'gloves', max: 9, baseCost: 80 },
        { id: 'boots', name: 'Boots', key: 'boots', max: 9, baseCost: 80 }
    ];

    equips.forEach(e => {
        const currentLvl = player.equipment ? (player.equipment[e.key] || 0) : 0;
        const nextRank = currentLvl < e.max ? rankOrder[currentLvl] : 'MAX';
        const cost = currentLvl < e.max ? e.baseCost * Math.pow(2, currentLvl) : '---';
        grid.innerHTML += `<div class="shop-item"><div style="font-size:4vh;">${e.id === 'ring' ? '💍' : e.id === 'helmet' ? '🪖' : e.id === 'armor' ? '👕' : e.id === 'gloves' ? '🧤' : '🥾'}</div>
            <h4 style="margin:2px 0; font-size:2vh;">${e.name} <span class="c-${nextRank}">[${nextRank}]</span></h4>
            <button class="shop-btn" ${nextRank === 'MAX' ? 'disabled' : ''} onclick="buyItem('${e.id}', ${cost})">${cost} 💰</button></div>`;
    });
}

function buyItem(item, cost) {
    if (!player.cheat_mode && (player.gold || 0) < cost) return alert("Not enough gold!");
    
    if (!player.cheat_mode) player.gold -= cost;
    if (!player.equipment) player.equipment = {helmet:0, armor:0, gloves:0, boots:0, ring:0};

    if (item === 'hp') player.hp_potions++;
    else if (item === 'mana') player.mana_potions++;
    else player.equipment[item]++;

    updateUI(); renderEquipGrid(); renderShop(); logMsg("Bought item!", "#d4af37");
    syncSave();
}

function usePotion(item) {
    if (item === 'hp' && (player.hp_potions || 0) > 0) {
        if (battleActive && playerUnits[12]) {
            playerUnits[12].hp = playerUnits[12].maxHp;
            player.hp_potions--;
            renderGrid('playerGrid', playerUnits, true);
            logMsg("Used HP Potion! Hero fully healed.", "#81c784");
        } else return;
    } else if (item === 'mana' && (player.mana_potions || 0) > 0) {
        player.mana = player.max_mana;
        player.mana_potions--;
        logMsg("Used MP Potion!", "#4fc3f7");
    } else return;

    updateUI();
    syncSave();
}

// --- SCROLL CRAFTING ---
function renderBagScrolls() {
    const area = document.getElementById('scrollCraftingRender');
    if(!area) return;
    area.innerHTML = '';
    
    for(let i=0; i<rankOrder.length-1; i++) {
        let rank = rankOrder[i];
        let next = rankOrder[i+1];
        let count = player.scrolls[rank] || 0;
        
        area.innerHTML += `
        <div class="craft-card b-${rank}">
            <strong class="c-${rank}" style="font-size:2.5vh;">[${rank}] Scroll</strong><br>
            Owned: ${count}<br>
            <button class="shop-btn" style="margin-top:10px;" ${count < 5 ? 'disabled' : ''} onclick="craftScroll('${rank}', '${next}')">Craft 5 ➡️ [${next}]</button>
        </div>`;
    }
}

function craftScroll(fromRank, toRank) {
    if (player.scrolls[fromRank] >= 5) {
        player.scrolls[fromRank] -= 5;
        player.scrolls[toRank] = (player.scrolls[toRank] || 0) + 1;
        renderBagScrolls();
        updateUI();
        syncSave();
    }
}

// --- BATTLE ---
function startBattle() {
    if (battleActive) return;
    battleActive = true;
    isPaused = false;
    document.getElementById('stageNum').textContent = stage;
    waveCount = 1;
    updateProgressBar();

    playerUnits = new Array(25).fill(null);
    enemyUnits = new Array(25).fill(null);

    playerUnits[12] = { name: player.username, hp: 1000, maxHp: 1000, atk: 50, def: getHeroDef(), agi: getHeroAgi(), sprite: '🦸‍♂️', type: 'Attack', combat_style: 'Melee', rank: 'Hero', level: player.level, isHero: true };
    updateHeroStats();

    renderGrid('playerGrid', playerUnits, true);
    renderGrid('enemyGrid', enemyUnits, false);
    spawnEnemyWave();
    battleInterval = setInterval(() => processCombatTick(), 1500 / battleSpeed);
}

function stopBattle() {
    battleActive = false;
    clearInterval(battleInterval);
    document.getElementById('battleLog').innerHTML = '';
}

function renderGrid(gridId, unitArray, isPlayerSide) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';

    for (let i = 0; i < 25; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = `${gridId}-cell-${i}`;

        const unit = unitArray[i];
        if (unit) {
            const hpPct = Math.max(0, (unit.hp / unit.maxHp) * 100);
            const barClass = isPlayerSide ? 'hp-bar-fill' : 'hp-bar-fill enemy-hp';
            const rClass = `b-${unit.rank === 'UR' ? 'UR' : unit.rank}`;
            const heroClass = unit.isHero ? ' hero' : '';
            const bossClass = unit.isBoss ? ' boss' : '';

            const rankDisp = unit.rank === 'UR' ? `UR ${unit.stars}★` : unit.rank;
            const badgeHtml = unit.isHero ? '' : `<div class="rank-badge">${rankDisp}</div>`;

            cell.innerHTML = `<div class="entity ${rClass}">
                ${badgeHtml}
                <div class="sprite${heroClass}${bossClass}" id="${gridId}-sprite-${i}">${unit.sprite}</div>
                <div class="hp-bar-bg"><div class="${barClass}" style="width:${hpPct}%"></div></div>
            </div>`;
        }

        if (isPlayerSide) cell.onclick = () => handlePlayerTileClick(i);
        grid.appendChild(cell);
    }
    updateUI();
}

function handlePlayerTileClick(index) {
    const unit = playerUnits[index];

    if (movingUnitIndex > -1) {
        if (!unit && index !== 12) {
            playerUnits[index] = playerUnits[movingUnitIndex];
            playerUnits[movingUnitIndex] = null;
            movingUnitIndex = -1;
            renderGrid('playerGrid', playerUnits, true);
        } else { movingUnitIndex = -1; }
        return;
    }

    if (unit) {
        selectedUnitIndex = index;
        openUnitMenu(unit);
    } else {
        if (index === 12) return;
        const currentSummons = playerUnits.filter(u => u && !u.isHero).length;
        if (currentSummons >= getMaxSummons()) return showDamageText('playerGrid', index, "Limit Reached!");

        selectingCellIndex = index;
        openSummonSelect();
    }
}

// --- SPLIT MODAL ACTIONS ---
function openUnitMenu(unit) {
    document.getElementById('uMenuSprite').textContent = unit.sprite;

    const rankDisp = unit.rank === 'UR' ? `UR ${unit.stars}★` : unit.rank;
    document.getElementById('uMenuName').innerHTML = `<span class="c-${unit.rank === 'UR' ? 'UR' : unit.rank}">[${rankDisp}]</span> ${unit.name}`;
    document.getElementById('uMenuHp').textContent = `${Math.floor(unit.hp)}/${Math.floor(unit.maxHp)}`;
    document.getElementById('uMenuAtk').textContent = Math.floor(unit.atk);
    document.getElementById('uMenuDef').textContent = Math.floor(unit.def);
    document.getElementById('uMenuAgi').textContent = unit.agi;
    document.getElementById('uMenuLvl').textContent = unit.level || 1;
    document.getElementById('uMenuRank').textContent = rankDisp;

    const cost = getMultiLvlCost(unit.level || 1, lvlMult);
    const btnLvl = document.getElementById('btnLvlUp');
    const btnRank = document.getElementById('btnRankUp');
    const btnMove = document.getElementById('btnMove');
    const btnUnspawn = document.getElementById('btnUnspawn');

    if (unit.isHero) {
        btnLvl.textContent = `Hero Lvl Up (Auto)`; btnLvl.disabled = true;
        btnRank.textContent = `Hero Rank (Auto)`; btnRank.disabled = true;
        btnMove.disabled = true; btnUnspawn.disabled = true;
    } else {
        btnLvl.textContent = `Level Up (${cost}g)`; btnLvl.disabled = false;
        btnMove.disabled = false; btnUnspawn.disabled = false;

        const nextRankIdx = rankOrder.indexOf(unit.rank) + 1;
        const reqLvl = nextRankIdx * 10;
        
        if (unit.rank === 'UR' || unit.rank === 'SSS') {
            const reqData = rankUpReqs['UR'];
            btnRank.innerHTML = `Ascend Star<br><span style="font-size:1.5vh;">(Lv${reqLvl} | ${reqData.s}[SSS]📜 | ${reqData.m}💧 | ${reqData.g}💰)</span>`;
            btnRank.disabled = unit.level < reqLvl;
        } else {
            const nextRank = rankOrder[nextRankIdx];
            const reqData = rankUpReqs[nextRank];
            btnRank.innerHTML = `Rank Up<br><span style="font-size:1.5vh;">(Lv${reqLvl} | ${reqData.s}[${nextRank}]📜 | ${reqData.m}💧 | ${reqData.g}💰)</span>`;
            btnRank.disabled = unit.level < reqLvl;
        }
    }

    document.getElementById('unitMenuPanel').style.display = 'flex';
}

function closeUnitMenu() { document.getElementById('unitMenuPanel').style.display = 'none'; selectedUnitIndex = -1; }

function actionMove() { 
    if(playerUnits[selectedUnitIndex].isHero) return alert("Hero cannot move!");
    movingUnitIndex = selectedUnitIndex; logMsg("Tap an empty tile.", "#f9d71c"); closeUnitMenu(); 
}

function actionUnspawn() {
    if (selectedUnitIndex > -1) {
        if(playerUnits[selectedUnitIndex].isHero) return alert("Hero cannot be unspawned!");
        playerUnits[selectedUnitIndex] = null;
        updateHeroStats();
        renderGrid('playerGrid', playerUnits, true);
    }
    closeUnitMenu();
}

function actionLevelUp() {
    const u = playerUnits[selectedUnitIndex];
    if(u.isHero) return;

    const cost = getMultiLvlCost(u.level || 1, lvlMult);
    if (!player.cheat_mode && (player.gold || 0) < cost) return alert("Need more Gold!");

    if (!player.cheat_mode) player.gold -= cost;

    u.level = (u.level || 1) + lvlMult;
    u.maxHp += (20 * lvlMult); u.hp += (20 * lvlMult);
    u.atk += (5 * lvlMult); u.def += (2 * lvlMult);

    updateHeroStats();
    openUnitMenu(u);
    updateUI();
    renderGrid('playerGrid', playerUnits, true);
    syncSave();
}

function actionRankUp() {
    const u = playerUnits[selectedUnitIndex];
    if(u.isHero) return;

    const isUR = u.rank === 'SSS' || u.rank === 'UR';
    const nextRankIdx = rankOrder.indexOf(u.rank) + 1;
    const reqLvl = nextRankIdx * 10;
    
    if (u.level < reqLvl) return alert(`Must be Level ${reqLvl} to evolve!`);

    let nextRankStr = isUR ? 'UR' : rankOrder[nextRankIdx];
    let scrollReqRank = isUR ? 'SSS' : nextRankStr;
    let reqData = rankUpReqs[nextRankStr];

    if (!player.cheat_mode) {
        if ((player.scrolls[scrollReqRank] || 0) < reqData.s || (player.gold || 0) < reqData.g || (player.mana || 0) < reqData.m) {
            return alert(`Need ${reqData.m}💧, ${reqData.s}[${scrollReqRank}]📜, and ${reqData.g}💰!`);
        }
        player.gold -= reqData.g;
        player.mana -= reqData.m;
        player.scrolls[scrollReqRank] -= reqData.s;
    }

    if (isUR) {
        u.rank = 'UR'; u.stars = (u.stars || 0) + 1;
        u.maxHp *= 1.5; u.hp = u.maxHp; u.atk *= 1.5; u.def *= 1.5; u.agi += 2;
        logMsg(`${u.name} Ascended to UR ${u.stars}★!`, "#e040fb");
        showDamageText('playerGrid', selectedUnitIndex, "Ascended!", "#e040fb");
    } else {
        u.rank = rankOrder[nextRankIdx];
        const path = evoPaths[u.family];
        if (path) {
            u.name = path.names[Math.min(8, nextRankIdx)];
            u.sprite = path.icons[Math.min(8, nextRankIdx)];
        }
        u.maxHp *= 2; u.hp = u.maxHp; u.atk *= 2; u.def *= 2; u.agi += 1;
        logMsg(`Evolved to [${u.rank}] ${u.name}!`, "#d4af37");
        showDamageText('playerGrid', selectedUnitIndex, "Evolved!", "#d4af37");
    }

    updateHeroStats();
    openUnitMenu(u);
    updateUI();
    renderGrid('playerGrid', playerUnits, true);
    syncSave();
}

// --- UNIQUE SUMMON SELECTION ---
function openSummonSelect() {
    const panel = document.getElementById('summonSelectPanel');
    const list = document.getElementById('summonSelectList');
    list.innerHTML = '';

    const activeFamilies = playerUnits.filter(u => u && !u.isHero).map(u => u.family);
    const available = baseMonsters.filter(m => !activeFamilies.includes(m.family));

    if (available.length === 0) {
        list.innerHTML = '<div style="grid-column: span 3; text-align:center; color:#ff5252;">All unique families deployed!</div>';
    } else {
        available.forEach(m => {
            const pathInfo = evoPaths[m.family];
            const name = pathInfo ? pathInfo.names[0] : m.family;
            const icon = pathInfo ? pathInfo.icons[0] : '🐾';

            const cost = 20;
            const div = document.createElement('div');
            div.className = 'select-card';
            div.innerHTML = `<div style="font-size:4vh;">${icon}</div>
                <div class="c-F" style="font-size:2vh; font-weight:bold;">[F] ${name}</div>
                <div style="font-size:1.5vh; color:#aaa;">Cost: ${cost}💧</div>`;
            div.onclick = () => confirmSummon(m, name, icon, cost);
            list.appendChild(div);
        });
    }
    panel.style.display = 'flex';
}

function closeSummonSelect() { document.getElementById('summonSelectPanel').style.display = 'none'; }

function confirmSummon(rm, name, icon, cost) {
    if (!player.cheat_mode && (Number(player.mana) || 0) < cost) {
        return alert(`Not enough Mana! You need ${cost}💧 Mana.`);
    }

    if (!player.cheat_mode) player.mana -= cost;

    playerUnits[selectingCellIndex] = {
        family: rm.family, name: name, hp: rm.base_hp, maxHp: rm.base_hp, atk: rm.base_atk, def: rm.base_def, agi: rm.base_agi,
        type: rm.type, combat_style: rm.combat_style, rank: 'F', sprite: icon, level: 1, isHero: false
    };

    updateHeroStats();
    logMsg(`Summoned [F] ${name}`, "#4fc3f7");
    updateUI();
    renderGrid('playerGrid', playerUnits, true);
    closeSummonSelect();
    syncSave();
}

// --- COMBAT & ANIMATIONS ---
function fireProjectile(startGrid, startIdx, endGrid, endIdx, icon) {
    const startCell = document.getElementById(`${startGrid}-cell-${startIdx}`);
    const endCell = document.getElementById(`${endGrid}-cell-${endIdx}`);
    if (!startCell || !endCell) return;
    const startRect = startCell.getBoundingClientRect();
    const endRect = endCell.getBoundingClientRect();
    const proj = document.createElement('div');
    proj.className = 'projectile';
    proj.textContent = icon;
    proj.style.left = (startRect.left + startRect.width / 2) + 'px';
    proj.style.top = (startRect.top + startRect.height / 2) + 'px';
    document.body.appendChild(proj);
    setTimeout(() => { proj.style.left = (endRect.left + endRect.width / 2) + 'px'; proj.style.top = (endRect.top + endRect.height / 2) + 'px'; }, 20);
    setTimeout(() => proj.remove(), 300 / battleSpeed);
}

function triggerAnim(gridId, cellIndex, isMelee) {
    const sprite = document.getElementById(`${gridId}-sprite-${cellIndex}`);
    if (sprite) {
        sprite.classList.remove('anim-lunge', 'anim-lunge-rev');
        void sprite.offsetWidth;
        if (isMelee) sprite.classList.add(gridId === 'playerGrid' ? 'anim-lunge' : 'anim-lunge-rev');
    }
}

function updateProgressBar() {
    const bar = document.getElementById('stageProgress');
    if (bar) bar.style.width = ((waveCount - 1) / 3) * 100 + "%";
}

function processCombatTick() {
    if (!battleActive || isPaused) return;
    updateHeroStats();

    const pTargets = playerUnits.map((u, i) => u ? i : null).filter(i => i !== null);
    const eTargets = enemyUnits.map((u, i) => u ? i : null).filter(i => i !== null);

    // ENEMY ATTACKS
    for (let i = 0; i < 25; i++) {
        if (enemyUnits[i] && pTargets.length > 0) {
            const defTargets = pTargets.filter(idx => playerUnits[idx].type === 'Defense');
            const targetIdx = (defTargets.length > 0 ? defTargets : pTargets)[Math.floor(Math.random() * (defTargets.length > 0 ? defTargets.length : pTargets.length))];
            const target = playerUnits[targetIdx];

            const isMelee = enemyUnits[i].combat_style === 'Melee';
            triggerAnim('enemyGrid', i, isMelee);
            if (!isMelee) fireProjectile('enemyGrid', i, 'playerGrid', targetIdx, '🔥');

            if (Math.random() * 100 < target.agi) {
                showDamageText('playerGrid', targetIdx, "Dodged!", "#fff");
            } else {
                const dmg = Math.max(1, enemyUnits[i].atk - target.def);
                dealDamage(playerUnits, targetIdx, dmg, 'playerGrid', targetIdx, "#ff5252");
            }
        }
    }

    // PLAYER ATTACKS
    for (let i = 0; i < 25; i++) {
        if (playerUnits[i]) {
            const u = playerUnits[i];
            if (u.type === 'Support') {
                const hurt = pTargets.filter(idx => playerUnits[idx].hp < playerUnits[idx].maxHp);
                if (hurt.length > 0) {
                    const healIdx = hurt[Math.floor(Math.random() * hurt.length)];
                    triggerAnim('playerGrid', i, false);
                    fireProjectile('playerGrid', i, 'playerGrid', healIdx, '✨');
                    playerUnits[healIdx].hp = Math.min(playerUnits[healIdx].maxHp, playerUnits[healIdx].hp + (u.atk * 2));
                    showDamageText('playerGrid', healIdx, `+${u.atk * 2}`, "#81c784");
                }
            } else if (eTargets.length > 0) {
                const targetIdx = eTargets[Math.floor(Math.random() * eTargets.length)];
                const target = enemyUnits[targetIdx];
                const isMelee = u.combat_style === 'Melee';

                triggerAnim('playerGrid', i, isMelee);
                if (!isMelee) fireProjectile('playerGrid', i, 'enemyGrid', targetIdx, u.isHero ? '🔮' : '🏹');

                if (Math.random() * 100 < target.agi) {
                    showDamageText('enemyGrid', targetIdx, "Dodged!", "#fff");
                } else {
                    const dmg = Math.max(1, u.atk - target.def);
                    dealDamage(enemyUnits, targetIdx, dmg, 'enemyGrid', targetIdx, "#fff");
                }
            }
        }
    }

    if (!playerUnits[12]) { alert("Hero Defeated!"); closePanels(); return; }

    if (eTargets.length === 0) {
        waveCount++;
        if (waveCount > 3) {
            stage++; document.getElementById('stageNum').textContent = stage;
            logMsg(`Stage ${stage} Cleared!`, "#81c784");
            waveCount = 1;

            if (!isAuto) {
                logMsg("Auto is OFF. Paused.", "#ffeb3b");
                isPaused = true;
                document.getElementById('btnPause').textContent = "▶️ Play";
                document.getElementById('btnPause').style.background = "#ff9800";
            }
        }
        updateProgressBar();
        spawnEnemyWave();
    }
    renderGrid('playerGrid', playerUnits, true); renderGrid('enemyGrid', enemyUnits, false);
}

function dealDamage(teamArray, targetIndex, damageAmount, gridId, cellIndex, color) {
    const target = teamArray[targetIndex];
    if (!target) return;
    setTimeout(() => {
        target.hp -= damageAmount;
        showDamageText(gridId, cellIndex, `-${damageAmount}`, color);
        if (target.hp <= 0) {
            const isBoss = target.isBoss;
            const enemyRank = target.rank;
            teamArray[targetIndex] = null;
            
            if (gridId === 'enemyGrid') {
                const eGain = (20 * stage) * (isBoss ? 5 : 1);
                const gGain = (10 + (stage * 2)) * (isBoss ? 5 : 1);
                const mGain = (stage * 2) * (isBoss ? 5 : 1);

                let sDrop = 0;
                if (Math.random() < (isBoss ? 0.8 : 0.15)) {
                    sDrop = 1;
                    showDamageText('enemyGrid', cellIndex, `+1 [${enemyRank}]📜`, "#e0f7fa");
                }

                player.gold = (Number(player.gold) || 0) + gGain;
                player.mana = Math.min(Number(player.max_mana)||50, (Number(player.mana) || 0) + mGain);
                if (sDrop) {
                    if(!player.scrolls) player.scrolls = {...defaultScrolls};
                    if(player.scrolls[enemyRank] !== undefined) player.scrolls[enemyRank]++;
                }
                
                player.exp = (Number(player.exp) || 0) + eGain;
                while (player.exp >= player.level * 100) {
                    player.exp -= player.level * 100;
                    player.level++;
                }
                updateUI();

                logMsg(`Killed: +${gGain}g | +${eGain}xp | +${mGain}m ${sDrop ? `| +1 [${enemyRank}] Scroll` : ''}`, "#d4af37");

                fetch('/api/battle/win', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goldReward: gGain, expReward: eGain, manaReward: mGain, scrollReward: sDrop, scrollRank: enemyRank })
                });
            }
        }
        renderGrid(gridId, teamArray, gridId === 'playerGrid');
    }, 150 / battleSpeed);
}

function spawnEnemyWave() {
    const isBossWave = waveCount === 3;
    const maxEnemies = isBossWave ? 1 : Math.min(25, 2 + Math.floor(stage / 5));

    const rankIdx = Math.min(8, Math.floor((stage - 1) / 20));
    const rankMult = rankOrder.indexOf(rankOrder[rankIdx]) + 1;
    const localStageMult = 1 + (((stage - 1) % 20) * 0.1);

    for (let i = 0; i < maxEnemies; i++) {
        const emptySpots = enemyUnits.map((u, idx) => u === null ? idx : null).filter(idx => idx !== null);
        if (emptySpots.length > 0) {
            const spawnIdx = isBossWave ? 12 : emptySpots[Math.floor(Math.random() * emptySpots.length)];
            const isRanged = Math.random() > 0.5;

            const hp = Math.floor(50 * rankMult * localStageMult * (isBossWave ? 5 : 1));
            const atk = Math.floor(10 * rankMult * localStageMult * (isBossWave ? 2 : 1));

            enemyUnits[spawnIdx] = {
                name: isBossWave ? "Stage Boss" : "Wild Monster",
                hp: hp, maxHp: hp, atk: atk, def: Math.floor(2 * rankMult * localStageMult),
                agi: Math.min(60, 5 * rankMult),
                type: 'Attack', combat_style: isRanged ? 'Ranged' : 'Melee',
                rank: rankOrder[rankIdx], sprite: isBossWave ? '👹' : (isRanged ? '🐍' : '🐺'),
                isBoss: isBossWave
            };
        }
    }
    renderGrid('enemyGrid', enemyUnits, false);
}

function showDamageText(gridId, cellIndex, text, color) {
    const cell = document.getElementById(`${gridId}-cell-${cellIndex}`);
    if (!cell) return;
    const dmg = document.createElement('div');
    dmg.className = 'dmg-text';
    dmg.style.color = color;
    dmg.textContent = text;
    dmg.style.left = Math.floor(Math.random() * 40) + "%";
    cell.appendChild(dmg);
    setTimeout(() => { if (dmg.parentNode) dmg.remove(); }, 800 / battleSpeed);
}

function populateBag() {
    const list = document.getElementById('monsterList');
    if (!list) return;
    list.innerHTML = '';
    baseMonsters.forEach(m => {
        const path = evoPaths[m.family];
        const name = path ? path.names[0] : m.family;
        const icon = path ? path.icons[0] : '🐾';
        list.innerHTML += `<li style="background:#2a2a35; padding:10px; border-radius:5px; border-left:4px solid var(--gold);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-size:2vh;"><span class="c-F">[F]</span> ${name} Base</strong> 
                <span style="font-size:3vh;">${icon}</span>
            </div>
            <span style="color:#aaa; font-size:1.5vh;">Family: ${m.family} | Role: ${m.type} (${m.combat_style})</span>
        </li>`;
    });
}

window.onload = init;
