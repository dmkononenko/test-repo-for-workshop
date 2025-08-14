/**
 * Тесты для системы хранения шаблонов (Этап 2)
 * Запускать в консоли браузера на странице расширения
 */

(function() {
    'use strict';
    
    console.log('🧪 Начинаем тестирование системы хранения шаблонов...');
    
    var storage = new TemplateStorage();
    var manager = new TemplateManager();
    var testResults = [];
    
    // Тестовые данные
    var testTemplate = {
        id: 'test_template_' + Date.now(),
        name: 'Тестовый шаблон пользователя',
        url: 'https://example.com/admin/users/*',
        fields: [
            {
                id: 'field_1',
                name: 'Имя пользователя',
                selector: '#firstName',
                dataType: 'value'
            },
            {
                id: 'field_2',
                name: 'Email',
                selector: 'input[name="email"]',
                dataType: 'value'
            },
            {
                id: 'field_3',
                name: 'Статус',
                selector: '#status',
                dataType: 'value'
            }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // Вспомогательная функция для выполнения тестов
    function runTest(testName, testFn) {
        return new Promise(function(resolve) {
            console.log('▶️ Выполняется тест:', testName);
            
            try {
                testFn(function(success, message) {
                    if (success) {
                        console.log('✅', testName, '- Пройден', message ? '(' + message + ')' : '');
                        testResults.push({ name: testName, success: true, message: message });
                    } else {
                        console.error('❌', testName, '- Провален', message ? '(' + message + ')' : '');
                        testResults.push({ name: testName, success: false, message: message });
                    }
                    resolve();
                });
            } catch (error) {
                console.error('💥', testName, '- Ошибка выполнения:', error.message);
                testResults.push({ name: testName, success: false, message: error.message });
                resolve();
            }
        });
    }
    
    // Тест 1: Сохранение шаблона
    function testSaveTemplate(callback) {
        storage.saveTemplate(testTemplate, function(err, success) {
            if (err) {
                callback(false, 'Ошибка сохранения: ' + err.message);
                return;
            }
            
            callback(success, success ? 'Шаблон сохранен с ID: ' + testTemplate.id : 'Не удалось сохранить');
        });
    }
    
    // Тест 2: Загрузка шаблона
    function testLoadTemplate(callback) {
        storage.loadTemplate(testTemplate.id, function(err, loadedTemplate) {
            if (err) {
                callback(false, 'Ошибка загрузки: ' + err.message);
                return;
            }
            
            if (!loadedTemplate) {
                callback(false, 'Шаблон не найден');
                return;
            }
            
            var isValid = loadedTemplate.name === testTemplate.name &&
                         loadedTemplate.url === testTemplate.url &&
                         loadedTemplate.fields.length === testTemplate.fields.length;
            
            callback(isValid, isValid ? 'Данные корректны' : 'Данные повреждены');
        });
    }
    
    // Тест 3: Получение всех шаблонов
    function testGetAllTemplates(callback) {
        storage.getAllTemplates(function(err, templates) {
            if (err) {
                callback(false, 'Ошибка получения списка: ' + err.message);
                return;
            }
            
            var found = templates.some(function(template) {
                return template.id === testTemplate.id;
            });
            
            callback(found, 'Найдено шаблонов: ' + templates.length + ', тестовый ' + (found ? 'найден' : 'НЕ найден'));
        });
    }
    
    // Тест 4: Валидация шаблона
    function testValidateTemplate(callback) {
        var validation = manager.validateTemplate(testTemplate);
        
        if (validation.valid) {
            callback(true, 'Валидация пройдена');
        } else {
            callback(false, 'Ошибки валидации: ' + validation.errors.join(', '));
        }
    }
    
    // Тест 5: Проверка соответствия URL
    function testUrlMatching(callback) {
        var testUrls = [
            { url: 'https://example.com/admin/users/123', should: true },
            { url: 'https://example.com/admin/users/', should: true },
            { url: 'https://example.com/admin/orders/456', should: false },
            { url: 'https://other.com/admin/users/789', should: false }
        ];
        
        var results = testUrls.map(function(test) {
            var matches = manager.matchesUrl(testTemplate, test.url);
            return {
                url: test.url,
                expected: test.should,
                actual: matches,
                correct: matches === test.should
            };
        });
        
        var allCorrect = results.every(function(r) { return r.correct; });
        var details = results.map(function(r) {
            return r.url + ': ' + (r.correct ? '✓' : '✗ ' + r.actual + ' vs ' + r.expected);
        }).join('; ');
        
        callback(allCorrect, details);
    }
    
    // Тест 6: Клонирование шаблона
    function testCloneTemplate(callback) {
        var cloned = manager.cloneTemplate(testTemplate, 'Клонированный шаблон');
        
        var isValid = cloned.id !== testTemplate.id &&
                     cloned.name === 'Клонированный шаблон' &&
                     cloned.fields.length === testTemplate.fields.length &&
                     cloned.fields[0].id !== testTemplate.fields[0].id;
        
        callback(isValid, isValid ? 'ID: ' + cloned.id : 'Клонирование некорректно');
    }
    
    // Тест 7: Экспорт шаблонов
    function testExportTemplates(callback) {
        storage.exportTemplates(function(err, jsonString) {
            if (err) {
                callback(false, 'Ошибка экспорта: ' + err.message);
                return;
            }
            
            try {
                var exportData = JSON.parse(jsonString);
                var isValid = exportData.version && 
                             exportData.templates && 
                             Array.isArray(exportData.templates);
                
                callback(isValid, isValid ? 'Экспортировано ' + exportData.templates.length + ' шаблонов' : 'Неверная структура');
            } catch (parseError) {
                callback(false, 'Ошибка парсинга JSON: ' + parseError.message);
            }
        });
    }
    
    // Тест 8: Статистика хранилища
    function testStorageStats(callback) {
        storage.getStorageStats(function(err, stats) {
            if (err) {
                callback(false, 'Ошибка получения статистики: ' + err.message);
                return;
            }
            
            var isValid = typeof stats.bytesInUse === 'number' &&
                         typeof stats.percentageUsed === 'number' &&
                         stats.maxBytes > 0;
            
            callback(isValid, isValid ? stats.bytesInUseFormatted + ' (' + stats.percentageUsed + '%)' : 'Некорректная структура');
        });
    }
    
    // Тест 9: Статистика шаблонов
    function testTemplateStats(callback) {
        manager.getTemplateStats(function(err, stats) {
            if (err) {
                callback(false, 'Ошибка получения статистики: ' + err.message);
                return;
            }
            
            var isValid = typeof stats.totalTemplates === 'number' &&
                         typeof stats.totalFields === 'number' &&
                         typeof stats.averageFieldsPerTemplate === 'number';
            
            callback(isValid, isValid ? 'Шаблонов: ' + stats.totalTemplates + ', полей: ' + stats.totalFields : 'Некорректная структура');
        });
    }
    
    // Тест 10: Удаление шаблона (в конце)
    function testDeleteTemplate(callback) {
        storage.deleteTemplate(testTemplate.id, function(err, success) {
            if (err) {
                callback(false, 'Ошибка удаления: ' + err.message);
                return;
            }
            
            // Проверяем, что шаблон действительно удален
            storage.loadTemplate(testTemplate.id, function(err, template) {
                var deleted = !template;
                callback(deleted, deleted ? 'Шаблон успешно удален' : 'Шаблон все еще существует');
            });
        });
    }
    
    // Запуск всех тестов
    async function runAllTests() {
        console.log('\n🚀 Запуск тестов системы хранения...\n');
        
        await runTest('1. Сохранение шаблона', testSaveTemplate);
        await runTest('2. Загрузка шаблона', testLoadTemplate);
        await runTest('3. Получение всех шаблонов', testGetAllTemplates);
        await runTest('4. Валидация шаблона', testValidateTemplate);
        await runTest('5. Проверка соответствия URL', testUrlMatching);
        await runTest('6. Клонирование шаблона', testCloneTemplate);
        await runTest('7. Экспорт шаблонов', testExportTemplates);
        await runTest('8. Статистика хранилища', testStorageStats);
        await runTest('9. Статистика шаблонов', testTemplateStats);
        await runTest('10. Удаление шаблона', testDeleteTemplate);
        
        // Подсчет результатов
        var passed = testResults.filter(function(t) { return t.success; }).length;
        var failed = testResults.filter(function(t) { return !t.success; }).length;
        
        console.log('\n📊 Результаты тестирования:');
        console.log('✅ Пройдено:', passed);
        console.log('❌ Провалено:', failed);
        console.log('📈 Процент успеха:', Math.round((passed / testResults.length) * 100) + '%');
        
        if (failed > 0) {
            console.log('\n🐛 Провалившиеся тесты:');
            testResults.filter(function(t) { return !t.success; }).forEach(function(test) {
                console.log('  -', test.name + ':', test.message);
            });
        }
        
        console.log('\n🎯 Тестирование Этапа 2 завершено!');
        
        return { passed: passed, failed: failed, total: testResults.length };
    }
    
    // Экспорт для внешнего использования
    window.testTemplateStorage = runAllTests;
    
    // Автоматический запуск, если не в тестовом режиме
    if (!window.TEST_MODE) {
        runAllTests();
    }
    
})();

// Инструкции по использованию
console.log(`
🔧 Инструкции по тестированию:

1. Откройте страницу настроек расширения (chrome-extension://[ID]/options/options.html)
2. Откройте Developer Tools (F12)
3. Скопируйте и вставьте этот код в консоль
4. Код автоматически запустит все тесты

Для повторного запуска используйте: testTemplateStorage()

📝 Что тестируется:
- Сохранение и загрузка шаблонов
- Валидация данных
- Сопоставление URL
- Клонирование шаблонов  
- Экспорт/импорт
- Статистика
- Удаление шаблонов
`);
