/**
 * BarcodeDataParser class for parsing barcode data from Web Serial Barcode Scanner.
 *
 * This class provides functionality to parse various barcode formats and extract
 * meaningful information from raw scanner data. It uses a set of parsing rules
 * with regular expressions to identify and process different barcode types.
 */
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
                        console.error('MDLP DataMatrix parsing error:', error);
                        return { error: 'MDLP DataMatrix parsing error: ' + error.message };
                    }
                }
            }
        ];
    }

    /**
     * Placeholder for OMC data parsing (binary format)
     * @param {Uint8Array} data - Binary data to parse
     * @returns {Object} Parsed OMC data
     * @private
     */
    parseOMC(data) {
        // TODO: Implement OMC binary data processing logic
        return { omc: 'parsed OMC data' };
    }

    /**
     * Computes mark data from raw barcode data
     * @param {Uint8Array} data - Raw barcode data
     * @returns {string} Base64 encoded mark data
     * @private
     */
    computeMark(data) {
        if (!(data instanceof Uint8Array) || data.length === 0) {
            console.warn('Invalid data for computeMark');
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
            console.error('computeMark error:', error);
            return '';
        }
    }

    /**
     * Parses barcode data using defined parsing rules
     * @param {Uint8Array} data - Raw binary data from scanner
     * @param {string} str - String representation of the data
     * @returns {Object} Parsing result containing type, parsed data, or error
     */
    parse(data, str) {
        console.log('Parsing data:', data, str);
        if (!(data instanceof Uint8Array)) {
            console.warn('Data is not a Uint8Array, skipping parsing');
            return { error: 'Invalid data format' };
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
                        console.error(`Error parsing ${rule.type} type:`, error);
                        return { type: rule.type, error: 'Parsing error' };
                    }
                }
            }
            return { error: 'Unknown data format' };
        }
    }
}

export { BarcodeDataParser };