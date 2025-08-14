/**
 * JavaScript для страницы настроек Data Extractor
 * Использует ES5 синтаксис для максимальной совместимости
 */

(function() {
    'use strict';
    
    // Глобальные переменные
    var templateManager = new TemplateManager();
    var currentEditingTemplate = null;
    var allTemplates = [];
    
    // DOM элементы
    var elements = {
        // Вкладки
        tabButtons: document.querySelectorAll('.tab-button'),
        tabContents: document.querySelectorAll('.tab-content'),
        
        // Список шаблонов
        templatesList: document.getElementById('templates-list'),
        templatesCount: document.getElementById('templates-count'),
        emptyState: document.getElementById('empty-state'),
        templateSearch: document.getElementById('template-search'),
        
        // Кнопки
        createTemplate: document.getElementById('create-template'),
        exportTemplates: document.getElementById('export-templates'),
        importTemplates: document.getElementById('import-templates'),
        importFile: document.getElementById('import-file'),
        
        // Модальное окно
        modal: document.getElementById('template-modal'),
        modalTitle: document.getElementById('modal-title'),
        modalClose: document.getElementById('modal-close'),
        modalCancel: document.getElementById('modal-cancel'),
        modalSave: document.getElementById('modal-save'),
        
        // Форма шаблона
        templateForm: document.getElementById('template-form'),
        templateName: document.getElementById('template-name'),
        templateUrl: document.getElementById('template-url'),
        templateFields: document.getElementById('template-fields'),
        addField: document.getElementById('add-field'),
        
        // Настройки
        autoCopy: document.getElementById('auto-copy'),
        showNotifications: document.getElementById('show-notifications'),
        highlightFields: document.getElementById('highlight-fields'),
        
        // Хранилище
        storageUsed: document.getElementById('storage-used'),
        storageProgress: document.getElementById('storage-progress'),
        
        // Импорт результат
        importResult: document.getElementById('import-result')
    };
    
    // Инициализация
    document.addEventListener('DOMContentLoaded', function() {
        initializeTabs();
        initializeEventListeners();
        loadTemplates();
        loadSettings();
        updateStorageInfo();
    });
    
    // Функции инициализации
    
    function initializeTabs() {
        elements.tabButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                var tabName = this.getAttribute('data-tab');
                showTab(tabName);
            });
        });
    }
    
    function showTab(tabName) {
        // Убираем активные классы
        elements.tabButtons.forEach(function(btn) {
            btn.classList.remove('active');
        });
        elements.tabContents.forEach(function(content) {
            content.classList.remove('active');
        });
        
        // Добавляем активные классы
        var activeButton = document.querySelector('[data-tab="' + tabName + '"]');
        var activeContent = document.getElementById(tabName);
        
        if (activeButton && activeContent) {
            activeButton.classList.add('active');
            activeContent.classList.add('active');
        }
    }
    
    function initializeEventListeners() {
        // Создание шаблона
        elements.createTemplate.addEventListener('click', function() {
            openTemplateModal();
        });
        
        // Поиск шаблонов
        elements.templateSearch.addEventListener('input', function() {
            filterTemplates(this.value);
        });
        
        // Экспорт/импорт
        elements.exportTemplates.addEventListener('click', exportTemplates);
        elements.importTemplates.addEventListener('click', function() {
            elements.importFile.click();
        });
        elements.importFile.addEventListener('change', importTemplates);
        
        // Модальное окно
        elements.modalClose.addEventListener('click', closeTemplateModal);
        elements.modalCancel.addEventListener('click', closeTemplateModal);
        elements.modalSave.addEventListener('click', saveTemplate);
        
        // Клик вне модального окна
        elements.modal.addEventListener('click', function(e) {
            if (e.target === elements.modal) {
                closeTemplateModal();
            }
        });
        
        // Добавление поля
        elements.addField.addEventListener('click', addTemplateField);
        
        // Настройки
        elements.autoCopy.addEventListener('change', saveSettings);
        elements.showNotifications.addEventListener('change', saveSettings);
        elements.highlightFields.addEventListener('change', saveSettings);
        
        // ESC для закрытия модального окна
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && elements.modal.classList.contains('show')) {
                closeTemplateModal();
            }
        });
    }
    
    // Работа с шаблонами
    
    function loadTemplates() {
        templateManager.storage.getAllTemplates(function(err, templates) {
            if (err) {
                console.error('Error loading templates:', err);
                showToast('Ошибка загрузки шаблонов: ' + err.message, 'error');
                return;
            }
            
            allTemplates = templates;
            renderTemplates(templates);
            updateTemplatesCount(templates.length);
        });
    }
    
    function renderTemplates(templates) {
        if (templates.length === 0) {
            elements.templatesList.style.display = 'none';
            elements.emptyState.style.display = 'block';
            return;
        }
        
        elements.templatesList.style.display = 'block';
        elements.emptyState.style.display = 'none';
        
        elements.templatesList.innerHTML = '';
        
        templates.forEach(function(template) {
            var templateCard = createTemplateCard(template);
            elements.templatesList.appendChild(templateCard);
        });
    }
    
    function createTemplateCard(template) {
        var card = document.createElement('div');
        card.className = 'template-card';
        card.innerHTML = [
            '<div class="template-header">',
                '<div>',
                    '<div class="template-name">' + escapeHtml(template.name) + '</div>',
                    '<span class="template-url">' + escapeHtml(template.url || '*') + '</span>',
                '</div>',
            '</div>',
            '<div class="template-fields">',
                '<div class="template-fields-count">',
                    template.fields.length + ' полей',
                '</div>',
                '<div class="template-fields-list">',
                    template.fields.slice(0, 5).map(function(field) {
                        return '<span class="field-tag">' + escapeHtml(field.name) + '</span>';
                    }).join(''),
                    template.fields.length > 5 ? '<span class="field-tag">+' + (template.fields.length - 5) + '</span>' : '',
                '</div>',
            '</div>',
            '<div class="template-meta">',
                'Создан: ' + formatDate(template.createdAt) + ' | ',
                'Обновлен: ' + formatDate(template.updatedAt),
            '</div>',
            '<div class="template-actions">',
                '<button class="btn btn-secondary edit-template" data-id="' + template.id + '">',
                    '<span class="icon">✏️</span>Редактировать',
                '</button>',
                '<button class="btn btn-secondary clone-template" data-id="' + template.id + '">',
                    '<span class="icon">📋</span>Клонировать',
                '</button>',
                '<button class="btn btn-danger delete-template" data-id="' + template.id + '">',
                    '<span class="icon">🗑️</span>Удалить',
                '</button>',
            '</div>'
        ].join('');
        
        // Добавляем обработчики событий
        var editBtn = card.querySelector('.edit-template');
        var cloneBtn = card.querySelector('.clone-template');
        var deleteBtn = card.querySelector('.delete-template');
        
        editBtn.addEventListener('click', function() {
            editTemplate(template.id);
        });
        
        cloneBtn.addEventListener('click', function() {
            cloneTemplate(template.id);
        });
        
        deleteBtn.addEventListener('click', function() {
            deleteTemplate(template.id);
        });
        
        return card;
    }
    
    function updateTemplatesCount(count) {
        var text = count === 0 ? 'Нет шаблонов' : 
                  count === 1 ? '1 шаблон' :
                  count < 5 ? count + ' шаблона' :
                  count + ' шаблонов';
        elements.templatesCount.textContent = text;
    }
    
    function filterTemplates(query) {
        if (!query.trim()) {
            renderTemplates(allTemplates);
            return;
        }
        
        query = query.toLowerCase();
        var filtered = allTemplates.filter(function(template) {
            return template.name.toLowerCase().indexOf(query) !== -1 ||
                   template.url.toLowerCase().indexOf(query) !== -1 ||
                   template.fields.some(function(field) {
                       return field.name.toLowerCase().indexOf(query) !== -1;
                   });
        });
        
        renderTemplates(filtered);
    }
    
    // Модальное окно шаблона
    
    function openTemplateModal(template) {
        currentEditingTemplate = template || null;
        
        if (template) {
            elements.modalTitle.textContent = 'Редактировать шаблон';
            elements.templateName.value = template.name;
            elements.templateUrl.value = template.url || '';
            renderTemplateFields(template.fields);
        } else {
            elements.modalTitle.textContent = 'Создать шаблон';
            elements.templateName.value = '';
            elements.templateUrl.value = '*';
            renderTemplateFields([]);
        }
        
        elements.modal.classList.add('show');
        elements.templateName.focus();
    }
    
    function closeTemplateModal() {
        elements.modal.classList.remove('show');
        currentEditingTemplate = null;
        elements.templateForm.reset();
    }
    
    function renderTemplateFields(fields) {
        elements.templateFields.innerHTML = '';
        
        if (fields.length === 0) {
            var emptyDiv = document.createElement('div');
            emptyDiv.className = 'fields-empty';
            emptyDiv.textContent = 'Поля не добавлены. Нажмите "Добавить поле" для создания первого поля.';
            elements.templateFields.appendChild(emptyDiv);
            return;
        }
        
        fields.forEach(function(field, index) {
            var fieldDiv = createFieldElement(field, index);
            elements.templateFields.appendChild(fieldDiv);
        });
    }
    
    function createFieldElement(field, index) {
        var div = document.createElement('div');
        div.className = 'field-item';
        div.innerHTML = [
            '<input type="text" placeholder="Название поля" value="' + escapeHtml(field.name || '') + '" data-field="name">',
            '<input type="text" placeholder="CSS селектор" value="' + escapeHtml(field.selector || '') + '" data-field="selector">',
            '<select data-field="dataType">',
                '<option value="textContent"' + (field.dataType === 'textContent' ? ' selected' : '') + '>Text Content</option>',
                '<option value="value"' + (field.dataType === 'value' ? ' selected' : '') + '>Value</option>',
                '<option value="innerText"' + (field.dataType === 'innerText' ? ' selected' : '') + '>Inner Text</option>',
                '<option value="innerHTML"' + (field.dataType === 'innerHTML' ? ' selected' : '') + '>Inner HTML</option>',
            '</select>',
            '<button type="button" class="field-remove" title="Удалить поле">×</button>'
        ].join('');
        
        // Добавляем обработчик удаления
        var removeBtn = div.querySelector('.field-remove');
        removeBtn.addEventListener('click', function() {
            div.remove();
            if (elements.templateFields.children.length === 0) {
                renderTemplateFields([]);
            }
        });
        
        return div;
    }
    
    function addTemplateField() {
        var emptyField = elements.templateFields.querySelector('.fields-empty');
        if (emptyField) {
            emptyField.remove();
        }
        
        var newField = {
            name: '',
            selector: '',
            dataType: 'textContent'
        };
        
        var fieldDiv = createFieldElement(newField, elements.templateFields.children.length);
        elements.templateFields.appendChild(fieldDiv);
        
        // Фокус на первое поле
        var firstInput = fieldDiv.querySelector('input');
        if (firstInput) {
            firstInput.focus();
        }
    }
    
    function collectTemplateFields() {
        var fields = [];
        var fieldItems = elements.templateFields.querySelectorAll('.field-item');
        
        fieldItems.forEach(function(item) {
            var nameInput = item.querySelector('[data-field="name"]');
            var selectorInput = item.querySelector('[data-field="selector"]');
            var dataTypeSelect = item.querySelector('[data-field="dataType"]');
            
            var name = nameInput.value.trim();
            var selector = selectorInput.value.trim();
            
            if (name && selector) {
                fields.push({
                    id: templateManager._generateFieldId(),
                    name: name,
                    selector: selector,
                    dataType: dataTypeSelect.value
                });
            }
        });
        
        return fields;
    }
    
    function saveTemplate() {
        var name = elements.templateName.value.trim();
        var url = elements.templateUrl.value.trim() || '*';
        var fields = collectTemplateFields();
        
        if (!name) {
            showToast('Введите название шаблона', 'error');
            elements.templateName.focus();
            return;
        }
        
        if (fields.length === 0) {
            showToast('Добавьте хотя бы одно поле', 'error');
            return;
        }
        
        var template = currentEditingTemplate ? 
            Object.assign({}, currentEditingTemplate) : 
            templateManager.storage.createEmptyTemplate(name, url);
        
        template.name = name;
        template.url = url;
        template.fields = fields;
        
        // Валидация
        var validation = templateManager.validateTemplate(template);
        if (!validation.valid) {
            showToast('Ошибки в шаблоне: ' + validation.errors.join(', '), 'error');
            return;
        }
        
        templateManager.storage.saveTemplate(template, function(err, success) {
            if (err) {
                showToast('Ошибка сохранения: ' + err.message, 'error');
                return;
            }
            
            if (success) {
                showToast(currentEditingTemplate ? 'Шаблон обновлен' : 'Шаблон создан', 'success');
                closeTemplateModal();
                loadTemplates();
            }
        });
    }
    
    // Действия с шаблонами
    
    function editTemplate(templateId) {
        templateManager.storage.loadTemplate(templateId, function(err, template) {
            if (err || !template) {
                showToast('Ошибка загрузки шаблона', 'error');
                return;
            }
            
            openTemplateModal(template);
        });
    }
    
    function cloneTemplate(templateId) {
        templateManager.storage.loadTemplate(templateId, function(err, template) {
            if (err || !template) {
                showToast('Ошибка загрузки шаблона', 'error');
                return;
            }
            
            var cloned = templateManager.cloneTemplate(template);
            
            templateManager.storage.saveTemplate(cloned, function(err, success) {
                if (err) {
                    showToast('Ошибка клонирования: ' + err.message, 'error');
                    return;
                }
                
                if (success) {
                    showToast('Шаблон скопирован', 'success');
                    loadTemplates();
                }
            });
        });
    }
    
    function deleteTemplate(templateId) {
        if (!confirm('Удалить этот шаблон? Действие нельзя будет отменить.')) {
            return;
        }
        
        templateManager.storage.deleteTemplate(templateId, function(err, success) {
            if (err) {
                showToast('Ошибка удаления: ' + err.message, 'error');
                return;
            }
            
            if (success) {
                showToast('Шаблон удален', 'success');
                loadTemplates();
            }
        });
    }
    
    // Импорт/экспорт
    
    function exportTemplates() {
        templateManager.storage.exportTemplates(function(err, jsonString) {
            if (err) {
                showToast('Ошибка экспорта: ' + err.message, 'error');
                return;
            }
            
            var blob = new Blob([jsonString], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            
            var a = document.createElement('a');
            a.href = url;
            a.download = 'data-extractor-templates-' + new Date().toISOString().split('T')[0] + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            showToast('Шаблоны экспортированы', 'success');
        });
    }
    
    function importTemplates(e) {
        var file = e.target.files[0];
        if (!file) return;
        
        var reader = new FileReader();
        reader.onload = function(event) {
            try {
                var jsonString = event.target.result;
                
                templateManager.storage.importTemplates(jsonString, function(err, importedCount) {
                    if (err) {
                        showImportResult('Ошибка импорта: ' + err.message, 'error');
                        return;
                    }
                    
                    showImportResult('Импортировано шаблонов: ' + importedCount, 'success');
                    loadTemplates();
                });
                
            } catch (error) {
                showImportResult('Ошибка чтения файла: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
        
        // Сброс input
        e.target.value = '';
    }
    
    function showImportResult(message, type) {
        elements.importResult.textContent = message;
        elements.importResult.className = 'import-result ' + type;
        elements.importResult.style.display = 'block';
        
        setTimeout(function() {
            elements.importResult.style.display = 'none';
        }, 5000);
    }
    
    // Настройки
    
    function loadSettings() {
        chrome.storage.local.get(['settings'], function(result) {
            var settings = result.settings || {
                autoCopy: true,
                showNotifications: true,
                highlightFields: false
            };
            
            elements.autoCopy.checked = settings.autoCopy;
            elements.showNotifications.checked = settings.showNotifications;
            elements.highlightFields.checked = settings.highlightFields;
        });
    }
    
    function saveSettings() {
        var settings = {
            autoCopy: elements.autoCopy.checked,
            showNotifications: elements.showNotifications.checked,
            highlightFields: elements.highlightFields.checked
        };
        
        chrome.storage.local.set({ settings: settings }, function() {
            if (chrome.runtime.lastError) {
                showToast('Ошибка сохранения настроек', 'error');
            } else {
                showToast('Настройки сохранены', 'success');
            }
        });
    }
    
    // Информация о хранилище
    
    function updateStorageInfo() {
        templateManager.storage.getStorageStats(function(err, stats) {
            if (err) {
                elements.storageUsed.textContent = 'Ошибка загрузки';
                return;
            }
            
            elements.storageUsed.textContent = stats.bytesInUseFormatted + ' из 5 MB';
            elements.storageProgress.style.width = stats.percentageUsed + '%';
            
            if (stats.percentageUsed > 80) {
                elements.storageProgress.style.background = 'linear-gradient(90deg, #ff9800, #f44336)';
            } else if (stats.percentageUsed > 60) {
                elements.storageProgress.style.background = 'linear-gradient(90deg, #ffc107, #ff9800)';
            }
        });
    }
    
    // Утилиты
    
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        var date = new Date(dateString);
        return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    function showToast(message, type) {
        // Простое уведомление (можно заменить на более красивое решение)
        var className = type === 'error' ? 'alert alert-error' : 'alert alert-success';
        console.log('[' + type.toUpperCase() + '] ' + message);
        
        // TODO: Добавить красивые toast уведомления
        if (type === 'error') {
            alert('Ошибка: ' + message);
        }
    }
    
})();
