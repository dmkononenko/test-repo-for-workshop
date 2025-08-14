// Popup Script для Chrome расширения Admin Panel Data Extractor
// Используем ES5 синтаксис для максимальной совместимости

(function() {
  'use strict';
  
  console.log('Popup script загружен');
  
  var currentTab = null;
  var elements = {
    urlDisplay: null,
    createButton: null,
    status: null
  };
  
  // Инициализация при загрузке DOM
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup DOM загружен');
    
    // Получаем ссылки на элементы
    elements.urlDisplay = document.getElementById('current-url');
    elements.createButton = document.getElementById('create-template');
    elements.status = document.getElementById('status');
    
    // Проверяем, что все элементы найдены
    if (!elements.urlDisplay || !elements.createButton || !elements.status) {
      console.error('Не удалось найти все необходимые элементы popup');
      showStatus('Ошибка инициализации интерфейса', 'error');
      return;
    }
    
    // Загружаем информацию о текущей вкладке
    loadCurrentTabInfo();
    
    // Настраиваем обработчики событий
    setupEventHandlers();
    
    console.log('Popup инициализирован успешно');
  });
  
  // Загрузка информации о текущей вкладке
  function loadCurrentTabInfo() {
    console.log('Загрузка информации о текущей вкладке...');
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (chrome.runtime.lastError) {
        console.error('Ошибка получения информации о вкладке:', chrome.runtime.lastError);
        elements.urlDisplay.textContent = 'Ошибка загрузки URL';
        showStatus('Не удалось получить информацию о странице', 'error');
        return;
      }
      
      if (tabs && tabs.length > 0) {
        currentTab = tabs[0];
        var displayUrl = currentTab.url;
        
        // Обрезаем очень длинные URL для лучшего отображения
        if (displayUrl.length > 100) {
          displayUrl = displayUrl.substring(0, 97) + '...';
        }
        
        elements.urlDisplay.textContent = displayUrl;
        console.log('✓ URL загружен:', currentTab.url);
        
        // Проверяем, поддерживается ли страница (не chrome://, не file:// и т.д.)
        validateCurrentPage();
      } else {
        console.error('Не найдено активных вкладок');
        elements.urlDisplay.textContent = 'Нет активной вкладки';
        showStatus('Не найдено активной вкладки', 'error');
      }
    });
  }
  
  // Проверка, поддерживается ли текущая страница
  function validateCurrentPage() {
    if (!currentTab || !currentTab.url) {
      return false;
    }
    
    var url = currentTab.url;
    var unsupportedProtocols = ['chrome://', 'chrome-extension://', 'moz-extension://', 'file://'];
    
    for (var i = 0; i < unsupportedProtocols.length; i++) {
      if (url.indexOf(unsupportedProtocols[i]) === 0) {
        console.log('Страница не поддерживается:', url);
        elements.createButton.disabled = true;
        elements.createButton.textContent = 'Страница не поддерживается';
        showStatus('Расширение не работает на служебных страницах', 'error');
        return false;
      }
    }
    
    return true;
  }
  
  // Настройка обработчиков событий
  function setupEventHandlers() {
    elements.createButton.addEventListener('click', handleCreateTemplate);
    
    // Тест коммуникации с background script при инициализации
    testCommunication();
  }
  
  // Обработчик кнопки создания шаблона
  function handleCreateTemplate() {
    console.log('Кнопка создания шаблона нажата');
    
    if (!currentTab) {
      showStatus('Нет информации о текущей странице', 'error');
      return;
    }
    
    // Блокируем кнопку во время выполнения
    setLoadingState(true);
    
    // В рамках этапа 1 просто показываем информацию
    setTimeout(function() {
      var message = 'Этап 1: Базовая настройка завершена!\n\n' +
                   'Функция создания шаблона будет реализована в следующих этапах.\n\n' +
                   'Текущая страница: ' + currentTab.url + '\n' +
                   'Заголовок: ' + (currentTab.title || 'Не определен');
      
      alert(message);
      
      setLoadingState(false);
      showStatus('Готов к разработке следующего этапа', 'success');
      
      console.log('✓ Демонстрация этапа 1 завершена');
    }, 500);
  }
  
  // Управление состоянием загрузки
  function setLoadingState(loading) {
    if (loading) {
      elements.createButton.disabled = true;
      elements.createButton.textContent = 'Обработка...';
      document.body.classList.add('loading');
    } else {
      elements.createButton.disabled = false;
      elements.createButton.textContent = 'Создать шаблон';
      document.body.classList.remove('loading');
    }
  }
  
  // Отображение статуса
  function showStatus(message, type) {
    elements.status.textContent = message;
    elements.status.className = 'status ' + (type || 'success');
    elements.status.style.display = 'block';
    
    // Автоматически скрываем статус через 5 секунд
    setTimeout(function() {
      elements.status.style.display = 'none';
    }, 5000);
  }
  
  // Тест коммуникации с background script
  function testCommunication() {
    chrome.runtime.sendMessage({action: 'test'}, function(response) {
      if (chrome.runtime.lastError) {
        console.error('Ошибка коммуникации с background script:', chrome.runtime.lastError);
        return;
      }
      
      if (response && response.status === 'communication ok') {
        console.log('✓ Коммуникация с background script работает');
        console.log('Timestamp от background:', response.timestamp);
      } else {
        console.log('✗ Неожиданный ответ от background script:', response);
      }
    });
  }
  
  console.log('Popup script инициализирован');
})();
