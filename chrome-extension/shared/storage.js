/**
 * Модуль для работы с хранилищем шаблонов в chrome.storage.local
 * Использует ES5 синтаксис для максимальной совместимости
 */

function TemplateStorage() {
  this.STORAGE_PREFIX = 'template_';
  this.METADATA_KEY = 'templates_metadata';
}

/**
 * Сохраняет шаблон в хранилище
 * @param {Object} template - объект шаблона
 * @param {Function} callback - функция обратного вызова (error, success)
 */
TemplateStorage.prototype.saveTemplate = function(template, callback) {
  var self = this;
  callback = callback || function() {};
  
  // Валидация шаблона
  if (!template.id || !template.name) {
    callback(new Error('Template must have id and name'), false);
    return;
  }
  
  // Обновляем timestamp
  template.updatedAt = new Date().toISOString();
  if (!template.createdAt) {
    template.createdAt = template.updatedAt;
  }
  
  var storageKey = this.STORAGE_PREFIX + template.id;
  var data = {};
  data[storageKey] = template;
  
  chrome.storage.local.set(data, function() {
    if (chrome.runtime.lastError) {
      callback(chrome.runtime.lastError, false);
      return;
    }
    
    // Обновляем метаданные
    self._updateMetadata(template.id, template.name, function(err) {
      callback(err, !err);
    });
  });
};

/**
 * Загружает шаблон по ID
 * @param {string} id - ID шаблона
 * @param {Function} callback - функция обратного вызова (error, template)
 */
TemplateStorage.prototype.loadTemplate = function(id, callback) {
  callback = callback || function() {};
  
  var storageKey = this.STORAGE_PREFIX + id;
  
  chrome.storage.local.get(storageKey, function(result) {
    if (chrome.runtime.lastError) {
      callback(chrome.runtime.lastError, null);
      return;
    }
    
    var template = result[storageKey] || null;
    callback(null, template);
  });
};

/**
 * Загружает все шаблоны
 * @param {Function} callback - функция обратного вызова (error, templates[])
 */
TemplateStorage.prototype.getAllTemplates = function(callback) {
  var self = this;
  callback = callback || function() {};
  
  // Сначала получаем метаданные для оптимизации
  chrome.storage.local.get(this.METADATA_KEY, function(result) {
    if (chrome.runtime.lastError) {
      callback(chrome.runtime.lastError, []);
      return;
    }
    
    var metadata = result[self.METADATA_KEY] || {};
    var templateIds = Object.keys(metadata);
    
    if (templateIds.length === 0) {
      callback(null, []);
      return;
    }
    
    // Формируем ключи для загрузки
    var storageKeys = templateIds.map(function(id) {
      return self.STORAGE_PREFIX + id;
    });
    
    chrome.storage.local.get(storageKeys, function(templatesData) {
      if (chrome.runtime.lastError) {
        callback(chrome.runtime.lastError, []);
        return;
      }
      
      var templates = [];
      for (var key in templatesData) {
        if (templatesData.hasOwnProperty(key)) {
          templates.push(templatesData[key]);
        }
      }
      
      // Сортируем по дате обновления (новые сначала)
      templates.sort(function(a, b) {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
      
      callback(null, templates);
    });
  });
};

/**
 * Удаляет шаблон по ID
 * @param {string} id - ID шаблона
 * @param {Function} callback - функция обратного вызова (error, success)
 */
TemplateStorage.prototype.deleteTemplate = function(id, callback) {
  var self = this;
  callback = callback || function() {};
  
  var storageKey = this.STORAGE_PREFIX + id;
  
  chrome.storage.local.remove(storageKey, function() {
    if (chrome.runtime.lastError) {
      callback(chrome.runtime.lastError, false);
      return;
    }
    
    // Удаляем из метаданных
    self._removeFromMetadata(id, function(err) {
      callback(err, !err);
    });
  });
};

/**
 * Создает новый пустой шаблон
 * @param {string} name - название шаблона
 * @param {string} url - URL паттерн (опционально)
 * @returns {Object} новый шаблон
 */
TemplateStorage.prototype.createEmptyTemplate = function(name, url) {
  return {
    id: this._generateId(),
    name: name || 'Новый шаблон',
    url: url || '*',
    fields: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

/**
 * Экспортирует все шаблоны в JSON
 * @param {Function} callback - функция обратного вызова (error, jsonString)
 */
TemplateStorage.prototype.exportTemplates = function(callback) {
  this.getAllTemplates(function(err, templates) {
    if (err) {
      callback(err, null);
      return;
    }
    
    var exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      templates: templates
    };
    
    try {
      var jsonString = JSON.stringify(exportData, null, 2);
      callback(null, jsonString);
    } catch (e) {
      callback(e, null);
    }
  });
};

/**
 * Импортирует шаблоны из JSON
 * @param {string} jsonString - JSON строка с шаблонами
 * @param {Function} callback - функция обратного вызова (error, importedCount)
 */
TemplateStorage.prototype.importTemplates = function(jsonString, callback) {
  var self = this;
  callback = callback || function() {};
  
  try {
    var importData = JSON.parse(jsonString);
    
    if (!importData.templates || !Array.isArray(importData.templates)) {
      callback(new Error('Invalid import format'), 0);
      return;
    }
    
    var templates = importData.templates;
    var imported = 0;
    var errors = [];
    
    // Функция для последовательного импорта шаблонов
    function importNext(index) {
      if (index >= templates.length) {
        if (errors.length > 0) {
          callback(new Error('Some templates failed to import: ' + errors.join(', ')), imported);
        } else {
          callback(null, imported);
        }
        return;
      }
      
      var template = templates[index];
      
      // Генерируем новый ID для избежания конфликтов
      template.id = self._generateId();
      template.updatedAt = new Date().toISOString();
      
      self.saveTemplate(template, function(err, success) {
        if (err) {
          errors.push(template.name + ': ' + err.message);
        } else if (success) {
          imported++;
        }
        
        importNext(index + 1);
      });
    }
    
    importNext(0);
    
  } catch (e) {
    callback(e, 0);
  }
};

/**
 * Получает статистику хранилища
 * @param {Function} callback - функция обратного вызова (error, stats)
 */
TemplateStorage.prototype.getStorageStats = function(callback) {
  callback = callback || function() {};
  
  chrome.storage.local.getBytesInUse(null, function(bytesInUse) {
    if (chrome.runtime.lastError) {
      callback(chrome.runtime.lastError, null);
      return;
    }
    
    var stats = {
      bytesInUse: bytesInUse,
      bytesInUseFormatted: self._formatBytes(bytesInUse),
      maxBytes: chrome.storage.local.QUOTA_BYTES,
      percentageUsed: Math.round((bytesInUse / chrome.storage.local.QUOTA_BYTES) * 100)
    };
    
    callback(null, stats);
  });
};

// Приватные методы

/**
 * Обновляет метаданные шаблонов
 * @private
 */
TemplateStorage.prototype._updateMetadata = function(id, name, callback) {
  var self = this;
  
  chrome.storage.local.get(this.METADATA_KEY, function(result) {
    var metadata = result[self.METADATA_KEY] || {};
    metadata[id] = {
      name: name,
      updatedAt: new Date().toISOString()
    };
    
    var data = {};
    data[self.METADATA_KEY] = metadata;
    
    chrome.storage.local.set(data, function() {
      callback(chrome.runtime.lastError);
    });
  });
};

/**
 * Удаляет шаблон из метаданных
 * @private
 */
TemplateStorage.prototype._removeFromMetadata = function(id, callback) {
  var self = this;
  
  chrome.storage.local.get(this.METADATA_KEY, function(result) {
    var metadata = result[self.METADATA_KEY] || {};
    delete metadata[id];
    
    var data = {};
    data[self.METADATA_KEY] = metadata;
    
    chrome.storage.local.set(data, function() {
      callback(chrome.runtime.lastError);
    });
  });
};

/**
 * Генерирует уникальный ID для шаблона
 * @private
 */
TemplateStorage.prototype._generateId = function() {
  return 'tmpl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Форматирует байты в читаемый формат
 * @private
 */
TemplateStorage.prototype._formatBytes = function(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  var k = 1024;
  var sizes = ['Bytes', 'KB', 'MB', 'GB'];
  var i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TemplateStorage;
}
