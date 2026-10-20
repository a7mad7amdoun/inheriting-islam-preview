/* Filter the rendered directory. No requests, storage, query URLs, or accounts. */
(function () {
  'use strict';
  var controls = document.querySelector('[data-explore-controls]');
  if (!controls) return;
  var input = document.getElementById('house-query');
  var category = document.getElementById('house-category');
  var entries = Array.from(document.querySelectorAll('.explore-entry'));
  var count = document.querySelector('[data-explore-count]');
  var empty = document.querySelector('[data-explore-empty]');
  var editorialNote = document.querySelector('.explore-editorial-note');
  var shortcuts = Array.from(document.querySelectorAll('[data-explore-category]'));
  var pathGuidance = document.querySelector('[data-path-guidance]');
  var pathCopy = Array.from(document.querySelectorAll('[data-path-copy]'));
  var pathTargets = Array.from(document.querySelectorAll('[data-path-target]'));
  var pathBrowse = document.querySelector('[data-path-browse]');
  var chosenResource = null;
  function goToStep(element) {
    element.focus({preventScroll:true});
    var calm = document.documentElement.dataset.motion === 'calm' || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    element.scrollIntoView({block:'start',behavior:calm ? 'auto' : 'smooth'});
  }
  var arabic = document.documentElement.lang === 'ar';
  var correctionBox = document.querySelector('[data-search-corrections]');
  var correctionList = document.querySelector('[data-search-correction-list]');
  var scopeButton = document.querySelector('[data-search-all-categories]');
  function normalize(value) {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/[ىی]/g, 'ي').replace(/ک/g, 'ك').replace(/ة/g, 'ه')
      .replace(/[٠-٩۰-۹]/g, function (n) { return String(n.charCodeAt(0) - (n <= '٩' ? 1632 : 1776)); })
      .replace(/[’'ʿʻ‘ʼ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  }
  function token(value) {
    var word = normalize(value);
    return word.length > 4 && word.startsWith('ال') ? word.slice(2) : word;
  }
  // A small, reviewed vocabulary connects topics; it never changes source text.
  var topics = [
    ['quran', 'قرآن', 'quran koran kuran قرآن قران'],
    ['tajweed', 'تجويد', 'tajwid tajweed تجويد'],
    ['memorization', 'حفظ', 'hifz hifdh memorization memorisation حفظ'],
    ['qaidah', 'قاعدة', 'qaidah qaida قاعدة قاعده'],
    ['books', 'كتب', 'book books كتاب كتب'],
    ['lessons', 'دروس', 'lesson lessons class classes درس دروس'],
    ['apps', 'تطبيقات', 'app apps application applications tool tools تطبيق تطبيقات أدوات'],
    ['prayer', 'صلاة', 'prayer pray salah salat صلاة صلاه'],
    ['airport', 'مطار', 'airport airports مطار مطارات'],
    ['baby', 'مولود', 'baby newborn child مولود طفل ولادة'],
    ['family', 'أسرة', 'family families أسرة عائلة عائلات'],
    ['beginner', 'مبتدئ', 'beginner beginners beginning مبتدئ مبتدئين بداية'],
    ['letters', 'حروف', 'letter letters alphabet حروف حرف هجاء'],
    ['teacher', 'معلّم', 'teacher teachers معلم مدرس تعليم'],
    ['pronunciation', 'مخارج', 'pronunciation articulation makharij مخارج نطق'],
    ['wudu', 'وضوء', 'wudu وضوء'],
    ['price', 'رسوم', 'price pricing cost سعر اسعار رسوم تكلفة'],
    ['enroll', 'تسجيل', 'enroll enrol registration تسجيل'],
    ['hamza', 'حمزة', 'hamza حمزة'],
    ['khadijah', 'خديجة', 'khadijah khadija خديجة'],
    ['mosque', 'مسجد', 'mosque masjid masajid mosques مسجد مساجد'],
    ['schedule', 'مواعيد', 'schedule times timetable مواعيد جدول توقيت'],
    ['free', 'مجاني', 'free مجاني مجانا'],
    ['revision', 'مراجعة', 'revision revise مراجعة'],
    ['tracker', 'تتبّع', 'tracker tracking تتبع'],
    ['death', 'وفاة', 'death loss bereavement وفاة موت فقد'],
    ['funeral', 'جنازة', 'funeral janazah جنازة جنائز'],
    ['podcast', 'بودكاست', 'podcast podcasts بودكاست'],
    ['adhan', 'أذان', 'adhan اذان أذان'],
    ['names', 'أسماء', 'names name أسماء اسم'],
    ['print', 'طباعة', 'print printable طباعة'],
    ['download', 'تحميل', 'download تحميل تنزيل'],
    ['itqan', 'إتقان', 'itqan إتقان'],
    ['jadhr', 'جذر', 'jadhr جذر'],
    ['sakinah', 'سكينة', 'sakinah sakina سكينة']
  ];
  var equivalents = new Map(), vocabulary = [];
  topics.forEach(function (topic) {
    var words = Array.from(new Set(topic[2].split(' ').map(token)));
    words.forEach(function (word) {
      equivalents.set(word, words);
      vocabulary.push({word:word, label:/[\u0600-\u06ff]/.test(word) ? topic[1] : topic[0]});
    });
  });
  var stopWords = new Set('a the of for and to in with في عن من الى علي و'.split(' ').map(token));
  var searchable = entries.map(function (entry) {
    var words = normalize(entry.dataset.search).split(' ').map(token);
    if (entry.dataset.category === 'learn' || entry.dataset.category === 'books') words.push('quran');
    return words;
  });
  function queryWords(value) { return normalize(value).split(' ').map(token).filter(function (word) { return word && !stopWords.has(word); }); }
  function matches(words, index) {
    return words.every(function (word) {
      var alternatives = equivalents.get(word) || [word];
      return alternatives.some(function (alternative) {
        return searchable[index].some(function (term) { return term === alternative || (alternative.length >= 3 && term.startsWith(alternative)); });
      });
    });
  }
  function resultsFor(words, scope) {
    return entries.filter(function (entry, index) { return (scope === 'all' || entry.dataset.category === scope) && matches(words, index); });
  }
  var resultList = document.getElementById('explore-results');
  var ranking = new Map(entries.map(function (entry, index) {
    return [entry, {
      titles:[queryWords(entry.querySelector('h3').textContent), queryWords(entry.dataset.rankTitle || '')],
      focus:queryWords(entry.dataset.rankFocus || ''),
      keywords:queryWords(entry.dataset.rankKeywords || ''),
      priority:Number(entry.dataset.priority) || 1000,
      index:index
    }];
  }));
  function canonical(word) { return (equivalents.get(word) || [word])[0]; }
  function strength(word, terms) {
    var alternatives = equivalents.get(word) || [word];
    if (alternatives.some(function (v) { return terms.includes(v); })) return 2;
    return alternatives.some(function (v) { return v.length >= 3 && terms.some(function (t) { return t.startsWith(v); }); }) ? 1 : 0;
  }
  function broadQuery(words) {
    return words.every(function (word) { return ['quran','book','lesson','app','free'].includes(canonical(word)); });
  }
  function relevance(entry, words) {
    if (!words.length) return 0;
    var meta = ranking.get(entry), concepts = words.map(canonical);
    if (broadQuery(words)) {
      var categoryFor = {book:'books', lesson:'learn', app:'apps'};
      return concepts.some(function (word) { return categoryFor[word] === entry.dataset.category; }) ? 100 : 0;
    }
    var phrase = concepts.join(' ');
    var exactTitle = meta.titles.some(function (title) { return title.map(canonical).join(' ') === phrase; });
    return (exactTitle ? 10000 : 0) + words.reduce(function (score, word) {
      return score + 80*strength(word, meta.focus)
        + 30*Math.max.apply(null, meta.titles.map(function (title) { return strength(word,title); }))
        + 8*strength(word,meta.keywords);
    }, 0);
  }
  function rankResults(found, words) {
    return found.slice().sort(function (a,b) {
      return relevance(b,words)-relevance(a,words) || ranking.get(a).priority-ranking.get(b).priority || ranking.get(a).index-ranking.get(b).index;
    });
  }
  // Bounded Damerau-Levenshtein handles swapped, missing, or mistyped letters.
  function distance(a, b) {
    var rows = Array.from({length:a.length + 1}, function (_, i) { return [i]; });
    for (var j=0;j<=b.length;j++) rows[0][j]=j;
    for (var i=1;i<=a.length;i++) for (var k=1;k<=b.length;k++) {
      rows[i][k]=Math.min(rows[i-1][k]+1,rows[i][k-1]+1,rows[i-1][k-1]+(a[i-1]===b[k-1]?0:1));
      if (i>1 && k>1 && a[i-1]===b[k-2] && a[i-2]===b[k-1]) rows[i][k]=Math.min(rows[i][k],rows[i-2][k-2]+1);
    }
    return rows[a.length][b.length];
  }
  function suggestions(words) {
    if (!words.length || words.length > 6) return [];
    var combinations = [[]];
    words.forEach(function (word) {
      var options = [word];
      if (!resultsFor([word], 'all').length && word.length >= 4 && word.length <= 28 && !/\d/.test(word)) {
        var limit = word.length >= 7 ? 2 : 1;
        var candidates = vocabulary.filter(function (v) { return Math.abs(v.word.length-word.length)<=limit && /[\u0600-\u06ff]/.test(v.word) === /[\u0600-\u06ff]/.test(word); })
          .map(function (v) { return {label:v.label, score:distance(word,v.word)}; })
          .filter(function (v) { return v.score <= limit; }).sort(function (a,b) { return a.score-b.score; });
        if (candidates.length) options = Array.from(new Set(candidates.filter(function (v) { return v.score===candidates[0].score; }).map(function (v) { return v.label; }))).slice(0,3);
      }
      combinations = combinations.flatMap(function (parts) { return options.map(function (option) { return parts.concat(option); }); }).slice(0,9);
    });
    return Array.from(new Set(combinations.map(function (parts) { return parts.join(' '); })))
      .filter(function (value) { return normalize(value)!==words.join(' ') && resultsFor(queryWords(value),category.value).length; }).slice(0,3);
  }
  function update() {
    var words = queryWords(input.value);
    var found = rankResults(resultsFor(words, category.value), words);
    if (chosenResource) found = found.filter(function (entry) { return entry.id === chosenResource; });
    var total = found.length;
    resultList.classList.toggle('has-guided-result', !!chosenResource);
    pathTargets.forEach(function (button) { button.setAttribute('aria-pressed',String(button.dataset.pathTarget === chosenResource)); });
    if (pathBrowse) pathBrowse.hidden = !chosenResource;
    entries.forEach(function (entry) { entry.hidden = !found.includes(entry); });
    // Move the original cards, rather than clone or visually reorder them.
    // Reading order, keyboard order, and the visible order stay identical.
    var ordered = found.concat(entries.filter(function (entry) { return entry.hidden; }));
    if (ordered.some(function (entry,index) { return resultList.children[index] !== entry; })) resultList.append.apply(resultList,ordered);
    count.textContent = total + (total === 1 ? ' resource' : ' resources') + (words.length || category.value !== 'all' ? ' found' : '');
    if (total > 1) count.textContent += words.length && !broadQuery(words)
      ? (arabic ? ' · الأقرب لبحثك أولًا' : ' · Closest matches first')
      : (arabic ? ' · بدايات مقترحة أولًا' : ' · Starting points first');
    empty.hidden = total !== 0;
    pathCopy.forEach(function (copy) { copy.hidden = words.length > 0 || copy.dataset.pathCopy !== category.value; });
    if (pathGuidance) pathGuidance.hidden = !pathCopy.some(function (copy) { return !copy.hidden; });
    if (editorialNote) editorialNote.hidden = !entries.some(function (entry) { return !entry.hidden && entry.dataset.category === 'read'; });
    var corrections = total ? [] : suggestions(words);
    correctionList.replaceChildren();
    corrections.forEach(function (value) {
      var button = document.createElement('button');
      button.type = 'button'; button.textContent = value; button.dir = 'auto';
      button.addEventListener('click', function () { input.value=value; update(); input.focus({preventScroll:true}); });
      correctionList.appendChild(button);
    });
    correctionBox.hidden = !corrections.length;
    if (corrections.length) count.textContent += arabic ? ' · اقتراحات أدناه' : ' · Suggestions below';
    var outside = !total && category.value !== 'all' ? resultsFor(words,'all').length : 0;
    scopeButton.hidden = !outside;
    scopeButton.textContent = arabic ? 'البحث في جميع الأقسام ('+outside+')' : 'Search all categories ('+outside+')';
    shortcuts.forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.exploreCategory === category.value)); });
  }
  scopeButton.addEventListener('click', function () { category.value='all';update();input.focus({preventScroll:true}); });
  controls.hidden = false;
  // The mobile page scrolls inside body; repeated native hashes can leave it
  // at the footer. Every search entry should reliably return to the directory.
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button > 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    var target = new URL(link.href, location.href);
    if (target.origin !== location.origin || target.pathname !== location.pathname || target.hash !== '#directory') return;
    event.preventDefault();
    var directory = document.getElementById('directory');
    directory.tabIndex = -1;
    directory.focus({preventScroll:true});
    var calm = document.documentElement.dataset.motion === 'calm' || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    directory.scrollIntoView({block:'start', behavior:calm ? 'auto' : 'smooth'});
  });
  input.addEventListener('input', function () { chosenResource=null; update(); });
  category.addEventListener('change', function () { chosenResource=null; update(); });
  shortcuts.forEach(function (button) {
    button.addEventListener('click', function () {
      chosenResource=null; input.value = ''; category.value = button.dataset.exploreCategory; update();
      if (pathGuidance && !pathGuidance.hidden) goToStep(document.getElementById('path-guide-title'));
    });
  });
  pathTargets.forEach(function (button) {
    button.addEventListener('click', function () {
      chosenResource=button.dataset.pathTarget; update();
      var entry=document.getElementById(chosenResource);
      if (entry && !entry.hidden) goToStep(entry.querySelector('a'));
    });
  });
  if (pathBrowse) pathBrowse.addEventListener('click', function () { chosenResource=null;update();goToStep(document.getElementById('path-guide-title')); });
  document.querySelectorAll('[data-explore-reset]').forEach(function (button) {
    button.addEventListener('click', function () { chosenResource=null; input.value = ''; category.value = 'all'; update(); input.focus(); });
  });
  document.querySelectorAll('[data-explore-suggestion]').forEach(function (button) {
    button.addEventListener('click', function () { input.value = button.dataset.exploreSuggestion; category.value = 'all'; update(); input.focus(); });
  });
  // Retain native search-field Escape behavior; only clear this field, never navigate.
  input.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && input.value) { input.value = ''; update(); }
  });
  update();
})();
