// Service Worker для Chrome расширения Admin Panel Data Extractor
// Используем ES5 синтаксис для максимальной совместимости

// Инициализация расширения при установке
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('Admin Panel Data Extractor установлен/обновлен', details);
  
  // Создание базового контекстного меню
  chrome.contextMenus.create({
    id: 'admin-panel-extractor',
    title: 'Admin Panel Data Extractor',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'create-template',
    parentId: 'admin-panel-extractor',
    title: 'Создать шаблон',
    contexts: ['page']
  });
  
  // Установка индикатора успешной установки
  chrome.action.setBadgeText({text: 'OK'});
  chrome.action.setBadgeBackgroundColor({color: '#4CAF50'});
  
  // Очистка бейджа через 3 секунды
  setTimeout(function() {
    chrome.action.setBadgeText({text: ''});
  }, 3000);
});

// Обработка кликов по контекстному меню
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  console.log('Клик по контекстному меню:', info.menuItemId);
  
  if (info.menuItemId === 'create-template') {
    // Пока просто отправляем сообщение в content script
    chrome.tabs.sendMessage(tab.id, {
      action: 'create-template',
      url: tab.url
    }).catch(function(error) {
      console.log('Ошибка отправки сообщения в content script:', error);
    });
  }
});

// Обработка сообщений от popup и content scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Получено сообщение:', request);
  
  if (request.type === 'debug') {
    console.log('Debug данные:', request.data);
    sendResponse({status: 'debug logged'});
  }
  
  if (request.action === 'test') {
    console.log('Тест коммуникации успешен');
    sendResponse({status: 'communication ok', timestamp: Date.now()});
  }
  
  // Обязательно возвращаем true для асинхронных ответов
  return true;
});

// Обработка активации расширения
chrome.action.onClicked.addListener(function(tab) {
  console.log('Клик по иконке расширения на странице:', tab.url);
});

console.log('Service Worker загружен успешно');
