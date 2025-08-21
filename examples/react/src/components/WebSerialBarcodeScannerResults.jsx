import React from 'react';
import { useBarcodeScannerStore } from '../stores/barcodeScannerStore';

const WebSerialBarcodeScannerResults = () => {
  const { rawData, parsedData } = useBarcodeScannerStore();

  // Форматируем данные для отображения (новые сверху)
  const formattedRawData = [...rawData].reverse();
  const formattedParsedData = [...parsedData].reverse();

  // Форматируем дату
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString() + '.' +
        date.getMilliseconds().toString().padStart(3, '0');
  };

  // Форматируем parsed данные для отображения
  const formatParsedData = (data) => {
    if (!data) return '';
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="scan-results">
      <h2>Результаты сканирования</h2>

      <div className="data-columns">
        <div className="column">
          <h3>Отсканированные данные:</h3>
          <div className="data-container">
            {formattedRawData.length === 0 ? (
              <div className="empty-message">
                Данные от сканера будут отображаться здесь
              </div>
            ) : (
              <div className="data-list">
                {formattedRawData.map((item, index) => (
                  <div key={index} className="data-item">
                    <div className="timestamp">{formatDate(item.timestamp)}</div>
                    <div className="data-value">{item.data}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="column">
          <h3>Обработанные данные:</h3>
          <div className="data-container">
            {formattedParsedData.length === 0 ? (
              <div className="empty-message">
                Обработанные данные будут отображаться здесь
              </div>
            ) : (
              <div className="data-list">
                {formattedParsedData.map((item, index) => (
                  <div key={index} className="data-item parsed">
                    <div className="timestamp">{formatDate(item.timestamp)}</div>

                    {item.error ? (
                      <div className="error">
                        <strong>Ошибка:</strong> {item.error}
                        <div className="raw-data">Исходные данные: {item.raw}</div>
                      </div>
                    ) : (
                      <>
                        {item.type && <div className="data-type">Тип: {item.type}</div>}
                        <pre className="parsed-json">{formatParsedData(item.data)}</pre>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebSerialBarcodeScannerResults;
