# Web Serial Barcode Scanner - React Example

Этот пример демонстрирует интеграцию библиотеки `@web-serial-barcode-scanner` с React приложением.

## Особенности

- **React 18**
- **Zustand** для управления состоянием
- **Context API** 


## Установка и запуск

1. Установите зависимости:
```bash
npm install
```

2. Запустите dev сервер:
```bash
npm run dev
```

3. Откройте браузер по адресу: `http://localhost:3001`


## Управление состоянием

Используется **Zustand** store для централизованного управления состоянием:

```javascript
const {
  status,
  statusMessage,
  isConnected,
  rawData,
  parsedData,
  autoConnectEnabled,
  // ... другие поля
} = useBarcodeScannerStore();
```

## События сканера

Компонент автоматически подписывается на события сканера:

- `data` - новые данные от сканера
- `status` - изменения статуса подключения

## Сравнение с Vue версией

| Аспект | Vue | React |
|--------|-----|-------|
| State Management | Pinia | Zustand |
| Dependency Injection | Provide/Inject | Context API |
| Component Logic | Composition API | Hooks |
| Template Syntax | Vue Template | JSX |
| Styling | Scoped CSS | CSS Modules/Global CSS |

## Лицензия

MIT
