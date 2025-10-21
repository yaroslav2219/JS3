document.addEventListener('DOMContentLoaded', () => {
  const q = (s, root = document) => root.querySelector(s);

  function makePokemon(name, img, root) {
    return {
      name: name,
      img: img,
      maxHp: 100,
      hp: 100,
      progressBar: q('.health', root),
      hpText: q('.text', root),
      imgEl: q('.sprite', root)
    };
  }

  const charRoot = q('.pokemon.character');
  const enemyRoot = q('.pokemon.enemy');
  if (!charRoot || !enemyRoot) return;

  const player = makePokemon('Pikachu', 'assets/player.png', charRoot);
  const enemy = makePokemon('Charmander', 'assets/enemy.png', enemyRoot);

  const enemy2Root = enemyRoot.cloneNode(true);
  enemy2Root.classList.add('enemy2');
  enemy2Root.querySelector('.name').textContent = 'Squirtle';
  enemy2Root.querySelector('.sprite').src = 'assets/enemy2.png'; 
  enemy2Root.querySelector('.text').textContent = '100 / 100';
  enemy2Root.querySelector('.health').style.width = '100%';

  enemyRoot.insertAdjacentElement('afterend', enemy2Root);

  const enemy2 = makePokemon('Squirtle', 'assets/enemy2.png', enemy2Root);

  function updateHealth(p) {
    if (!p || !p.progressBar || !p.hpText) return;
    if (p.hp < 0) p.hp = 0;
    const pct = Math.round((p.hp / p.maxHp) * 100);
    p.progressBar.style.width = `${pct}%`;
    p.hpText.textContent = `${p.hp} / ${p.maxHp}`;
    p.progressBar.classList.remove('low', 'critical');
    if (pct <= 25) p.progressBar.classList.add('critical');
    else if (pct <= 50) p.progressBar.classList.add('low');
  }

  function hit(target, min, max) {
    if (!target || target.hp <= 0) return;
    const dmg = Math.floor(Math.random() * (max - min + 1)) + min;
    target.hp = Math.max(0, target.hp - dmg);
    updateHealth(target);
        if (target.imgEl) {
      target.imgEl.style.filter = "brightness(0.6)";
      setTimeout(() => (target.imgEl.style.filter = "brightness(1)"), 150);
    }
  }

  [player, enemy, enemy2].forEach(p => {
    if (p.imgEl && p.img) p.imgEl.src = p.img;
    updateHealth(p);
  });

  const control = q('.control');
  if (!control) return;

  const btnFight = q('#btn-kick');
  const btnSpecial = document.createElement('button');
  btnSpecial.className = 'button';
  btnSpecial.textContent = 'Special Attack';
  control.appendChild(btnSpecial);

  const btnRandom = document.createElement('button');
  btnRandom.className = 'button';
  btnRandom.textContent = 'Random Fight';
  control.appendChild(btnRandom);

  btnFight.addEventListener('click', () => {
    if (enemy.hp <= 0) return;
    hit(enemy, 8, 18);
    if (enemy.hp > 0) hit(player, 4, 12);
  });

  btnSpecial.addEventListener('click', () => {
    if (enemy2.hp <= 0) return;
    hit(enemy2, 15, 30);
    if (enemy2.hp > 0) hit(player, 5, 15);
  });

  btnRandom.addEventListener('click', () => {
    [player, enemy, enemy2].forEach(p => {
      const change = Math.floor(Math.random() * 40) - 20;
      p.hp = Math.max(0, Math.min(p.maxHp, p.hp + change));
      updateHealth(p);
    });
  });
});


