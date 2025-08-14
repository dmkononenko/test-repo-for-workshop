// Content Script для Chrome расширения Admin Panel Data Extractor
// Используем ES5 синтаксис для максимальной совместимости

(function() {
  'use strict';
  
  console.log('Content Script загружен на странице:', window.location.href);
  
  // Проверка, что скрипт не загружен повторно
  if (window.adminPanelExtractorLoaded) {
    console.log('Content Script уже загружен, выход');
    return;
  }
  window.adminPanelExtractorLoaded = true;
  
  // Обработка сообщений от background script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Content Script получил сообщение:', request);
    
    if (request.action === 'create-template') {
      console.log('Запрос на создание шаблона для URL:', request.url);
      
      // Пока просто показываем alert
      alert('Функция создания шаблона будет реализована в следующих этапах.\nТекущий URL: ' + request.url);
      
      sendResponse({status: 'template creation initiated'});
    }
    
    return true;
  });
  
  // Тест коммуникации с background script
  chrome.runtime.sendMessage({action: 'test'}, function(response) {
    if (response) {
      console.log('✓ Коммуникация с background script работает:', response);
    } else {
      console.log('✗ Ошибка коммуникации с background script');
    }
  });
  
  // Функция для отправки отладочной информации
  function sendDebugInfo(event, data) {
    chrome.runtime.sendMessage({
      type: 'debug', 
      data: {
        event: event,
        data: data,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // Отправляем информацию о загрузке страницы
  sendDebugInfo('page_loaded', {
    title: document.title,
    forms_count: document.forms.length,
    inputs_count: document.querySelectorAll('input').length
  });
  
  console.log('Content Script инициализирован успешно');
})();
