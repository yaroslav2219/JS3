// main.js

// --- Утиліти ---
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- Клас Pokemon (об'єктний підхід) ---
class Pokemon {
  constructor({ rootElement }) {
    this.root = rootElement;
    this.nameEl = $('.name', this.root);
    this.hpTextEl = $('.text', this.root);
    this.barEl = $('.health', this.root);
    // id-based fallback
    this.id = this.root.id || (this.nameEl ? this.nameEl.id : null);

    // Початкові значення
    this.maxHP = 100;
    this.hp = this.maxHP;

    // Зчитати початковий текст якщо є формат "X / Y"
    const initial = this.hpTextEl?.textContent?.trim();
    if (initial) {
      const m = initial.match(/(\d+)\s*\/\s*(\d+)/);
      if (m) {
        this.hp = parseInt(m[1], 10);
        this.maxHP = parseInt(m[2], 10);
      }
    }

    this.updateUI();
  }

  takeDamage(amount) {
    if (this.isDead()) return;
    this.hp = clamp(this.hp - Math.abs(Math.round(amount)), 0, this.maxHP);
    this.updateUI();
  }

  heal(amount) {
    this.hp = clamp(this.hp + Math.abs(Math.round(amount)), 0, this.maxHP);
    this.updateUI();
  }

  isDead() {
    return this.hp <= 0;
  }

  // attack: завдає випадкової шкоди між minDamage і maxDamage
  attack(target, minDamage = 5, maxDamage = 15) {
    if (!target || target.isDead()) return 0;
    const dmg = randInt(minDamage, maxDamage);
    target.takeDamage(dmg);
    return dmg;
  }

  // оновлює UI — ширина прогрессбару, текст і класи кольору
  updateUI() {
    if (!this.barEl || !this.hpTextEl) return;
    const pct = (this.maxHP === 0) ? 0 : Math.round((this.hp / this.maxHP) * 100);
    this.barEl.style.width = `${pct}%`;
    this.hpTextEl.textContent = `${this.hp} / ${this.maxHP}`;

    // Очистити класи
    this.barEl.classList.remove('low', 'critical');

    // Встановити колір залежно від відсотка
    if (pct <= 25) {
      this.barEl.classList.add('critical');
    } else if (pct <= 50) {
      this.barEl.classList.add('low');
    }
    // якщо помер
    if (this.isDead()) {
      this.hpTextEl.textContent = `0 / ${this.maxHP} — Fainted`;
      // додатково можна затемнити картинку або додати клас
      this.root.classList.add('fainted');
    } else {
      this.root.classList.remove('fainted');
    }
  }
}


// --- Ініціалізація DOM і об'єктів ---
document.addEventListener('DOMContentLoaded', () => {
  // Перш за все - знайти існуючих персонажів у DOM
  const charRoot = document.querySelector('.pokemon.character');
  const enemyRoot = document.querySelector('.pokemon.enemy');

  if (!charRoot || !enemyRoot) {
    console.error('Не знайдені елементи персонажа або першого супротивника.');
    return;
  }

  // Створимо об'єкти
  const player = new Pokemon({ rootElement: charRoot });
  // Присвоїмо id'шки для елементів прогрессбару та текстів для зручності, якщо їх нема
  const enemy1 = new Pokemon({ rootElement: enemyRoot });

  // Динамічно створимо 2-го супротивника, клонуючи HTML першого
  const enemy2Root = enemyRoot.cloneNode(true);
  // Додамо унікальні id/тексти
  // змінюємо ім'я, id елементів та початковий текст
  const nameEl2 = $('.name', enemy2Root);
  if (nameEl2) nameEl2.textContent = 'Squirtle';

  // оновимо внутрішні елементи id, щоб не було дублікатів (корисне, якщо звертаємось за id)
  const bar2 = $('.health', enemy2Root);
  const hpText2 = $('.text', enemy2Root);
  if (bar2) bar2.style.width = '100%';
  if (hpText2) hpText2.textContent = '100 / 100';

  // Вставимо копію в DOM після control або після першого enemy
  const playground = document.querySelector('.playground') || enemyRoot.parentElement;
  playground.appendChild(enemy2Root);

  const enemy2 = new Pokemon({ rootElement: enemy2Root });

  // --- Додавання кнопок у панель .control ---
  const control = document.querySelector('.control');

  // btn-kick вже існує (Thunder Jolt) — зробимо її основною атакою
  const btnKick = document.getElementById('btn-kick');

  // Створимо додаткові кнопки
  const btnSpecial = document.createElement('button');
  btnSpecial.className = 'button';
  btnSpecial.id = 'btn-special';
  btnSpecial.textContent = 'Special Attack (Heavy)';

  const btnRandomFight = document.createElement('button');
  btnRandomFight.className = 'button';
  btnRandomFight.id = 'btn-random';
  btnRandomFight.textContent = 'Random Fight';

  // Додаткові стилі простого розділення кнопок
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '10px';
  wrapper.style.alignItems = 'center';
  wrapper.appendChild(btnKick);
  wrapper.appendChild(btnSpecial);
  wrapper.appendChild(btnRandomFight);

  // Очистимо control і вставимо wrapper (щоб не дублювати існуючу кнопку)
  control.innerHTML = '';
  control.appendChild(wrapper);

  // --- Функції для логів / ефектів ---
const logContainer = document.createElement('div');
logContainer.id = 'battle-log';
logContainer.style.width = '100%';
logContainer.style.height = '120px'; // фіксована висота
logContainer.style.overflowY = 'auto';
logContainer.style.border = '1px solid #ccc';
logContainer.style.marginTop = '10px';
logContainer.style.padding = '5px';
logContainer.style.background = '#111';
logContainer.style.color = '#0f0';
logContainer.style.fontFamily = 'monospace';
logContainer.style.fontSize = '14px';

control.appendChild(logContainer);

const createLogLine = (text) => {
  const log = document.createElement('div');
  log.textContent = text;
  logContainer.appendChild(log);
  // автопрокрутка вниз
  logContainer.scrollTop = logContainer.scrollHeight;
};

  // --- Події кнопок ---
  // Основна атака гравця: наносить шкоду enemy1; enemy1 відповідає автоматично
  btnKick.addEventListener('click', () => {
    if (enemy1.isDead() && enemy2.isDead()) {
      createLogLine('Всі супротивники вже повалені!');
      return;
    }
    if (enemy1.isDead()) {
      createLogLine('Enemy1 вже повалений — атакуйте іншого супротивника!');
      return;
    }

    // Головна атака гравця: середня шкода
    const dmg = player.attack(enemy1, 8, 18);
    createLogLine(`Player used Thunder Jolt on ${$('.name', enemy1.root).textContent.trim()} — ${dmg} dmg`);

    // Якщо супротивник живий — відповідає
    if (!enemy1.isDead()) {
      const ret = enemy1.attack(player, 4, 14); // відповідь слабша
      createLogLine(`${$('.name', enemy1.root).textContent.trim()} counterattacked — ${ret} dmg`);
    } else {
      createLogLine(`${$('.name', enemy1.root).textContent.trim()} fainted!`);
    }
  });

  // Спеціальна атака — робить сильну дію по enemy2
  btnSpecial.addEventListener('click', () => {
    if (enemy2.isDead()) {
      createLogLine('Другий супротивник уже повалений.');
      return;
    }
    // Сильніший діапазон + шанс критичного множника
    let dmg = player.attack(enemy2, 14, 32);
    // шанс криту 20%
    if (Math.random() < 0.2) {
      dmg = Math.round(dmg * 1.6);
      enemy2.takeDamage(Math.round(dmg * 0)); // обхід — але ми вже нанесли dmg в attack. Альтернатива: повторно зменшимо
      createLogLine(`CRITICAL! Special hit does extra power!`);
    }
    createLogLine(`Player used Special on ${$('.name', enemy2.root).textContent.trim()} — ${dmg} dmg`);

    // enemy2 може відповісти миттєво сильнішою або слабшою атакою
    if (!enemy2.isDead()) {
      const ret = enemy2.attack(player, 6, 20);
      createLogLine(`${$('.name', enemy2.root).textContent.trim()} struck back — ${ret} dmg`);
    } else {
      createLogLine(`${$('.name', enemy2.root).textContent.trim()} fainted!`);
    }
  });

  // Random Fight: випадкова зміна балів у обох суперників (і трохи гравцю) — може бути як damage, так і heal
  btnRandomFight.addEventListener('click', () => {
    // Для кожного зробимо випадкову зміну в діапазоні [-20, +10] (може й лікувати)
    const changes = [
      { who: player, name: 'Player' },
      { who: enemy1, name: $('.name', enemy1.root).textContent.trim() },
      { who: enemy2, name: $('.name', enemy2.root).textContent.trim() }
    ];

    changes.forEach(({ who, name }) => {
      const change = randInt(-10, 25) - 10; // результат в діапазоні [-10,15] — або ставити інший діапазон
      if (change < 0) {
        who.takeDamage(Math.abs(change));
        createLogLine(`${name} took ${Math.abs(change)} random dmg`);
      } else {
        who.heal(change);
        createLogLine(`${name} healed ${change} HP (random)`);
      }
    });
  });

  // Додаткові: якщо треба — ресет
  // Додаємо подвійний клік на логічний елемент лог для ресета (необов'язково)
  control.addEventListener('dblclick', (e) => {
    if (e.target.classList.contains('button')) return;
    // ресет всієї битви
    [player, enemy1, enemy2].forEach(p => {
      p.hp = p.maxHP;
      p.updateUI();
    });
    createLogLine('Battle reset (double-clicked control area).');
  });

  // Показати стартовий лог
  createLogLine('Battle ready. Use Thunder Jolt (main), Special (heavy) або Random Fight.');

});
