/**
 * List of supported devices in structured format
 * @type {Object} DEVICES - Object where key is vendor ID in hexadecimal format
 *
 * Each entry contains:
 * - vendorName: Manufacturer name
 * - devices: Object containing product IDs and device information
 *   - name: Device model name
 *
 * This list is used for auto-detection and connection of supported barcode scanners.
 * When a device is connected, its VID and PID are checked against this list.
 */
const DEVICES = {
    '0C2E': {
        vendorName: 'Honeywell',
        devices: {
            '0CAA': { name: 'Honeywell Voyager 1200g' },
            '0CD4': { name: 'Honeywell Xenon 1900' },
            '0206': { name: 'Honeywell MS9520' },
            '0CA1': { name: 'Honeywell MS7120' },
            '0720': { name: 'Honeywell Voyager 1400g' },
            '0CCF': { name: 'Honeywell Xenon 1902' },
            '1014': { name: 'Honeywell Granit X5400' }
        }
    },
    '23D0': {
        vendorName: 'Zebra Technologies',
        devices: {
            '0C82': { name: 'Zebra DS2200' },
            '0C83': { name: 'Zebra DS2200-HC' }
        }
    },
    '05E0': {
        vendorName: 'Zebra (бывш. Symbol)',
        devices: {
            '1701': { name: 'Zebra DS4308' },
            '0116': { name: 'Symbol LS2208' }
        }
    },
    '05F9': {
        vendorName: 'Datalogic',
        devices: {
            '4204': { name: 'QuickScan Lite QW2400' },
            '4205': { name: 'QuickScan I QD2430' }
        }
    },
    '1EAB': {
        vendorName: 'Newland (NLS)',
        devices: {
            '1D06': { name: 'Newland FM430' },
            '1D07': { name: 'Newland FM420' }
        }
    },
    '1F3A': {
        vendorName: 'Атол',
        devices: {
            '1009': { name: 'Атол SB2108 Plus' },
            '100A': { name: 'Атол SB2105' }
        }
    },
    '2DD6': {
        vendorName: 'IDZOR/Mercury',
        devices: {
            '0261': { name: 'IDZOR Mercury 5' },
            '21CA': { name: 'IDZOR Mercury 4' },
            '228A': { name: 'IDZOR Mercury 3' },
            '2A6A': { name: 'IDZOR Mercury 2' }
        }
    },
    'AC90': {
        vendorName: 'БитБук',
        devices: {
            '3003': { name: 'БитБук SC-60ABH' },
            '3004': { name: 'БитБук SC-60A' }
        }
    },
    '0647': {
        vendorName: 'VMC',
        devices: {
            '3339': { name: 'VMC BurstScanX L' },
            '3338': { name: 'VMC BurstScanX S' }
        }
    },
    '27DD': {
        vendorName: 'Mindeo',
        devices: {
            '0002': { name: 'Mindeo 6600-HD' },
            '0003': { name: 'Mindeo 6600' }
        }
    },
    '1A86': {
        vendorName: 'QinHeng Electronics (CH340)',
        devices: {
            '5723': { name: 'Atol USB-HID сканер (на базе CH340)' },
            '7523': { name: 'Atol USB-COM сканер (на базе CH340)' }
        }
    },
    '28E9': {
        vendorName: 'Netum',
        devices: {
            '018A': { name: 'Netum NS-806' },
            '018B': { name: 'Netum NS-808' }
        }
    },
    '0483': {
        vendorName: 'STMicroelectronics',
        devices: {
            '5740': { name: 'Сканеры на базе STM32' }
        }
    },
    '0403': {
        vendorName: 'FTDI',
        devices: {
            '6001': { name: 'Сканеры с FT232RL чипом' },
            '6015': { name: 'Сканеры с FT231X чипом' }
        }
    },
    '2AAF': {
        vendorName: 'ATOL',
        devices: {
            'C002': { name: 'АТОЛ SB3100 BT' },
            '1009': { name: 'АТОЛ SB3100' }
        }
    }
};
export { DEVICES };