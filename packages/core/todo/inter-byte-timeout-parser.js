/**
 * Адаптация парсера из библиотеки node-serialport для работы в браузере с использованием Streams API (TransformStream).
 * https://github.com/serialport/node-serialport/blob/main/packages/parser-inter-byte-timeout/lib/index.ts
 * Реализует ту же функциональность, что и исходный код для Node.js, но адаптирован для браузерной среды,
 * где вместо Buffer используется Uint8Array, а вместо Transform из модуля stream используется TransformStream.
 * Предназначен для группировки байтов в пакеты на основе таймаута между ними.
 *
 * Буферизация: Обрабатывает чанк побайтово, добавляя каждый байт в массив currentPacket.
 * Таймаут: Устанавливает таймер после обработки каждого чанка. Если в течение заданного интервала (interval) новых данных нет, накопленный пакет отправляется.
 * Ограничение размера буфера: Параметр maxBufferSize (по умолчанию 65536 байт) предотвращает переполнение памяти, отправляя данные, если буфер достигает лимита.
 * Очистка: Метод flush отправляет остатки данных при завершении потока.
 *
 *  Пример использования:
 * const parser = new InterByteTimeoutParser({ interval: 100 });
 * const transformStream = new TransformStream(parser);
 *
 * Теперь transformStream можно использовать в цепочке потоков, например:
 * readableStream.pipeThrough(transformStream).pipeTo(writableStream);
 *
 *  TODO Заменить InterByteTimeoutStream в barcode-reader на эту реализацию?
 * + Защита от переполнения памяти: Наличие maxBufferSize делает реализацию более устойчивой к ситуациям, когда данные поступают непрерывно без пауз (например, при сбоях оборудования или неправильной конфигурации сканера).
 * + Гибкость: Параметры interval и maxBufferSize настраиваемы, что позволяет адаптировать парсер под разные сценарии.
 * + Точность: Побайтовая обработка теоретически может лучше учитывать паузы между байтами, хотя в контексте Web Serial API это зависит от того, как данные поступают от устройства.
 * - Сложность интеграции: Требуется оборачивать в TransformStream, что немного усложняет код по сравнению с прямым наследованием.
 * - Потенциальная нагрузка: Побайтовая обработка может быть менее эффективной для больших чанков данных, хотя в случае сканеров штрихкодов чанки обычно небольшие.
 *
 * Тогда в readData:
 *     const parser = new InterByteTimeoutParser({ interval: INTERBYTE_TIMEOUT, maxBufferSize: 65536 });
 *     const timeoutStream = new TransformStream({
 *       transform: parser.transform.bind(parser),
 *       flush: parser.flush.bind(parser)
 *     });
 *     const readableStream = port.readable.pipeThrough(timeoutStream);
 *     this.reader = readableStream.getReader();
*/
export class InterByteTimeoutParser {
    constructor({ interval, maxBufferSize = 65536 }) {
        // Валидация входных параметров
        if (!interval) {
            throw new TypeError('"interval" is required');
        }
        if (typeof interval !== 'number' || Number.isNaN(interval)) {
            throw new TypeError('"interval" is not a number');
        }
        if (interval < 1) {
            throw new TypeError('"interval" is not greater than 0');
        }
        if (typeof maxBufferSize !== 'number' || Number.isNaN(maxBufferSize)) {
            throw new TypeError('"maxBufferSize" is not a number');
        }
        if (maxBufferSize < 1) {
            throw new TypeError('"maxBufferSize" is not greater than 0');
        }

        this.maxBufferSize = maxBufferSize;
        this.interval = interval;
        this.currentPacket = [];
        this.intervalID = null;
    }

    transform(chunk, controller) {
        // Очистка существующего таймаута, если он есть
        if (this.intervalID) {
            clearTimeout(this.intervalID);
        }

        // Обработка каждого байта в поступившем чанке (предполагается, что chunk — это Uint8Array)
        for (let i = 0; i < chunk.length; i++) {
            this.currentPacket.push(chunk[i]);
            if (this.currentPacket.length >= this.maxBufferSize) {
                controller.enqueue(new Uint8Array(this.currentPacket));
                this.currentPacket = [];
            }
        }

        // Установка таймаута для отправки данных после периода молчания
        this.intervalID = setTimeout(() => {
            if (this.currentPacket.length > 0) {
                controller.enqueue(new Uint8Array(this.currentPacket));
                this.currentPacket = [];
            }
        }, this.interval);
    }

    flush(controller) {
        // Очистка таймаута и отправка оставшихся данных при завершении потока
        if (this.intervalID) {
            clearTimeout(this.intervalID);
        }
        if (this.currentPacket.length > 0) {
            controller.enqueue(new Uint8Array(this.currentPacket));
        }
    }
}

