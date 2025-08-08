/**
 * Обработка данных, поступающих от сканера штрихкодов через Web Serial API.
 * Реализован как наследник TransformStream и выполняет следующее:
 *
 * Буферизация данных: Принимает чанк данных (тип Uint8Array), добавляет его в массив buffer целиком.
 * Таймаут: Устанавливает таймер (с параметром interval), который сбрасывается при поступлении нового чанка.
 * Если новых данных нет в течение заданного времени, накопленный буфер отправляется дальше по потоку.
 * Очистка: При завершении потока (метод flush) отправляет остатки данных из буфера.
 *
 * */
class InterByteTimeoutStream extends TransformStream {
    constructor(interval) {
        let timeoutId;
        let buffer = [];

        super({
            transform(chunk, controller) {
                buffer.push(...chunk);
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    if (buffer.length > 0) {
                        controller.enqueue(new Uint8Array(buffer));
                        buffer = [];
                    }
                }, interval);
            },
            flush(controller) {
                if (buffer.length > 0) {
                    controller.enqueue(new Uint8Array(buffer));
                }
            }
        });
    }
}

export { InterByteTimeoutStream };