// ═══════════════════════════════════════════════
//  GENETICS — Движок генетики окраса мейн-куна v2
// ═══════════════════════════════════════════════

// Разобрать генетическую формулу строки, напр. "AABbDdOoIiss TaTa McMc"
// gender: 'male' | 'female'
export function parseFormula(formula, gender) {
  if (!formula || typeof formula !== 'string') return {};
  const gt = {};
  const f = formula.replace(/\s+/g, '');

  const matchPair = (rx) => {
    const m = f.match(rx);
    return m ? [m[1], m[2]] : null;
  };

  const A = matchPair(/([Aa])([Aa])/);
  const D = matchPair(/([Dd])([Dd])/);
  const I = matchPair(/([Ii])([Ii])/);
  const W = matchPair(/([Ww])([Ww])/);
  const S = matchPair(/([Ss])([Ss])/);

  if (A) gt.A = A;
  if (D) gt.D = D;
  if (I) gt.I = I;
  if (W) gt.W = W;
  if (S) gt.S = S;

  // B-локус: сначала ищем b1 (корица), потом обычный b
  if (/b1b1/.test(f)) {
    gt.B = ['b1', 'b1'];
  } else {
    const b1b = f.match(/b1([Bb])/);
    const bb1 = f.match(/([Bb])b1/);
    if (b1b) gt.B = ['b1', b1b[1]];
    else if (bb1) gt.B = [bb1[1], 'b1'];
    else {
      const B = matchPair(/([Bb])([Bb])/);
      if (B) gt.B = B;
    }
  }

  // Ta-локус (тиккированный) — двухсимвольный аллель
  const TaRx = f.match(/(Ta|ta)(Ta|ta)/);
  if (TaRx) gt.Ta = [TaRx[1], TaRx[2]];

  // Mc-локус (тигровый/мраморный) — двухсимвольный аллель
  const McRx = f.match(/(Mc|mc)(Mc|mc)/);
  if (McRx) gt.Mc = [McRx[1], McRx[2]];

  // O — сцепленный с X
  if (gender === 'female') {
    const O = matchPair(/([Oo])([Oo])/);
    if (O) gt.O = O;
  } else {
    // Самец: один аллель. Ищем XO / Xo или просто O/o одиночный
    const mo = f.match(/X([Oo])/);
    if (mo) {
      gt.O = [mo[1]];
    } else {
      const single = f.match(/(?<![A-Za-z])([Oo])(?![Oo])/);
      if (single) gt.O = [single[1]];
    }
  }

  return gt;
}

// Вывести генотип из полей EMS питомца
// Возвращает объект с известными локусами
export function inferFromEMS(pet) {
  if (!pet) return {};
  const { emsColor, emsSilver, emsWhite, emsPattern, gender } = pet;
  const gt = {};
  const isFemale = gender === 'female';

  switch (emsColor) {
    case 'w':
      // Белый: мог унаследовать WW или Ww — null означает неизвестный второй аллель
      gt.W = ['W', null];
      break;
    case 'n': // чёрный
      gt.D = ['D', null];
      gt.O = isFemale ? ['o', 'o'] : ['o'];
      gt.W = ['w', 'w'];
      break;
    case 'a': // голубой (разбавленный чёрный)
      gt.D = ['d', 'd'];
      gt.O = isFemale ? ['o', 'o'] : ['o'];
      gt.W = ['w', 'w'];
      break;
    case 'd': // красный/рыжий
      // КРИТИЧЕСКИ ВАЖНО: рыжий НЕ разбавленный — минимум один D
      gt.D = ['D', null];
      gt.O = isFemale ? ['O', 'O'] : ['O'];
      gt.W = ['w', 'w'];
      break;
    case 'e': // кремовый (разбавленный рыжий)
      gt.D = ['d', 'd'];
      gt.O = isFemale ? ['O', 'O'] : ['O'];
      gt.W = ['w', 'w'];
      break;
    case 'f': // черепаховый: гетерозиготная O/o, плотная
      gt.D = ['D', null];
      gt.O = ['O', 'o'];
      gt.W = ['w', 'w'];
      break;
    case 'g': // голубо-кремовый: разбавленная черепаховая
      gt.D = ['d', 'd'];
      gt.O = ['O', 'o'];
      gt.W = ['w', 'w'];
      break;
    // B-локус — шоколадный/лиловый/корица/фавн
    case 'b': // шоколадный
      gt.B = ['b', 'b'];
      gt.D = ['D', null];
      gt.O = isFemale ? ['o', 'o'] : ['o'];
      gt.W = ['w', 'w'];
      break;
    case 'c': // лиловый (шоколад + разбавление)
      gt.B = ['b', 'b'];
      gt.D = ['d', 'd'];
      gt.O = isFemale ? ['o', 'o'] : ['o'];
      gt.W = ['w', 'w'];
      break;
    case 'h': // шоколадно-черепаховый
      gt.B = ['b', 'b'];
      gt.D = ['D', null];
      gt.O = ['O', 'o'];
      gt.W = ['w', 'w'];
      break;
    case 'i': // лилово-черепаховый
      gt.B = ['b', 'b'];
      gt.D = ['d', 'd'];
      gt.O = ['O', 'o'];
      gt.W = ['w', 'w'];
      break;
    case 'j': // коричный (корица)
      gt.B = ['b1', 'b1'];
      gt.D = ['D', null];
      gt.O = isFemale ? ['o', 'o'] : ['o'];
      gt.W = ['w', 'w'];
      break;
    case 'k': // фавн (корица + разбавление)
      gt.B = ['b1', 'b1'];
      gt.D = ['d', 'd'];
      gt.O = isFemale ? ['o', 'o'] : ['o'];
      gt.W = ['w', 'w'];
      break;
  }

  // Серебро/дым: null для неизвестного второго аллеля (мог быть II или Ii)
  gt.I = emsSilver ? ['I', null] : ['i', 'i'];

  // Белая пятнистость: различаем степени
  // '01'=ван, '02'=арлекин → скорее всего SS (гомозигота)
  // '03'=биколор, '09'=spotted → Ss или SS (неизвестно)
  if (emsWhite === '01' || emsWhite === '02') {
    gt.S = ['S', 'S']; // ван/арлекин — гомозиготный SS вероятен
  } else if (emsWhite) {
    gt.S = ['S', null]; // биколор/spotted — Ss или SS
  } else {
    gt.S = ['s', 's'];
  }

  // Паттерн агути:
  // - Солид (нет паттерна) = точно aa (нон-агути)
  // - Есть паттерн = минимум один A (агути)
  if (emsPattern) {
    gt.A = ['A', null];
  } else if (emsColor && emsColor !== 'w') {
    // Нет паттерна = солид = aa
    gt.A = ['a', 'a'];
  }

  // Паттерн: Ta-локус (тиккированный доминирует над всеми другими паттернами)
  if (emsPattern === '25' || emsPattern === '11' || emsPattern === '12') {
    // 25 = тиккированный, 11/12 = шейдед/шелл (тиккированный + серебро)
    gt.Ta = ['Ta', null];
  } else if (emsPattern && emsPattern !== '25') {
    // Другие паттерны (22, 23, 24) = нетиккированный
    gt.Ta = ['ta', 'ta'];
  }

  // Паттерн: Mc-локус (тигровый vs мраморный)
  if (emsPattern === '23' || emsPattern === '24') {
    gt.Mc = ['Mc', null]; // тигровый/пятнистый — доминантный
  } else if (emsPattern === '22') {
    gt.Mc = ['mc', 'mc']; // мраморный — рецессивный
  }

  return gt;
}

// Объединить формулу и EMS-вывод. Формула имеет приоритет.
export function getGenotype(pet) {
  if (!pet) return {};
  const fromEMS = inferFromEMS(pet);
  const fromFormula = parseFormula(pet.geneticFormula || '', pet.gender);
  return { ...fromEMS, ...fromFormula };
}

// Скрестить один аутосомный локус
// a=[a1,a2], b=[b1,b2] (могут содержать null — неизвестный аллель)
// Поддерживает многосимвольные аллели (Ta, ta, Mc, mc, b1)
// Возвращает [{alleles:[x,y], prob}] или null если нет данных
function crossLocus(a, b) {
  if (!a || !b) return null;
  const aKnown = a.filter(Boolean);
  const bKnown = b.filter(Boolean);
  if (aKnown.length === 0 || bKnown.length === 0) return null;

  // Используем \x00 как разделитель — никогда не встречается в именах аллелей
  const resultMap = {};
  for (const x of aKnown) {
    for (const y of bKnown) {
      const pair = [x, y].sort();
      const key = pair[0] + '\x00' + pair[1];
      if (!resultMap[key]) resultMap[key] = { alleles: pair, count: 0 };
      resultMap[key].count++;
    }
  }

  const total = aKnown.length * bKnown.length;
  return Object.values(resultMap).map(({ alleles, count }) => ({
    alleles,
    prob: count / total,
  }));
}

// Скрестить X-сцепленный локус O
// damO=[O1,O2] (2 аллеля самки), sireO=[O] (1 аллель самца)
// Возвращает { female: [{alleles, prob}], male: [{alleles, prob}] }
function crossOLocus(damO, sireO) {
  if (!damO || !sireO) return null;
  const dKnown = damO.filter(Boolean);
  const sKnown = sireO.filter(Boolean);
  if (dKnown.length === 0 || sKnown.length === 0) return null;

  // Самка получает: от матери один аллель + от отца один аллель
  // Самец получает: от матери один аллель (Y от отца)
  const femaleResults = {};
  const maleResults = {};

  for (const dm of dKnown) {
    for (const s of sKnown) {
      // Самка: dam-allele + sire-allele (O — однобуквенный, key как строка)
      const fKey = [dm, s].sort().join('');
      femaleResults[fKey] = (femaleResults[fKey] || 0) + 1;
      // Самец: только dam-allele (от матери)
      maleResults[dm] = (maleResults[dm] || 0) + 1;
    }
  }

  const fTotal = dKnown.length * sKnown.length;
  const mTotal = dKnown.length * sKnown.length;

  return {
    female: Object.entries(femaleResults).map(([k, c]) => ({
      alleles: [k[0], k[1]],
      prob: c / fTotal,
    })),
    male: Object.entries(maleResults).map(([k, c]) => ({
      alleles: [k[0]],
      prob: c / mTotal,
    })),
  };
}

// Преобразовать генотип в информацию об окрасе и паттерне
// Возвращает { emsColor, emsSilver, hasSpotting, isTabby, emsPattern, isWW }
function genotypeToColor(gt, gender) {
  // Белый доминантный (W) — эпистатичный, перекрывает всё
  if (gt.W && gt.W.includes('W')) {
    const isWW = gt.W[0] === 'W' && gt.W[1] === 'W';
    return { emsColor: 'w', emsSilver: false, hasSpotting: false, spottingType: null, isTabby: false, emsPattern: null, isWW };
  }

  const isFemale = gender === 'female';
  const O = gt.O || [];
  const D = gt.D || [];
  const I = gt.I || [];
  const B = gt.B || [];

  // Определяем рыжий/черепаховый по O-локусу
  let isOrange = false;
  let isTortie = false;

  if (isFemale) {
    const hasOO = O[0] === 'O' && O[1] === 'O';
    const hasOo = (O[0] === 'O' && O[1] === 'o') || (O[0] === 'o' && O[1] === 'O');
    isOrange = hasOO;
    isTortie = hasOo;
  } else {
    isOrange = O[0] === 'O';
  }

  const isDilute = D[0] === 'd' && D[1] === 'd';
  const emsSilver = I.includes('I');

  // Белая пятнистость: определяем тип по степени (SS → ван, Ss → биколор)
  let spottingType = null;
  if (gt.S && gt.S.includes('S')) {
    const isSS = gt.S[0] === 'S' && gt.S[1] === 'S';
    spottingType = isSS ? 'van' : 'bicolor';
  }
  const hasSpotting = spottingType !== null;

  // B-локус: B > b > b1 (доминирование)
  // hasCapB=true → чёрная основа; isCinnamon → корица; иначе → шоколад
  const hasCapB = B.length === 0 || B.includes('B');
  const isCinnamon = !hasCapB && B.length >= 2 && B.every(a => a === 'b1');
  const isChocolate = !hasCapB && !isCinnamon;

  let emsColor = 'n';

  if (isOrange) {
    emsColor = isDilute ? 'e' : 'd';
  } else if (isTortie) {
    if (isChocolate) {
      emsColor = isDilute ? 'i' : 'h'; // лилово- или шоколадно-черепаховый
    } else {
      emsColor = isDilute ? 'g' : 'f';
    }
  } else {
    if (isCinnamon) {
      emsColor = isDilute ? 'k' : 'j';
    } else if (isChocolate) {
      emsColor = isDilute ? 'c' : 'b';
    } else {
      emsColor = isDilute ? 'a' : 'n';
    }
  }

  // Определяем паттерн по A/Ta/Mc локусам
  let emsPattern = null;
  const isAgouti = gt.A ? gt.A.includes('A') : null;

  if (isAgouti !== false) {
    // Есть агути (или неизвестно) — определяем паттерн
    const Ta = gt.Ta || [];
    const Mc = gt.Mc || [];

    if (Ta.includes('Ta')) {
      // Тиккированный доминирует над всеми
      emsPattern = '25';
    } else if (Ta.length > 0 && !Ta.includes('Ta')) {
      // ta/ta — паттерн по Mc
      if (Mc.includes('Mc')) {
        emsPattern = '23'; // тигровый
      } else if (Mc.length >= 2 && Mc[0] === 'mc' && Mc[1] === 'mc') {
        emsPattern = '22'; // мраморный
      }
    } else if (Mc.includes('Mc')) {
      // Ta неизвестен, но есть Mc
      emsPattern = '23';
    } else if (Mc.length >= 2 && Mc[0] === 'mc' && Mc[1] === 'mc') {
      emsPattern = '22';
    }
  }

  const isTabby = emsPattern !== null;

  return { emsColor, emsSilver, hasSpotting, spottingType, isTabby, emsPattern, isWW: false };
}

// Декартово произведение локусов
// lociMap = { A: [{alleles, prob}], D: [...], ... }
// Возвращает [{alleles: {A:[x,y], D:[x,y],...}, prob}]
function cartesian(lociMap) {
  const keys = Object.keys(lociMap);
  if (keys.length === 0) return [{ alleles: {}, prob: 1 }];

  let results = [{ alleles: {}, prob: 1 }];

  for (const key of keys) {
    const locus = lociMap[key];
    if (!locus || locus.length === 0) continue;
    const next = [];
    for (const existing of results) {
      for (const entry of locus) {
        next.push({
          alleles: { ...existing.alleles, [key]: entry.alleles },
          prob: existing.prob * entry.prob,
        });
      }
    }
    results = next;
  }

  return results;
}

// Основное предсказание потомства
// Возвращает [{emsColor, emsSilver, hasSpotting, isTabby, emsPattern, isWW, gender, prob}]
// Отсортировано по убыванию вероятности, одинаковые фенотипы объединены
export function predictOffspring(sire, dam) {
  const sireGt = getGenotype(sire);
  const damGt  = getGenotype(dam);

  const hasData = Object.keys(sireGt).length > 0 && Object.keys(damGt).length > 0;
  if (!hasData) return [];

  // Скрещиваем аутосомные локусы
  const autosomalLoci = ['A', 'B', 'D', 'I', 'W', 'S', 'Ta', 'Mc'];
  const autoCrossed = {};

  for (const locus of autosomalLoci) {
    const s = sireGt[locus];
    const d = damGt[locus];
    if (s && d) {
      const crossed = crossLocus(s, d);
      if (crossed) autoCrossed[locus] = crossed;
    }
  }

  // Скрещиваем O (X-сцепленный)
  const oCrossed = crossOLocus(damGt.O, sireGt.O);
  const hasOData = oCrossed !== null;

  const allOffspring = [];

  for (const sexLabel of ['female', 'male']) {
    let oVariants = null;
    if (hasOData) {
      oVariants = sexLabel === 'female' ? oCrossed.female : oCrossed.male;
    }

    const lociMap = { ...autoCrossed };
    if (oVariants && oVariants.length > 0) {
      lociMap.O = oVariants;
    }

    if (Object.keys(lociMap).length === 0) continue;

    const combinations = cartesian(lociMap);

    for (const combo of combinations) {
      const colorInfo = genotypeToColor(combo.alleles, sexLabel);
      // 50% вероятность каждого пола
      allOffspring.push({
        ...colorInfo,
        gender: sexLabel,
        prob: combo.prob * 0.5,
      });
    }
  }

  return mergePhenotypes(allOffspring);
}

// Объединить одинаковые фенотипы
function mergePhenotypes(offspring) {
  const map = {};
  for (const o of offspring) {
    const key = `${o.emsColor}|${o.emsSilver}|${o.spottingType}|${o.emsPattern}|${o.gender}`;
    if (map[key]) {
      map[key].prob += o.prob;
    } else {
      map[key] = { ...o };
    }
  }
  return Object.values(map).sort((a, b) => b.prob - a.prob);
}

// Анализ совместимости по генетическим тестам
// HCM, PKD, Pd — аутосомно-доминантные.
// SMA, GSD IV, PK — аутосомно-рецессивные.
// Возвращает [{test, level:'danger'|'warning'|'ok', msg}]
export function analyzeCompatibility(sire, dam) {
  const results = [];
  const dominantTests  = ['HCM', 'PKD', 'Pd'];
  const recessiveTests = ['SMA', 'GSD IV', 'PK'];
  const allTests = [...dominantTests, ...recessiveTests];

  for (const test of allTests) {
    const sireResult = sire?.geneticTests?.[test] || 'unknown';
    const damResult  = dam?.geneticTests?.[test]  || 'unknown';

    if (sireResult === 'unknown' && damResult === 'unknown') continue;

    const isDominant = dominantTests.includes(test);
    const item = analyzeTestPair(test, sireResult, damResult, isDominant);
    if (item) results.push(item);
  }

  return results;
}

// Анализ одной пары тестов
function analyzeTestPair(test, sireR, damR, isDominant) {
  const sireCarrier = sireR !== 'N/N' && sireR !== 'unknown';
  const damCarrier  = damR  !== 'N/N' && damR  !== 'unknown';

  if (!sireCarrier && !damCarrier) {
    return { test, level: 'ok', msg: `${test}: оба родителя чисты — риска нет` };
  }

  if (isDominant) {
    if (sireCarrier || damCarrier) {
      const who = sireCarrier ? 'Отец' : 'Мать';
      return { test, level: 'danger', msg: `${test}: ${who} носитель/болен — риск передачи потомству` };
    }
  } else {
    // Рецессивный — опасен только если оба носители
    if (sireCarrier && damCarrier) {
      return { test, level: 'danger', msg: `${test}: оба носителя — 25% риск больного потомства` };
    }
    const who = sireCarrier ? 'Отец' : 'Мать';
    return { test, level: 'warning', msg: `${test}: ${who} носитель — потомство может быть носителем` };
  }

  return null;
}

// Рассчитать коэффициент инбридинга Райта для гипотетического потомка
// allPets — массив всех питомцев из state.pets (для Fa-расчёта и 5 поколений через БД)
// Возвращает { F, topAncestors: [{name, contrib}] }
export function calcOffspringInbreeding(sire, dam, allPets = []) {
  if (!sire || !dam) return { F: 0, topAncestors: [] };

  const sireAnc = buildAncestors(sire);
  const damAnc  = buildAncestors(dam);

  const contributions = {};
  let F = 0;

  for (const sa of sireAnc) {
    for (const da of damAnc) {
      if (sa.name && sa.name === da.name) {
        const Fa = getAncestorFa(sa.name, allPets);
        const contrib = Math.pow(0.5, sa.d + da.d + 1) * (1 + Fa);
        F += contrib;
        contributions[sa.name] = (contributions[sa.name] || 0) + contrib;
      }
    }
  }

  // Топ-3 общих предка по вкладу в F
  const topAncestors = Object.entries(contributions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, contrib]) => ({
      // Капитализируем имя для отображения
      name: name.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' '),
      contrib: Math.round(contrib * 10000) / 100,
    }));

  return {
    F: Math.round(F * 10000) / 100,
    topAncestors,
  };
}

// Рассчитать коэффициент инбридинга Fa для общего предка (рекурсивно, 1 уровень)
// Ищет предка в allPets по имени и считает его инбридинг из его pedigree
function getAncestorFa(ancestorName, allPets, visited = new Set()) {
  const norm = s => (s || '').trim().toLowerCase();
  const key = norm(ancestorName);
  if (!key || visited.has(key)) return 0;
  visited.add(key);

  const pet = allPets.find(p => norm(p.name) === key);
  if (!pet || !pet.father?.name || !pet.mother?.name) return 0;

  // Ищем родителей предка в базе
  const fatherKey = norm(pet.father.name);
  const motherKey = norm(pet.mother.name);
  const fatherPet = allPets.find(p => norm(p.name) === fatherKey);
  const motherPet = allPets.find(p => norm(p.name) === motherKey);
  if (!fatherPet || !motherPet) return 0;

  const fAnc = buildAncestors(fatherPet);
  const mAnc = buildAncestors(motherPet);

  let Fa = 0;
  for (const fa of fAnc) {
    for (const ma of mAnc) {
      if (fa.name && fa.name === ma.name) {
        // Рекурсия: Fa самого общего предка (с защитой от петель)
        const subFa = getAncestorFa(fa.name, allPets, new Set(visited));
        Fa += Math.pow(0.5, fa.d + ma.d + 1) * (1 + subFa);
      }
    }
  }
  return Fa;
}

// Построить список предков питомца с расстоянием (до 5 поколений)
function buildAncestors(pet) {
  if (!pet) return [];
  const norm = s => (s || '').trim().toLowerCase();
  const p = pet.pedigree || [];

  const ancs = [];

  // I поколение — родители (d=1)
  if (pet.father?.name) ancs.push({ name: norm(pet.father.name), d: 1 });
  if (pet.mother?.name) ancs.push({ name: norm(pet.mother.name), d: 1 });

  // II поколение — деды (d=2): pedigree[0..3]
  for (let i = 0; i <= 3; i++) {
    if (p[i]?.name) ancs.push({ name: norm(p[i].name), d: 2 });
  }

  // III поколение — прадеды (d=3): pedigree[4..11]
  for (let i = 4; i <= 11; i++) {
    if (p[i]?.name) ancs.push({ name: norm(p[i].name), d: 3 });
  }

  // IV поколение (d=4): pedigree[12..27]
  for (let i = 12; i <= 27; i++) {
    if (p[i]?.name) ancs.push({ name: norm(p[i].name), d: 4 });
  }

  // V поколение (d=5): pedigree[28..59]
  for (let i = 28; i <= 59; i++) {
    if (p[i]?.name) ancs.push({ name: norm(p[i].name), d: 5 });
  }

  return ancs;
}
