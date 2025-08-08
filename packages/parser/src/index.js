class BarcodeDataParser {
    constructor() {
        this.parsingRules = [
            {
                type: 'SSCC',
                regex: /^0*(\d{18})$/,
                parse: (match) => ({ sscc: match[1] })
            },
            {
                type: 'EAN13',
                regex: /^\d{13}$/,
                parse: (match) => ({ ean13: match[0] })
            },
            {
                type: 'Prescription',
                regex: /^p([a-zA-Z0-9/+]*==)$/,
                parse: (match) => ({ prescription: match[0] }) // TODO parse prescription
            },
            {
                type: 'MDLP',
                regex: /01(\d{14}).*21([!-&%-_/0-9A-Za-z]{13})\u001d/,
                parse: (match, data) => {
                    try {
                        return {
                            gtin: match[1],
                            packid: match[2],
                            sgtin: `${match[1]}${match[2]}`,
                            mark: this.computeMark(data)
                        };
                    } catch (error) {
                        console.error('Ошибка парсинга DataMatrix MDLP:', error);
                        return { error: 'Ошибка парсинга DataMatrix MDLP: ' + error.message };
                    }
                }
            }
        ];
    }

    parseOMC(data) {
        // Заглушка для парсинга OMC (данные в формате Uint8Array)
        // TODO логика обработки бинарных данных OMC
        return { omc: 'parsed OMC data' };
    }

    computeMark(data) {
        if (!(data instanceof Uint8Array) || data.length === 0) {
            console.warn('Некорректные данные для computeMark');
            return '';
        }
        try {
            // Convert Uint8Array to hex string
            let hex = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
            hex = hex.replace(/0d0a$/, '').replace(/0d$/, '');
            // Convert hex string back to Uint8Array
            const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
            const binaryString = String.fromCharCode.apply(null, bytes);
            return btoa(binaryString);
        } catch (error) {
            console.error('Ошибка в computeMark:', error);
            return '';
        }
    }

    parse(data, str) {
        console.log('Parsing data:', data, str);
        if (!(data instanceof Uint8Array)) {
            console.warn('Data is not a Uint8Array, skipping parsing');
            return { error: 'Некорректный формат данных' };
        }
        if (data.length > 0 && data[0] === 2) {
            return { type: 'OMC', parsed: this.parseOMC(data) };
        } else {
            for (const rule of this.parsingRules) {
                const match = str.match(rule.regex);
                if (match) {
                    try {
                        const parsed = rule.parse(match, data);
                        if (parsed.error) {
                            return { type: rule.type, error: parsed.error };
                        }
                        return { type: rule.type, parsed };
                    } catch (error) {
                        console.error(`Ошибка парсинга для типа ${rule.type}:`, error);
                        return { type: rule.type, error: 'Ошибка парсинга' };
                    }
                }
            }
            return { error: 'Неизвестный формат данных' };
        }
    }
}

if (typeof exports !== 'undefined') {
    exports.BarcodeDataParser = BarcodeDataParser;
}

// Для ES6 модулей
export { BarcodeDataParser };