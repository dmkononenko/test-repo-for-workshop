# Технический план реализации Chrome плагина

## Обзор архитектуры

### Компоненты системы
1. **Manifest v3** - конфигурация расширения
2. **Service Worker** - фоновый скрипт для управления расширением
3. **Content Script** - скрипт для взаимодействия с веб-страницами
4. **Popup** - интерфейс при клике на иконку расширения
5. **Options Page** - страница настроек расширения
6. **Storage** - локальное хранение шаблонов

### Технологический стек
- **JavaScript (ES5)** - основной язык разработки для максимальной совместимости
- **HTML5/CSS3** - интерфейс пользователя
- **Chrome Extensions API** - интеграция с браузером
- **chr#### Отладка
```javascript
// Отладка content scripts
console.log('Debug:', data);
chrome.runtime.sendMessage({type: 'debug', data: data});

// Отладка background script
chrome.action.setBadgeText({text: 'OK'});

// Проверка коммуникации (ES5 стиль)
chrome.runtime.sendMessage({action: 'test'}, function(response) {
  console.log('Communication test:', response);
});
```ge.local** - локальное хранение данных
- **chrome.contextMenus** - контекстное меню
- **chrome.scripting** - внедрение скриптов

## Структура проекта

```
chrome-extension/
├── manifest.json           # Конфигурация расширения
├── background/
│   └── service-worker.js   # Фоновый скрипт
├── content/
│   ├── content-script.js   # Основной content script
│   ├── selector-overlay.js # Оверлей для выбора элементов
│   └── content-styles.css  # Стили для контента
├── popup/
│   ├── popup.html         # HTML popup интерфейса
│   ├── popup.js           # Логика popup
│   └── popup.css          # Стили popup
├── options/
│   ├── options.html       # HTML страницы настроек
│   ├── options.js         # Логика настроек
│   └── options.css        # Стили настроек
├── shared/
│   ├── storage.js         # Утилиты для работы с хранилищем
│   ├── template-manager.js # Управление шаблонами
│   └── selector-generator.js # Генерация CSS селекторов
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Поэтапный план реализации

### Этап 1: Базовая настройка проекта (1-2 дня)

#### Цель
Создать минимальную структуру Chrome расширения с базовой функциональностью.

#### Задачи
1. **Создание manifest.json**
   - Настройка Manifest V3
   - Определение разрешений (storage, contextMenus, scripting, activeTab, tabs)
   - Настройка popup в action
   - Настройка content scripts и background script
   
   ```json
   {
     "manifest_version": 3,
     "name": "Admin Panel Data Extractor",
     "version": "1.0.0",
     "description": "Автоматизация копирования данных из админ-панелей",
     
     "permissions": [
       "storage",
       "contextMenus", 
       "scripting",
       "activeTab",
       "tabs"
     ],
     
     "action": {
       "default_popup": "popup/popup.html",
       "default_icon": {
         "16": "icons/icon16.png",
         "48": "icons/icon48.png",
         "128": "icons/icon128.png"
       }
     },
     
     "background": {
       "service_worker": "background/service-worker.js"
     },
     
     "content_scripts": [{
       "matches": ["<all_urls>"],
       "js": ["content/content-script.js"]
     }]
   }
   ```

2. **Базовый Service Worker**
   - Инициализация расширения
   - Создание контекстного меню
   - Обработчики событий установки/обновления

3. **Простейший Content Script**
   - Внедрение в веб-страницы
   - Базовое взаимодействие с DOM
   - Сообщения между content script и background

4. **Минимальный Popup**
   - HTML структура
   - Показ текущего URL страницы
   - Кнопка "Создать шаблон"
   
   ```html
   <!-- popup/popup.html -->
   <!DOCTYPE html>
   <html>
   <head>
     <meta charset="utf-8">
     <style>
       body { width: 300px; padding: 10px; }
       .url-info { font-size: 12px; color: #666; margin-bottom: 10px; }
       .create-btn { width: 100%; padding: 8px; background: #4285f4; color: white; border: none; cursor: pointer; }
     </style>
   </head>
   <body>
     <div class="url-info">
       <strong>Текущая страница:</strong><br>
       <span id="current-url">Загрузка...</span>
     </div>
     <button id="create-template" class="create-btn">Создать шаблон</button>
     <script src="popup.js"></script>
   </body>
   </html>
   ```
   
   ```javascript
   // popup/popup.js
   document.addEventListener('DOMContentLoaded', function() {
     // Получаем текущий URL активной вкладки
     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
       var currentUrl = tabs[0].url;
       document.getElementById('current-url').textContent = currentUrl;
     });
     
     // Обработчик кнопки (пока просто показываем alert)
     document.getElementById('create-template').addEventListener('click', function() {
       alert('Функция будет реализована в следующих этапах');
     });
   });
   ```

#### Критерии готовности
- ✅ Расширение устанавливается в Chrome без ошибок
- ✅ Иконка расширения появляется в панели браузера  
- ✅ **При клике на иконку открывается popup с базовым интерфейсом**
- ✅ Popup показывает текущий URL страницы
- ✅ В popup есть кнопка "Создать шаблон" (пока нефункциональная)
- ✅ В DevTools нет критических ошибок загрузки

#### Тестирование
```javascript
// Проверка загрузки popup
document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup loaded successfully');
  
  // Проверка отображения URL
  setTimeout(function() {
    var urlElement = document.getElementById('current-url');
    console.assert(urlElement.textContent !== 'Загрузка...', 'URL should be loaded');
    console.log('✓ URL loaded:', urlElement.textContent);
  }, 1000);
});

// Проверка кнопки
var button = document.getElementById('create-template');
console.assert(button !== null, 'Create template button should exist');
console.log('✓ Create template button found');
```

**Ручное тестирование:**
1. Загрузите расширение в Chrome (Developer mode)
2. Откройте любую веб-страницу  
3. Кликните на иконку расширения в панели браузера
4. Должен открыться popup шириной 300px
5. В popup должен отображаться URL текущей страницы
6. Кнопка "Создать шаблон" должна показывать alert при клике

---

### Этап 2: Система хранения шаблонов (2-3 дня)

#### Цель
Реализовать создание, сохранение и загрузку шаблонов в chrome.storage.local.

#### Задачи
1. **Модуль управления хранилищем (storage.js)**
   ```javascript
   function TemplateStorage() {
     // Конструктор
   }
   
   TemplateStorage.prototype.saveTemplate = function(template, callback) {
     var data = {};
     data[template.id] = template;
     chrome.storage.local.set(data, callback);
   };
   
   TemplateStorage.prototype.loadTemplate = function(id, callback) {
     chrome.storage.local.get(id, function(result) {
       callback(result[id] || null);
     });
   };
   
   TemplateStorage.prototype.getAllTemplates = function(callback) {
     chrome.storage.local.get(null, function(result) {
       var templates = [];
       for (var key in result) {
         if (result.hasOwnProperty(key) && result[key].id) {
           templates.push(result[key]);
         }
       }
       callback(templates);
     });
   };
   
   TemplateStorage.prototype.deleteTemplate = function(id, callback) {
     chrome.storage.local.remove(id, callback);
   };
   ```

2. **Структура данных шаблона**
   ```javascript
   var template = {
     id: 'uuid-string',
     name: 'Карточка пользователя',
     url: 'https://admin.example.com/*',
     fields: [
       {
         id: 'field-1',
         name: 'username',
         selector: 'input[name="username"]',
         dataType: 'value'
       }
     ],
     createdAt: '2025-08-14T10:00:00Z',
     updatedAt: '2025-08-14T10:00:00Z'
   };
   ```

3. **Базовое управление шаблонами**
   - Создание пустого шаблона
   - Сохранение в storage
   - Загрузка списка шаблонов
   - Удаление шаблона

4. **Простая страница настроек**
   - Список всех шаблонов
   - Кнопки "Создать", "Удалить"
   - Форма редактирования названия

#### Критерии готовности
- ✅ Шаблоны сохраняются и загружаются из chrome.storage.local
- ✅ Данные сохраняются между сессиями браузера
- ✅ В настройках отображается список шаблонов
- ✅ Можно создать и удалить шаблон
- ✅ Корректная обработка ошибок при работе с хранилищем

#### Тестирование
```javascript
// Тест сохранения шаблона
var testTemplate = {
  id: 'test-1',
  name: 'Test Template',
  url: '*',
  fields: []
};

// Проверка CRUD операций
var storage = new TemplateStorage();
storage.saveTemplate(testTemplate, function() {
  storage.loadTemplate('test-1', function(loaded) {
    console.assert(loaded.name === 'Test Template');
  });
});
```

---

### Этап 3: Интерактивный выбор элементов (4-5 дней)

#### Цель
Реализовать режим выбора элементов на странице с визуальной подсветкой.

#### Задачи
1. **Селекторный оверлей (selector-overlay.js)**
   - Полупрозрачное покрытие страницы
   - Подсветка элементов при наведении
   - Обработка кликов по элементам

2. **Генератор CSS селекторов (selector-generator.js)**
   ```javascript
   function SelectorGenerator() {
     // Конструктор
   }
   
   SelectorGenerator.prototype.generateSelector = function(element) {
     // 1. Проверка ID
     if (element.id) {
       return '#' + element.id;
     }
     
     // 2. Проверка name атрибута
     if (element.name) {
       return '[name="' + element.name + '"]';
     }
     
     // 3. Комбинация тегов и классов
     var tagName = element.tagName.toLowerCase();
     var classes = element.className ? '.' + element.className.split(' ').join('.') : '';
     return tagName + classes;
     
     // 4. XPath как последний вариант (реализация опущена)
   };
   
   SelectorGenerator.prototype.validateSelector = function(selector) {
     try {
       var elements = document.querySelectorAll(selector);
       return elements.length > 0;
     } catch (e) {
       return false;
     }
   };
   
   SelectorGenerator.prototype.getElementValue = function(element) {
     if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
       return element.value;
     } else if (element.tagName === 'SELECT') {
       return element.options[element.selectedIndex].text;
     } else {
       return element.textContent || element.innerText;
     }
   };
   ```

3. **Визуальные компоненты**
   - Подсветка элементов (CSS outline)
   - Всплывающая подсказка с информацией об элементе
   - Боковая панель со списком выбранных полей
   - Панель инструментов (Завершить/Отменить)

4. **Режимы работы**
   - Активация/деактивация режима выбора
   - Добавление полей в шаблон
   - Предпросмотр извлекаемых данных

#### Критерии готовности
- ✅ При наведении элементы подсвечиваются
- ✅ Клик по элементу добавляет его в шаблон
- ✅ Генерируются корректные CSS селекторы
- ✅ Отображается информация об элементе (тип, значение)
- ✅ Боковая панель показывает выбранные поля
- ✅ Можно завершить/отменить выбор

#### Тестирование
```html
<!-- Тестовая HTML форма -->
<form>
  <input id="username" name="username" value="john_doe" />
  <input class="email-field" type="email" value="john@example.com" />
  <select name="status">
    <option value="active" selected>Active</option>
  </select>
</form>
```

```javascript
// Тесты генерации селекторов
var usernameInput = document.getElementById('username');
var generator = new SelectorGenerator();
var selector = generator.generateSelector(usernameInput);
console.assert(selector === '#username');

var elements = document.querySelectorAll(selector);
console.assert(elements.length === 1);
```

---

### Этап 4: Извлечение и копирование данных (2-3 дня)

#### Цель
Реализовать применение шаблонов и копирование данных в буфер обмена.

#### Задачи
1. **Движок извлечения данных**
   ```javascript
   function DataExtractor() {
     // Конструктор
   }
   
   DataExtractor.prototype.extractByTemplate = function(template, callback) {
     var results = [];
     var fields = template.fields;
     
     for (var i = 0; i < fields.length; i++) {
       var field = fields[i];
       var value = this.extractFieldValue(field);
       if (value && value.trim) {
         var trimmedValue = value.trim();
         if (trimmedValue) {
           results.push(trimmedValue);
         }
       }
     }
     
     callback(results);
   };
   
   DataExtractor.prototype.extractFieldValue = function(field) {
     var element = document.querySelector(field.selector);
     if (!element) return null;
     
     switch (field.dataType) {
       case 'value': 
         return element.value;
       case 'textContent': 
         return element.textContent;
       case 'innerText': 
         return element.innerText;
       default: 
         return element.textContent;
     }
   };
   ```

2. **Копирование в буфер обмена**
   ```javascript
   function copyToClipboard(data, callback) {
     var text = data.join('\n');
     
     // Для современных браузеров
     if (navigator.clipboard && navigator.clipboard.writeText) {
       navigator.clipboard.writeText(text).then(function() {
         callback(null, true);
       }).catch(function(err) {
         callback(err, false);
       });
     } else {
       // Fallback для старых браузеров
       var textArea = document.createElement('textarea');
       textArea.value = text;
       document.body.appendChild(textArea);
       textArea.select();
       
       try {
         var successful = document.execCommand('copy');
         document.body.removeChild(textArea);
         callback(null, successful);
       } catch (err) {
         document.body.removeChild(textArea);
         callback(err, false);
       }
     }
   }
   ```

3. **Уведомления пользователю**
   - Toast сообщения об успешном копировании
   - Обработка ошибок (элемент не найден)
   - Индикация количества скопированных полей

4. **Автоопределение шаблонов**
   - Сравнение текущего URL с паттернами шаблонов
   - Предложение подходящих шаблонов в popup

#### Критерии готовности
- ✅ Данные извлекаются согласно шаблону
- ✅ Результат копируется в буфер обмена
- ✅ Формат: одно значение на строку
- ✅ Пустые поля пропускаются
- ✅ Показываются уведомления о результате
- ✅ Обработка ошибок (элемент не найден)

#### Тестирование
```javascript
// Тест извлечения данных
var testTemplate = {
  fields: [
    { selector: '#username', dataType: 'value' },
    { selector: '.email-field', dataType: 'value' }
  ]
};

var extractor = new DataExtractor();
extractor.extractByTemplate(testTemplate, function(data) {
  console.assert(data.length === 2);
  console.assert(data[0] === 'john_doe');
  
  // Проверка копирования
  copyToClipboard(data, function(err, success) {
    if (success) {
      // Для современных браузеров можно проверить clipboard
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(function(clipboard) {
          console.assert(clipboard === 'john_doe\njohn@example.com');
        });
      }
    }
  });
});
```

---

### Этап 5: Пользовательский интерфейс (3-4 дня)

#### Цель
Доработать popup интерфейс и страницу настроек для полноценной работы с шаблонами.

#### Задачи
1. **Улучшенный Popup**
   - Список доступных шаблонов для текущей страницы
   - Кнопки применения шаблонов
   - Индикатор последней операции
   - Быстрый доступ к настройкам

2. **Расширенная страница настроек**
   - CRUD операции с шаблонами
   - Редактор полей шаблона
   - Переименование полей
   - Изменение порядка полей
   - Импорт/экспорт настроек

3. **Редактор шаблонов**
   ```html
   <!-- Пример интерфейса редактора -->
   <div class="template-editor">
     <input type="text" placeholder="Название шаблона" />
     <input type="text" placeholder="URL паттерн" />
     
     <div class="fields-list">
       <div class="field-item">
         <input type="text" value="username" placeholder="Имя поля" />
         <input type="text" value="#username" placeholder="CSS селектор" />
         <button class="remove-field">×</button>
       </div>
     </div>
     
     <button class="add-field">Добавить поле</button>
     <button class="save-template">Сохранить</button>
   </div>
   ```

4. **Стилизация и UX**
   - Современный дизайн в стиле Material Design
   - Адаптивная верстка
   - Анимации и переходы
   - Иконки и визуальная обратная связь

#### Критерии готовности
- ✅ Popup показывает подходящие шаблоны
- ✅ В настройках можно управлять всеми шаблонами
- ✅ Редактор позволяет изменять поля и их порядок
- ✅ Интерфейс интуитивно понятен
- ✅ Работает импорт/экспорт конфигурации

#### Тестирование
- Юзабилити тестирование с реальными пользователями
- Проверка всех элементов интерфейса
- Тестирование на разных разрешениях экрана

---

### Этап 6: Контекстное меню и финальная интеграция (2-3 дня)

#### Цель
Добавить контекстное меню и завершить интеграцию всех компонентов.

#### Задачи
1. **Контекстное меню**
   ```javascript
   // В service worker
   chrome.contextMenus.create({
     id: 'template-menu',
     title: 'Копировать данные',
     contexts: ['page']
   });
   
   // Динамическое создание подменю для каждого шаблона
   chrome.contextMenus.onClicked.addListener(function(info, tab) {
     if (info.menuItemId.indexOf('template-') === 0) {
       var templateId = info.menuItemId.split('-')[1];
       applyTemplate(templateId, tab.id);
     }
   });
   
   function applyTemplate(templateId, tabId) {
     // Загрузка шаблона и применение
     var storage = new TemplateStorage();
     storage.loadTemplate(templateId, function(template) {
       if (template) {
         chrome.scripting.executeScript({
           target: { tabId: tabId },
           func: extractDataByTemplate,
           args: [template]
         });
       }
     });
   }
   ```

2. **Автоматическое определение шаблонов**
   - Сравнение URL с паттернами шаблонов
   - Обновление контекстного меню
   - Выделение подходящих шаблонов

3. **Обработка ошибок и граничных случаев**
   - Элементы не найдены на странице
   - Динамически загружаемый контент
   - Ошибки доступа к элементам
   - Проблемы с буфером обмена

4. **Оптимизация производительности**
   - Кэширование селекторов
   - Ленивая загрузка компонентов
   - Минимизация влияния на страницу

#### Критерии готовности
- ✅ Контекстное меню показывает все шаблоны
- ✅ Подходящие шаблоны выделяются визуально
- ✅ Применение шаблона работает из контекстного меню
- ✅ Корректная обработка всех ошибок
- ✅ Нет влияния на производительность страниц

#### Тестирование
- Тестирование на различных сайтах
- Проверка работы с AJAX контентом
- Стресс-тестирование с множественными шаблонами

---

## Метрики и мониторинг

### KPI проекта
1. **Время создания шаблона**: < 2 минут
2. **Точность селекторов**: > 90%
3. **Время извлечения данных**: < 2 секунд
4. **Совместимость**: работа на 95% популярных сайтов

### Логирование
```javascript
// Структурированное логирование (ES5 стиль)
function logEvent(event, data) {
  console.log('[' + new Date().toISOString() + '] ' + event + ':', data);
  
  // Опционально: отправка в аналитику
  chrome.storage.local.get(['analytics'], function(result) {
    var analytics = result.analytics || [];
    analytics.push({
      timestamp: Date.now(), 
      event: event, 
      data: data
    });
    chrome.storage.local.set({analytics: analytics});
  });
}
```

## Заключение

Данный технический план обеспечивает поэтапную разработку Chrome плагина с возможностью тестирования каждого этапа отдельно. Каждый этап имеет четкие критерии готовности и методы тестирования, что позволяет контролировать качество и прогресс разработки.

Общее время разработки: **13-20 рабочих дней** при работе одного разработчика.

Возможность распараллеливания: этапы 2-3, 4-5 могут выполняться параллельно разными разработчиками.
