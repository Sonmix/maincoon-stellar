// ═══════════════════════════════════════════════
//  I18N — Модуль локализации (RU → EN)
//  Архитектура: DOM-overlay через TreeWalker + data-i18n атрибуты
//  Вызывается после каждого рендера при state.lang === 'en'
// ═══════════════════════════════════════════════
import { state } from './state.js';

// ── Словарь переводов (ключ = русский текст) ──────────────────────────────

const DICT = {
  // ── Навигация ──
  'Питомник':          'Cattery',
  'Прогноз вязки':     'Breeding Forecast',
  'Журнал':            'Journal',
  'Пометы':            'Litters',
  'Поколения':         'Generations',
  'Карта поколений':   'Generation Map',
  'Вязки':             'Breeding',

  // ── Хедер / кнопки ──
  'Экспорт данных':    'Export Data',
  'Настройки':         'Settings',

  // ── Сайдбар питомника ──
  'Поиск по имени, EMS...': 'Search by name, EMS...',
  'Все':               'All',
  '♀ Кошки':           '♀ Females',
  '♂ Коты':            '♂ Males',
  'Активные':          'Active',
  'Нет питомцев':      'No pets',
  'Добавить питомца':  'Add Pet',
  'Удалить питомца':   'Delete Pet',
  'Выберите питомца из списка': 'Select a pet from the list',
  'МОЙ':               'OWN',
  'ЧУЖ':               'EXT',

  // ── Модал добавления питомца ──
  '✦ Добавить питомца':       '✦ Add Pet',
  'Полное имя животного':     'Full name of the animal',
  'Мой питомник':             'My Cattery',
  'Другой питомник':          'Other Cattery',
  'Название питомника':       'Cattery name',
  'Пол':                      'Gender',
  '♀ Кошка':                  '♀ Female',
  '♂ Кот':                    '♂ Male',
  'Дата рождения':            'Date of birth',
  'EMS-код':                  'EMS code',
  'Статус':                   'Status',
  'Активный':                 'Active',
  'Кастрат':                  'Neutered',
  'Добавить':                 'Add',
  'Отмена':                   'Cancel',

  // ── Модал родословной ──
  '✦ Родословная':            '✦ Pedigree',

  // ── Модал подтверждения ──
  'Подтверждение':            'Confirmation',
  'Удалить':                  'Delete',

  // ── Сообщения об ошибках / тосты ──
  'Введите имя питомца':               'Enter pet name',
  'Питомец удалён':                    'Pet deleted',
  'Помёт удалён':                      'Litter deleted',
  'Помёт добавлен':                    'Litter added',
  'Тема изменена':                     'Theme changed',
  'Тема: Stellar 🌌':                  'Theme: Stellar 🌌',
  'Тема: Dark 🌙':                     'Theme: Dark 🌙',
  'Тема: Light ☀️':                    'Theme: Light ☀️',
  'Язык: RU':                          'Language: RU',
  'Язык: EN':                          'Language: EN',
  'Укажите хотя бы одного родителя':   'Please specify at least one parent',
  'Выберите хотя бы одну секцию':      'Select at least one section',
  'Выберите питомца':                  'Select a pet',
  'EMS или генетическая формула обязательны': 'EMS or genetic formula required',
  'Вязка добавлена в Журнал':          'Breeding added to Journal',
  'Фото удалено':                      'Photo removed',
  'Фото загружено':                    'Photo uploaded',
  'Фото обновлено':                    'Photo updated',
  'Котёнок удалён':                    'Kitten deleted',
  'Котёнок добавлен в питомник':       'Kitten added to cattery',
  'Котёнок сохранён':                  'Kitten saved',
  'Котёнок добавлен':                  'Kitten added',
  'Выберите обоих родителей':          'Select both parents',
  'Ошибка при расчёте':                'Calculation error',

  // ── Журнал событий — типы ──
  'Течка':             'Heat',
  'Вязка':             'Breeding',
  'Роды':              'Birth',
  'Заметка':           'Note',
  'Другое':            'Other',
  'Ожид. роды':        'Exp. birth',
  'Ожидаемые роды':    'Expected birth',

  // ── Модал добавления события ──
  '✦ Добавить событие':       '✦ Add Event',
  'Тип события':              'Event type',
  'Дата':                     'Date',
  'Название события':         'Event title',
  'Питомец':                  'Pet',
  'Партнёр (кот)':            'Partner (male)',
  'Описание':                 'Description',
  '— Выбрать —':              '— Select —',
  '— Из базы —':              '— From database —',
  'Или введите имя вручную...': 'Or enter name manually...',
  'Дополнительные заметки...': 'Additional notes...',

  // ── Месяцы ──
  'Январь':    'January',
  'Февраль':   'February',
  'Март':      'March',
  'Апрель':    'April',
  'Май':       'May',
  'Июнь':      'June',
  'Июль':      'July',
  'Август':    'August',
  'Сентябрь':  'September',
  'Октябрь':   'October',
  'Ноябрь':    'November',
  'Декабрь':   'December',

  // ── Дни недели ──
  'Пн': 'Mo',
  'Вт': 'Tu',
  'Ср': 'We',
  'Чт': 'Th',
  'Пт': 'Fr',
  'Сб': 'Sa',
  'Вс': 'Su',

  // ── Пометы — сайдбар ──
  'Помётов не найдено':    'No litters found',

  // ── Пометы — детали ──
  '✦ Добавить помёт':         '✦ Add Litter',
  'Название помёта':          'Litter name',
  'Мать (кошка)':             'Mother (female)',
  'Отец (кот)':               'Father (male)',
  'Заметки':                  'Notes',
  '— Выбрать кошку —':        '— Select female —',
  'Добавить помёт':           'Add Litter',
  'Удалить помёт':            'Delete Litter',
  'Удалить помёт?':           'Delete litter?',
  'Помёт и все его котята будут удалены без возможности восстановления.':
    'The litter and all its kittens will be permanently deleted.',
  'Все годы':                 'All years',
  'Особенности помёта, условия и т.д...': 'Litter details, conditions, etc...',
  'Выберите помёт':           'Select a litter',
  'или добавьте новый':       'or add a new one',
  'Всего':                    'Total',
  'Ждут':                     'Waiting',
  'Остаются':                 'Staying',
  'Проданы':                  'Sold',
  'Котята помёта':            'Litter kittens',
  'Добавить котёнка':         'Add kitten',
  'Котята не добавлены. Нажмите «Добавить котёнка».':
    'No kittens added. Click "Add kitten".',

  // ── Котята ──
  '✦ Добавить котёнка':       '✦ Add Kitten',
  '✦ Редактировать котёнка':  '✦ Edit Kitten',
  'Имя':                      'Name',
  'Вес при рождении (г)':     'Birth weight (g)',
  'EMS-код окраса':           'Coat EMS code',
  'Тип шерсти':               'Coat type',
  '— Не указан —':            '— Not specified —',
  'Шелковистая':               'Silky',
  'Мягкая':                   'Soft',
  'Жёсткая':                  'Coarse',
  'Очень мягкая':              'Very soft',
  'Имя котёнка (можно оставить пустым)': "Kitten's name (can be empty)",
  'Например: 120':             'e.g. 120',
  'Сохранить':                 'Save',
  'Без имени':                 'No name',
  'Рождение':                  'Birth date',
  'Вес при рожд.':             'Birth weight',
  '⏳ Ожидает хозяев':         '⏳ Awaiting owners',
  '✓ Продан':                  '✓ Sold',
  '★ Остаётся':                '★ Staying',
  'В питомнике':               'In cattery',
  '→ В питомник':              '→ To cattery',
  'Удалить котёнка?':          'Delete kitten?',

  // ── Карточка питомца — view mode ──
  'Удалить фото?':            'Delete photo?',
  'Фото будет удалено без возможности восстановления.': 'Photo will be permanently deleted.',
  'Назад':                    'Back',
  'Редактировать':            'Edit',
  'Сохранить изменения':      'Save changes',
  'Родословная':              'Pedigree',
  'Фото':                     'Photo',
  'Загрузить фото':           'Upload photo',
  'Удалить фото':             'Remove photo',
  'Открыть / сменить фото':   'Open / change photo',
  'Нажмите, чтобы загрузить фото': 'Click to upload photo',
  'Вес, кг':                  'Weight, kg',
  'Высота в холке, см':       'Withers height, cm',
  'Длина тела, см':           'Body length, cm',
  'Длина хвоста, см':         'Tail length, cm',
  'EMS / Генетика':           'EMS / Genetics',
  'Цвет:':                    'Color:',
  'Паттерн:':                 'Pattern:',
  'Серебро:':                 'Silver:',
  'Белое:':                   'White:',
  '✓ Есть':                   '✓ Yes',
  'Генетическая формула':     'Genetic formula',
  'Анализ внешности':         'Appearance Analysis',
  'Соответствие стандарту':   'Standard compliance',
  'Характер и поведение':     'Character & Behavior',
  'Родители и происхождение': 'Parents & Origin',
  '♂ Отец':                   '♂ Father',
  '♀ Мать':                   '♀ Mother',
  'не в базе':                'not in database',
  'Проект вязки':             'Breeding Project',
  'не проводился':            'not tested',
  '✓ Есть':                   '✓ Yes',
  'Коробочка':                'Muzzle',
  'Кисточки':                 'Ear tufts',

  // Блоки детальной карточки (data-i18n)
  'Основные данные':          'General Info',
  'EMS и генетика':           'EMS & Genetics',
  'Экстерьер':                'Exterior',
  'Характер':                 'Traits',
  'Генетические тесты':       'Genetic Tests',

  'Возраст':                  'Age',
  'Неизвестно':               'Unknown',
  'нет данных':               'no data',

  // Метрики
  'Вес':                      'Weight',
  'Высота в холке':           'Withers height',
  'Длина тела':               'Body length',
  'Длина хвоста':             'Tail length',
  'кг':                       'kg',
  'см':                       'cm',

  // EMS расшифровка
  'EMS-код':                  'EMS code',
  'Серебро':                  'Silver',
  'Белый':                    'White',
  'Доп. белый':               'White spotting',

  // ── Карточка питомца — edit mode ──
  'Режим редактирования':     'Edit Mode',
  'Сменить фото':             'Change photo',
  'Полное имя':               'Full name',
  'Тип питомника':            'Cattery type',
  'Метрики и EMS':            'Metrics & EMS',
  'Описание EMS':             'EMS description',
  'Ген. формула':             'Gen. formula',
  'Базовый цвет':             'Base color',
  'Паттерн':                  'Pattern',
  'Серебро / дым':            'Silver / smoke',
  'Нет':                      'No',
  'Есть':                     'Yes',
  'Белое пятно':              'White spotting',
  'Титулы и теги':            'Titles & tags',
  'Не проводился':            'Not tested',
  'N/N (Здоров)':             'N/N (Healthy)',
  'Костяк':                   'Skeleton',
  'Коробочка / морда':        'Muzzle',
  'Подшерсток':               'Undercoat',
  'Жабо':                     'Ruff',
  'Кисточки на ушах':         'Ear tufts',
  'Форма глаз':               'Eye shape',
  'Родители и родословная':   'Parents & Pedigree',
  'II поколение — Деды и бабки': 'Gen II — Grandparents',
  'III поколение — Прадеды':  'Gen III — Great-grandparents',
  'IV поколение — Прапрадеды (16)': 'Gen IV — Great-great-grandparents (16)',
  'V поколение — 5-е колено (32)': 'Gen V — 5th generation (32)',
  'Отец отца':                "Father's father",
  'Мать отца':                "Father's mother",
  'Отец матери':              "Mother's father",
  'Мать матери':              "Mother's mother",
  'Другой':                   'Other',
  'Мой':                      'Mine',
  '— не указано —':           '— not specified —',

  // ── Генетические тесты ──
  'Здоров. Безопасен для разведения по HCM.': 'Healthy. Safe for breeding (HCM).',
  'Носитель. Риск передачи потомству.':        'Carrier. Risk of passing to offspring.',
  'Больной. Не рекомендован для разведения.': 'Affected. Not recommended for breeding.',
  'Почки в норме.':                            'Kidneys normal.',
  'Носитель поликистоза.':                    'Carrier of polycystic kidney disease.',
  'Поликистоз подтверждён.':                  'PKD confirmed.',
  'Норма.':                                   'Normal.',
  'Носитель спинальной атрофии.':             'Carrier of spinal muscular atrophy.',
  'Заболевание подтверждено.':                'Disease confirmed.',
  'Норма. Гликогеноз не обнаружен.':          'Normal. GSD IV not detected.',
  'Тестирование не проводилось.':             'Not tested.',
  'Норма. Пируваткиназная недостаточность не обнаружена.': 'Normal. PK deficiency not detected.',
  'Заболевание подтверждено. Гемолитическая анемия.': 'Disease confirmed. Hemolytic anemia.',
  'Норма. Полидактилия не выявлена.':          'Normal. Polydactyly not detected.',
  'Носитель/фенотип (аутосомно-доминантный). Возможна полидактилия.': 'Carrier/phenotype (autosomal dominant). Polydactyly possible.',
  'Гомозиготный. Полидактилия подтверждена.': 'Homozygous. Polydactyly confirmed.',

  // ── EMS цвета ──
  'Чёрный':             'Black',
  'Голубой':            'Blue',
  'Красный':            'Red',
  'Кремовый':           'Cream',
  'Черепаховый':        'Tortoiseshell',
  'Голубо-кремовый':    'Blue-cream',
  'Белый':              'White',
  'Шоколадный':         'Chocolate',
  'Лиловый':            'Lilac',
  'Шоколадно-черепаховый': 'Chocolate tortoiseshell',
  'Лилово-черепаховый': 'Lilac tortoiseshell',
  'Коричный':           'Cinnamon',
  'Фавн':               'Fawn',

  // ── EMS паттерны ──
  'Shaded (затушеванный)': 'Shaded',
  'Shell (типпированный)': 'Shell (tipped)',
  'Мраморный':          'Classic tabby',
  'Тигровый':           'Mackerel tabby',
  'Пятнистый':          'Spotted tabby',
  'Тиккированный':      'Ticked tabby',

  // ── EMS глаза ──
  'Голубые':            'Blue',
  'Оранжевые':          'Orange',
  'Зелёные':            'Green',

  // ── Черты характера ──
  'Ласковая':           'Affectionate',
  'Игривая':            'Playful',
  'Общительная':        'Sociable',
  'Любопытная':         'Curious',
  'Уравновешенная':     'Balanced',
  'Независимая':        'Independent',
  'Активная':           'Active',
  'Спокойная':          'Calm',
  'Привязчивая':        'Attached',
  'Осторожная':         'Cautious',
  'Смелая':             'Brave',
  'Доминирующая':       'Dominant',
  'Нежная':             'Gentle',
  'Говорливая':         'Talkative',
  'Шумная':             'Noisy',
  'Тихая':              'Quiet',

  // ── Экстерьер — поля ──
  'Скелет':             'Skeleton',
  'Корпус':             'Body',
  'Голова':             'Head',
  'Мордочка':           'Muzzle',
  'Подбородок':         'Chin',
  'Нос':                'Nose',
  'Профиль':            'Profile',
  'Шерсть':             'Coat',
  'Подшёрсток':         'Undercoat',
  'Грива':              'Ruff',
  'Хвост':              'Tail',
  'Штаны':              'Pants',
  'Живот':              'Belly',
  'Уши':                'Ears',
  'Кисточки ушей':      'Ear tufts',
  'Глаза':              'Eyes',
  'Цвет глаз':          'Eye color',

  // ── Экстерьер — значения опций (APPEARANCE_OPTIONS) ──
  'широкий тяжелый':    'wide, heavy',
  'широкий легкий':     'wide, light',
  'средний тяжелый':    'medium, heavy',
  'средний легкий':     'medium, light',
  'узкий тяжелый':      'narrow, heavy',
  'узкий легкий':       'narrow, light',
  'вытянутый':          'elongated',
  'квадратный':         'square',
  'квадратная':         'square',
  'недостаточно квадратная': 'not sufficiently square',
  'прямоугольная, очень широкая, средней длины':   'rectangular, very wide, medium',
  'прямоугольная, очень широкая, длинная':         'rectangular, very wide, long',
  'прямоугольная, очень широкая, короткая':        'rectangular, very wide, short',
  'прямоугольная, достаточно широкая, средней длины': 'rectangular, fairly wide, medium',
  'прямоугольная, достаточно широкая, длинная':   'rectangular, fairly wide, long',
  'прямоугольная, достаточно широкая, короткая':  'rectangular, fairly wide, short',
  'прямоугольная, узкая, средней длины':          'rectangular, narrow, medium',
  'прямоугольная, узкая, длинная':                'rectangular, narrow, long',
  'прямоугольная, узкая, короткая':               'rectangular, narrow, short',
  'квадратная, очень широкая, средней длины':     'square, very wide, medium',
  'квадратная, достаточно широкая, средней длины': 'square, fairly wide, medium',
  'квадратная, достаточно широкая, длинная':      'square, fairly wide, long',
  'квадратная, достаточно широкая, короткая':     'square, fairly wide, short',
  'квадратная, узкая, средней длины':             'square, narrow, medium',
  'квадратная, узкая, длинная':                   'square, narrow, long',
  'квадратная, узкая, короткая':                  'square, narrow, short',
  'сильный, массивный':                'strong, massive',
  'сильный, хорошо выраженный':        'strong, well-defined',
  'сильный, недостаточно выраженный':  'strong, insufficiently defined',
  'слабый, хорошо выраженный':         'weak, well-defined',
  'слабый, недостаточно выраженный':   'weak, insufficiently defined',
  'прямой без горбинки':    'straight, no bump',
  'с горбинкой':            'with bump',
  'с сильно выраженной горбинкой': 'with prominent bump',
  'мягкий изогнутый':       'soft curved',
  'резкий изогнутый':       'sharp curved',
  'слишком плавный':        'too smooth',
  'слишком резкий':         'too sharp',
  'шелковистая':            'silky',
  'жесткая':                'coarse',
  'мягкая':                 'soft',
  'очень мягкая':           'very soft',
  'густой, плотный':        'thick, dense',
  'густой':                 'thick',
  'неплотный':              'sparse',
  'практически отсутствует':'almost absent',
  'выражено':               'present',
  'шерсть практически отсутствует': 'almost absent',
  'хорошо опушен':          'well-plumed',
  'плохо опушен':           'poorly plumed',
  'хорошее опушение':       'well-coated',
  'маленькие':              'small',
  'средние':                'medium',
  'большие':                'large',
  'очень большие':          'very large',
  'большие длинные густые': 'large, long, thick',
  'большие широкие густые': 'large, wide, thick',
  'средней длины и густоты': 'medium length and density',
  'маленькие густые':       'small, thick',
  'маленькие редкие':       'small, sparse',
  'высокие редкие':         'tall, sparse',
  'отсутствуют':            'absent',
  'небольшие':              'small',

  // ── Прогноз вязки ──
  '✦ Прогноз вязки':    '✦ Breeding Forecast',
  '✦ ПРОГНОЗ ВЯЗКИ':    '✦ BREEDING FORECAST',
  'Выберите кота и кошку для расчёта потомства': 'Select male and female to forecast',
  '♂ КОТ / ОТЕЦ':       '♂ MALE / SIRE',
  '♀ КОШКА / МАТЬ':     '♀ FEMALE / DAM',
  'Не выбран':          'Not selected',
  'Не выбрана':         'Not selected',
  '— выбрать —':        '— select —',
  'Рассчитать ⚡':       'Calculate ⚡',
  'Результаты':         'Results',
  'Вероятность':        'Probability',
  'Котята':             'Kittens',
  'Инбридинг':          'Inbreeding',
  'Коэффициент Райта':  'Wright coefficient',
  'Нет данных':         'No data',
  'Выберите пару':      'Select a pair',
  'Квадрат Паннета':    'Punnett square',
  'Нет общих предков':  'No common ancestors',
  'Общие предки':       'Common ancestors',
  'Кошка (♀)':          'Female (♀)',
  'Кот (♂)':            'Male (♂)',
  'Выберите питомца...': 'Select a pet...',
  'Очистить':           'Clear',
  'серебристый':        'silver',
  'ван/арлекин':        'van/harlequin',
  'биколор':            'bicolor',
  '(только ♀)':         '(♀ only)',
  'Норма':              'Normal',
  'Высокий':            'High',
  'Умеренный':          'Moderate',
  'Источники инбридинга:': 'Inbreeding sources:',
  'Коэффициент инбридинга (F)': 'Inbreeding coefficient (F)',
  'КВАДРАТ ПАННЕТА — ЛОКУСЫ': 'PUNNETT SQUARE — LOCI',
  'ЛОКУС: Серебро (I)':   'LOCUS: Silver (I)',
  'ЛОКУС: Разбавление (D)': 'LOCUS: Dilution (D)',
  'ЛОКУС: Паттерн (Mc)':  'LOCUS: Pattern (Mc)',
  'серебряный':           'silver',
  'не серебряный':        'non-silver',
  'плотный':              'dense',
  'разбавленный':         'diluted',
  'тигровый':             'mackerel',
  'мраморный':            'classic tabby',
  'гетерозиготный':       'heterozygous',
  'ПОТОМСТВО — ПРОГНОЗ ОКРАСА': 'OFFSPRING — COLOR FORECAST',
  'КОТЯТА ♀':             'KITTENS ♀',
  'КОТЯТА ♂':             'KITTENS ♂',
  'АНАЛИЗ СОВМЕСТИМОСТИ': 'COMPATIBILITY ANALYSIS',
  'Тест':                 'Test',
  'Отец × Мать':          'Sire × Dam',
  'Критических генетических рисков не выявлено': 'No critical genetic risks detected',
  'Недостаточно генетических данных для прогноза окраса.':
    'Insufficient genetic data for color forecast.',
  'Заполните поле «Генетическая формула» или данные EMS у родителей.':
    'Fill in "Genetic formula" or EMS data for parents.',
  'Внимание: возможны WW-гомозиготные котята (100% белых). WW при голубых глазах связан с риском врождённой глухоты.':
    'Warning: WW-homozygous kittens possible (100% white). WW with blue eyes is associated with congenital deafness risk.',

  // ── Карта поколений ──
  '✦ КАРТА ПОКОЛЕНИЙ':  '✦ GENERATION MAP',
  'Центрировать':       'Center',
  'Мой питомник':       'My Cattery',
  'Другой питомник':    'Other Cattery',
  'Родственные связи':  'Family links',
  'Родственная связь':  'Family link',
  'Карта поколений пуста': 'Generation map is empty',
  'Колесо мыши — масштаб · Тяни — перемещение': 'Mouse wheel — zoom · Drag — pan',
  'Добавьте питомцев, чтобы увидеть карту':
    'Add pets to see the map',
  'питомец':            'pet',
  'питомца':            'pets',
  'питомцев':           'pets',

  // ── Экспорт ──
  '✦ Экспорт данных':   '✦ Export Data',
  'Включить в отчёт':   'Include in report',
  'Питомцы':            'Pets',
  'События журнала':    'Journal events',
  'Формат файла':       'File format',
  'Создать отчёт':      'Create report',

  // ── Настройки ──
  '⚙ Настройки':        '⚙ Settings',
  'Внешний вид':        'Appearance',
  'Тема интерфейса':    'Interface theme',
  'Stellar — звёздная космическая · Dark — тёмная · Light — светлая':
    'Stellar — cosmic · Dark — dark · Light — light',
  'Стиль текущей даты в календаре': 'Today highlight style',
  'Как подсвечивается сегодняшний день': 'How today is highlighted',
  'Виньетка':           'Vignette',
  'Точка':              'Dot',
  'Галактика':          'Galaxy',

  // ── Родословная (pedigree.js) ──
  'Отец':               'Father',
  'Мать':               'Mother',
  'Родословная не заполнена': 'Pedigree not filled',
  'I поколение':        'Gen I',
  'II поколение':       'Gen II',
  'III поколение':      'Gen III',
  'IV поколение (16 предков)': 'Gen IV (16 ancestors)',
  'V поколение (32 предка)':   'Gen V (32 ancestors)',
  'Скрыть IV поколение':       'Hide Gen IV',
  'Показать IV поколение':     'Show Gen IV',
  'Скрыть V поколение':        'Hide Gen V',
  'Показать V поколение':      'Show Gen V',

  // ── Модал родословной (openPedigree) ──
  'Животное:':                       'Animal:',
  'I — Родители':                    'I — Parents',
  'II — Деды/бабки':                 'II — Grandparents',
  'III — Прадеды':                   'III — Great-grandparents',
  '♂ Отец отца':                     "♂ Father's father",
  '♀ Мать отца':                     "♀ Father's mother",
  '♂ Отец матери':                   "♂ Mother's father",
  '♀ Мать матери':                   "♀ Mother's mother",
  'Коэффициент инбридинга':          'Inbreeding coefficient',
  'Расчёт по формуле Райта на основании введённых предков.':
    "Calculated using Wright's formula based on recorded ancestors.",
  'Общих предков в указанных поколениях не обнаружено.':
    'No common ancestors found in recorded generations.',
  'Низкий уровень инбридинга — в пределах нормы.':
    'Low inbreeding level — within normal range.',
  'Умеренный инбридинг — рекомендуется проверить пару.':
    'Moderate inbreeding — pair check recommended.',
  'Высокий инбридинг — нежелателен для племенного разведения.':
    'High inbreeding — not recommended for breeding.',

  // ── Placeholders ──
  'Краткий комментарий о характере...': 'Brief character comment...',
  'Полное имя': 'Full name',
  'Например: MCO a 22':               'e.g.: MCO a 22',
  'Например: прививка, осмотр, обработка...': 'e.g.: vaccination, exam, treatment...',
  '— Питомец (опц.) —':               '— Pet (opt.) —',
  '— Выбрать кошку —':                '— Select female —',
  'Авторасчёт (+63 дня от вязки)':    'Auto-calculated (+63 days from breeding)',

  // ── Журнал — дополнительные ──
  'Событие добавлено':         'Event added',
  'Событие удалено':           'Event deleted',
  'Укажите дату события':      'Enter event date',
  'Введите название события':  'Enter event title',
  '⚠ Удалить все события дня': '⚠ Delete all events for this day',
  'Удалить всё':               'Delete all',
  'Удалить событие':           'Delete event',

  // ── Тултип теста ──
  'Информация недоступна.':    'Information unavailable.',

  // ── Питомец — удаление ──
  'Удалить питомца?':          'Delete pet?',

  // ── Danger Zone ──
  '☢ Опасная зона':                         '☢ Danger Zone',
  'Сбросить все данные':                    'Reset all data',
  'Удалит всех питомцев, помёты, журнал и фотографии. Восстановить невозможно.':
    'Deletes all pets, litters, journal and photos. Cannot be undone.',
  '☢ Сбросить':                            '☢ Reset',

  // ── Общие ──
  'Не указано':         'Not specified',
  'Не указана':         'Not specified',
  'Ошибка':             'Error',
  'Успешно':            'Success',
  'Загрузка...':        'Loading...',
  'нет':                'none',
  'да':                 'yes',
};

// ── Словарь с регулярными выражениями (для динамических строк) ──────────────

const REGEX_DICT = [
  // "{name} добавлен(а) в питомник"
  {
    pattern: /^(.+)\sдобавлен\(а\)\sв\sпитомник$/,
    replace: (m, name) => `${name} added to cattery`,
  },
  // "Язык: RU" / "Язык: EN"
  {
    pattern: /^Язык:\s(.+)$/,
    replace: (m, lang) => `Language: ${lang}`,
  },
  // "{name} будет удалён без возможности восстановления."
  {
    pattern: /^(.+)\sбудет удалён без возможности восстановления\.$/,
    replace: (m, name) => `${name} will be permanently deleted.`,
  },
  // "{name/Котёнок} будет удалён из помёта."
  {
    pattern: /^(.+)\sбудет удалён из помёта\.$/,
    replace: (m, name) => `${name} will be removed from the litter.`,
  },
  // "N питомцев" (счётчик карты поколений)
  {
    pattern: /^(\d+)\s+(питомец|питомца|питомцев)$/,
    replace: (m, n) => `${n} ${n === '1' ? 'pet' : 'pets'}`,
  },
  // "Тема: Stellar 🌌"
  {
    pattern: /^Тема:\s(.+)$/,
    replace: (m, theme) => `Theme: ${theme}`,
  },
  // "N/HCM (Носитель)" — динамические опции генетических тестов
  {
    pattern: /^(N\/.+)\s+\(Носитель\)$/,
    replace: (m, code) => `${code} (Carrier)`,
  },
  // "HCM/HCM (Больной)"
  {
    pattern: /^(.+)\s+\(Больной\)$/,
    replace: (m, code) => `${code} (Affected)`,
  },
  // "Нет генетических данных: HCM. Заполните EMS или формулу."
  {
    pattern: /^Нет генетических данных: (.+)\. Заполните EMS или формулу\.$/,
    replace: (m, names) => `No genetic data: ${names}. Fill in EMS or formula.`,
  },
  // "{name} передан в Прогноз вязки"
  {
    pattern: /^(.+)\sпередан в Прогноз вязки$/,
    replace: (m, name) => `${name} sent to Breeding Forecast`,
  },
  // "Удалено N событий"
  {
    pattern: /^Удалено\s(\d+)\sсобытий$/,
    replace: (m, n) => `${n} ${n === '1' ? 'event' : 'events'} deleted`,
  },
  // "Вязка добавлена. Ожидаемые роды: 5 мар 2025"
  {
    pattern: /^Вязка добавлена\. Ожидаемые роды:\s(.+)$/,
    replace: (m, date) => `Breeding added. Expected birth: ${date}`,
  },
  // "N г. N мес." → "N yr. N mo."
  {
    pattern: /^(\d+)\sг\.\s(\d+)\sмес\.$/,
    replace: (m, y, mo) => `${y} yr. ${mo} mo.`,
  },
  // "N мес." → "N mo."
  {
    pattern: /^(\d+)\sмес\.$/,
    replace: (m, mo) => `${mo} mo.`,
  },
  // "N г." → "N yr."
  {
    pattern: /^(\d+)\sг\.$/,
    replace: (m, y) => `${y} yr.`,
  },
  // "N дн." → "N d."
  {
    pattern: /^(\d+)\sдн\.$/,
    replace: (m, d) => `${d} d.`,
  },
  // EMS select options "n — Чёрный" → "n — Black"
  {
    pattern: /^([a-z0-9]+)\s—\s(.+)$/,
    replace: (m, code, name) => {
      const t = DICT[name];
      return t ? `${code} — ${t}` : m;
    },
  },
  // Анализ совместимости (genetics.js analyzeCompatibility)
  {
    pattern: /^(.+?): оба родителя чисты — риска нет$/,
    replace: (m, t) => `${t}: both parents clear — no risk`,
  },
  {
    pattern: /^(.+?): (Отец|Мать) носитель\/болен — риск передачи потомству$/,
    replace: (m, t, who) => `${t}: ${who === 'Отец' ? 'Sire' : 'Dam'} carrier/affected — risk of transmission`,
  },
  {
    pattern: /^(.+?): оба носителя — 25% риск больного потомства$/,
    replace: (m, t) => `${t}: both carriers — 25% risk of affected offspring`,
  },
  {
    pattern: /^(.+?): (Отец|Мать) носитель — потомство может быть носителем$/,
    replace: (m, t, who) => `${t}: ${who === 'Отец' ? 'Sire' : 'Dam'} carrier — offspring may be carriers`,
  },
];

// ── Публичные функции ─────────────────────────────────────────────────────

/**
 * Перевести строку (прямой lookup + regex fallback).
 * Имена питомцев не переводятся.
 */
export function translateText(str) {
  if (!str) return str;
  const s = str.trim();
  if (DICT[s]) return DICT[s];
  for (const { pattern, replace } of REGEX_DICT) {
    const m = s.match(pattern);
    if (m) return replace(...m);
  }
  return str;
}

/**
 * Применить перевод к поддереву DOM.
 * Если root не передан — к document.body.
 */
export function applyI18n(root = document.body) {
  if (!root) return;

  // 1. Элементы с data-i18n → заменить textContent
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (DICT[key]) el.textContent = DICT[key];
  });

  // 2. Элементы с data-i18n-ph → заменить placeholder
  root.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.dataset.i18nPh;
    if (DICT[key]) el.placeholder = DICT[key];
  });

  // 3. Элементы с data-i18n-title → заменить title
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    if (DICT[key]) el.title = DICT[key];
  });

  // 4. TreeWalker по текстовым узлам — перевести точные совпадения
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
        if (parent.dataset?.i18n) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const toReplace = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const trimmed = node.nodeValue?.trim();
    if (!trimmed || trimmed.length < 2) continue;
    const translated = translateText(trimmed);
    if (translated !== trimmed) {
      toReplace.push({ node, value: node.nodeValue.replace(trimmed, translated) });
    }
  }
  for (const { node, value } of toReplace) {
    node.nodeValue = value;
  }

  // 5. Обработать select-опции (используем translateText для поддержки regex)
  root.querySelectorAll('option').forEach(opt => {
    const t = opt.textContent?.trim();
    if (!t) return;
    const translated = translateText(t);
    if (translated !== t) opt.textContent = translated;
  });

  // 6. Placeholders у input/textarea
  root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
    const t = el.placeholder?.trim();
    if (!t) return;
    const translated = translateText(t);
    if (translated !== t) el.placeholder = translated;
  });
}

/**
 * Проверить, включён ли английский язык.
 */
export function isEN() {
  return state.lang === 'en';
}
