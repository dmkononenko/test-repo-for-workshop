/**
 * JavaScript для popup интерфейса Data Extractor
 * Использует ES5 синтаксис для максимальной совместимости
 */

(function() {
  'use strict';
  
  var templateManager = new TemplateManager();
  var currentUrl = '';
  var availableTemplates = [];

  // DOM элементы
  var elements = {
    currentUrl: document.getElementById('current-url'),
    templatesContainer: document.getElementById('templates-container'),
    createTemplate: document.getElementById('create-template'),
    openSettings: document.getElementById('open-settings'),
    stats: document.getElementById('stats'),
    status: document.getElementById('status')
  };

  // Инициализация при загрузке
  document.addEventListener('DOMContentLoaded', function() {
    initializePopup();
    loadCurrentUrl();
    loadTemplatesForCurrentPage();
    loadStats();
    initializeEventListeners();
  });

  function initializePopup() {
    console.log('Popup initialized');
  }

  function initializeEventListeners() {
    // Кнопка создания шаблона
    elements.createTemplate.addEventListener('click', function() {
      openSettingsPage();
    });

    // Кнопка настроек
    elements.openSettings.addEventListener('click', function() {
      openSettingsPage();
    });
  }

  function loadCurrentUrl() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs.length > 0) {
        currentUrl = tabs[0].url;
        elements.currentUrl.textContent = currentUrl;
      } else {
        elements.currentUrl.textContent = 'Не удалось получить URL';
      }
    });
  }

  function loadTemplatesForCurrentPage() {
    // Ждем получения URL
    setTimeout(function() {
      if (!currentUrl) {
        renderNoTemplates('URL не загружен');
        return;
      }

      templateManager.getTemplatesForUrl(currentUrl, function(err, templates) {
        if (err) {
          console.error('Error loading templates:', err);
          renderNoTemplates('Ошибка загрузки шаблонов');
          return;
        }

        availableTemplates = templates;
        renderTemplates(templates);
      });
    }, 500);
  }

  function renderTemplates(templates) {
    if (!templates || templates.length === 0) {
      renderNoTemplates('Нет подходящих шаблонов для этой страницы');
      return;
    }

    var templatesHtml = '<div class="templates-list">';
    
    templates.forEach(function(template, index) {
      var isRecommended = template.url !== '*' && templateManager.matchesUrl(template, currentUrl);
      var fieldsCount = template.fields ? template.fields.length : 0;
      
      templatesHtml += [
        '<div class="template-item' + (isRecommended ? ' recommended' : '') + '" data-template-id="' + template.id + '">',
          '<div class="template-info">',
            '<div class="template-name">' + escapeHtml(template.name) + '</div>',
            '<div class="template-fields-count">' + fieldsCount + ' полей</div>',
          '</div>',
          '<button class="template-apply-btn" data-template-id="' + template.id + '">',
            'Применить',
          '</button>',
        '</div>'
      ].join('');
    });

    templatesHtml += '</div>';
    elements.templatesContainer.innerHTML = templatesHtml;

    // Добавляем обработчики событий
    var applyButtons = elements.templatesContainer.querySelectorAll('.template-apply-btn');
    applyButtons.forEach(function(button) {
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        var templateId = this.getAttribute('data-template-id');
        applyTemplate(templateId);
      });
    });

    // Клик по всему элементу шаблона тоже применяет его
    var templateItems = elements.templatesContainer.querySelectorAll('.template-item');
    templateItems.forEach(function(item) {
      item.addEventListener('click', function() {
        var templateId = this.getAttribute('data-template-id');
        applyTemplate(templateId);
      });
    });
  }

  function renderNoTemplates(message) {
    elements.templatesContainer.innerHTML = '<div class="no-templates">' + message + '</div>';
  }

  function applyTemplate(templateId) {
    var template = availableTemplates.find(function(t) { return t.id === templateId; });
    if (!template) {
      showStatus('Шаблон не найден', 'error');
      return;
    }

    showStatus('Применяется шаблон "' + template.name + '"...', 'loading');

    // Отправляем сообщение в content script для извлечения данных
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs || tabs.length === 0) {
        showStatus('Не удалось получить активную вкладку', 'error');
        return;
      }

      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'extractData',
        template: template
      }, function(response) {
        if (chrome.runtime.lastError) {
          showStatus('Ошибка связи со страницей', 'error');
          return;
        }

        if (response && response.success) {
          showStatus('Данные скопированы (' + response.fieldsCount + ' полей)', 'success');
          
          // Автоматически закрываем popup через 2 секунды
          setTimeout(function() {
            window.close();
          }, 2000);
        } else {
          var errorMsg = response && response.error ? response.error : 'Неизвестная ошибка';
          showStatus('Ошибка: ' + errorMsg, 'error');
        }
      });
    });
  }

  function loadStats() {
    templateManager.getTemplateStats(function(err, stats) {
      if (err) {
        elements.stats.textContent = 'Ошибка загрузки статистики';
        return;
      }

      var statsText = 'Всего шаблонов: ' + stats.totalTemplates;
      if (stats.totalTemplates > 0) {
        statsText += ' | Полей: ' + stats.totalFields;
      }
      
      elements.stats.textContent = statsText;
    });
  }

  function openSettingsPage() {
    chrome.runtime.openOptionsPage(function() {
      window.close();
    });
  }

  function showStatus(message, type) {
    elements.status.textContent = message;
    elements.status.className = 'status ' + (type || '');
    elements.status.style.display = 'block';

    if (type !== 'loading') {
      setTimeout(function() {
        elements.status.style.display = 'none';
      }, 3000);
    }
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

})();
