/**
 * Модуль для управления шаблонами извлечения данных
 * Использует ES5 синтаксис для максимальной совместимости
 */

function TemplateManager() {
  this.storage = new TemplateStorage();
}

/**
 * Проверяет подходит ли шаблон для текущего URL
 * @param {Object} template - шаблон для проверки
 * @param {string} url - текущий URL страницы
 * @returns {boolean} подходит ли шаблон
 */
TemplateManager.prototype.matchesUrl = function(template, url) {
  if (!template.url || template.url === '*') {
    return true; // Универсальный шаблон
  }
  
  // Конвертируем паттерн в регулярное выражение
  var pattern = template.url
    .replace(/\./g, '\\.')     // Экранируем точки
    .replace(/\*/g, '.*')      // Заменяем * на .*
    .replace(/\?/g, '\\?');    // Экранируем знаки вопроса
  
  try {
    var regex = new RegExp('^' + pattern + '$', 'i');
    return regex.test(url);
  } catch (e) {
    console.warn('Invalid URL pattern in template:', template.name, e);
    return false;
  }
};

/**
 * Получает шаблоны, подходящие для указанного URL
 * @param {string} url - URL страницы
 * @param {Function} callback - функция обратного вызова (error, templates[])
 */
TemplateManager.prototype.getTemplatesForUrl = function(url, callback) {
  var self = this;
  callback = callback || function() {};
  
  this.storage.getAllTemplates(function(err, templates) {
    if (err) {
      callback(err, []);
      return;
    }
    
    var matchingTemplates = templates.filter(function(template) {
      return self.matchesUrl(template, url);
    });
    
    // Сортируем: специфичные паттерны первыми, потом универсальные
    matchingTemplates.sort(function(a, b) {
      if (a.url === '*' && b.url !== '*') return 1;
      if (a.url !== '*' && b.url === '*') return -1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    
    callback(null, matchingTemplates);
  });
};

/**
 * Валидирует структуру шаблона
 * @param {Object} template - шаблон для валидации
 * @returns {Object} результат валидации {valid: boolean, errors: string[]}
 */
TemplateManager.prototype.validateTemplate = function(template) {
  var errors = [];
  
  // Обязательные поля
  if (!template.name || template.name.trim() === '') {
    errors.push('Название шаблона обязательно');
  }
  
  if (!template.id || template.id.trim() === '') {
    errors.push('ID шаблона обязателен');
  }
  
  // Проверка полей
  if (!template.fields || !Array.isArray(template.fields)) {
    errors.push('Поля шаблона должны быть массивом');
  } else {
    for (var i = 0; i < template.fields.length; i++) {
      var field = template.fields[i];
      var fieldErrors = this.validateTemplateField(field, i + 1);
      errors = errors.concat(fieldErrors);
    }
  }
  
  // Проверка URL паттерна
  if (template.url && template.url !== '*') {
    try {
      var pattern = template.url
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '\\?');
      new RegExp('^' + pattern + '$', 'i');
    } catch (e) {
      errors.push('Некорректный URL паттерн: ' + e.message);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
};

/**
 * Валидирует поле шаблона
 * @param {Object} field - поле для валидации
 * @param {number} index - индекс поля (для ошибок)
 * @returns {string[]} массив ошибок
 */
TemplateManager.prototype.validateTemplateField = function(field, index) {
  var errors = [];
  var fieldName = 'Поле ' + index;
  
  if (!field.id || field.id.trim() === '') {
    errors.push(fieldName + ': ID поля обязательно');
  }
  
  if (!field.name || field.name.trim() === '') {
    errors.push(fieldName + ': Название поля обязательно');
  }
  
  if (!field.selector || field.selector.trim() === '') {
    errors.push(fieldName + ': CSS селектор обязателен');
  } else {
    // Проверяем синтаксис CSS селектора
    try {
      document.querySelector(field.selector);
    } catch (e) {
      errors.push(fieldName + ': Некорректный CSS селектор - ' + e.message);
    }
  }
  
  var validDataTypes = ['value', 'textContent', 'innerText', 'innerHTML'];
  if (field.dataType && validDataTypes.indexOf(field.dataType) === -1) {
    errors.push(fieldName + ': Некорректный тип данных (допустимые: ' + validDataTypes.join(', ') + ')');
  }
  
  return errors;
};

/**
 * Создает поле шаблона с параметрами по умолчанию
 * @param {string} name - название поля
 * @param {string} selector - CSS селектор
 * @param {string} dataType - тип данных (опционально)
 * @returns {Object} поле шаблона
 */
TemplateManager.prototype.createTemplateField = function(name, selector, dataType) {
  return {
    id: this._generateFieldId(),
    name: name || 'Новое поле',
    selector: selector || '',
    dataType: dataType || 'textContent'
  };
};

/**
 * Клонирует шаблон с новым ID и названием
 * @param {Object} template - исходный шаблон
 * @param {string} newName - новое название (опционально)
 * @returns {Object} клонированный шаблон
 */
TemplateManager.prototype.cloneTemplate = function(template, newName) {
  var cloned = JSON.parse(JSON.stringify(template)); // Глубокое копирование
  
  cloned.id = this.storage._generateId();
  cloned.name = newName || (template.name + ' (копия)');
  cloned.createdAt = new Date().toISOString();
  cloned.updatedAt = new Date().toISOString();
  
  // Генерируем новые ID для полей
  for (var i = 0; i < cloned.fields.length; i++) {
    cloned.fields[i].id = this._generateFieldId();
  }
  
  return cloned;
};

/**
 * Получает статистику по шаблонам
 * @param {Function} callback - функция обратного вызова (error, stats)
 */
TemplateManager.prototype.getTemplateStats = function(callback) {
  this.storage.getAllTemplates(function(err, templates) {
    if (err) {
      callback(err, null);
      return;
    }
    
    var stats = {
      totalTemplates: templates.length,
      totalFields: 0,
      templatesWithSpecificUrl: 0,
      universalTemplates: 0,
      averageFieldsPerTemplate: 0,
      lastUpdated: null,
      oldestTemplate: null
    };
    
    if (templates.length === 0) {
      callback(null, stats);
      return;
    }
    
    var dates = [];
    
    for (var i = 0; i < templates.length; i++) {
      var template = templates[i];
      
      stats.totalFields += template.fields ? template.fields.length : 0;
      
      if (template.url === '*') {
        stats.universalTemplates++;
      } else {
        stats.templatesWithSpecificUrl++;
      }
      
      if (template.updatedAt) {
        dates.push(new Date(template.updatedAt));
      }
    }
    
    stats.averageFieldsPerTemplate = Math.round(stats.totalFields / templates.length * 10) / 10;
    
    if (dates.length > 0) {
      dates.sort(function(a, b) { return b - a; });
      stats.lastUpdated = dates[0].toISOString();
      stats.oldestTemplate = dates[dates.length - 1].toISOString();
    }
    
    callback(null, stats);
  });
};

/**
 * Оптимизирует CSS селектор для лучшей совместимости
 * @param {string} selector - исходный селектор
 * @returns {string} оптимизированный селектор
 */
TemplateManager.prototype.optimizeSelector = function(selector) {
  if (!selector) return selector;
  
  // Убираем лишние пробелы
  selector = selector.trim().replace(/\s+/g, ' ');
  
  // Заменяем nth-child на более стабильные селекторы, если возможно
  selector = selector.replace(/:nth-child\(\d+\)/g, function(match) {
    console.warn('nth-child selector detected, consider using more stable selectors:', match);
    return match; // Пока оставляем как есть
  });
  
  return selector;
};

// Приватные методы

/**
 * Генерирует уникальный ID для поля шаблона
 * @private
 */
TemplateManager.prototype._generateFieldId = function() {
  return 'field_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TemplateManager;
}
