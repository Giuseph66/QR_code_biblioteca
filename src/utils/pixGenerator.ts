// Gera o payload PIX EMV conforme padrão brasileiro
export interface PixData {
  pixKey: string;
  amount: number;
  merchantName: string;
  merchantCity: string;
  txid?: string;
  description?: string;
}

function crc16(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function formatValue(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

export function generatePixPayload(data: PixData): string {
  const { pixKey, amount, merchantName, merchantCity, txid, description } = data;
  
  // ID 00: Payload Format Indicator
  let payload = formatValue('00', '01');
  
  // ID 26: Merchant Account Information (apenas GUI e chave PIX)
  const merchantAccountInfo = 
    formatValue('00', 'BR.GOV.BCB.PIX') +
    formatValue('01', pixKey);
  payload += formatValue('26', merchantAccountInfo);
  
  // ID 52: Merchant Category Code
  payload += formatValue('52', '0000');
  
  // ID 53: Transaction Currency (986 = BRL)
  payload += formatValue('53', '986');
  
  // ID 54: Transaction Amount
  if (amount > 0) {
    payload += formatValue('54', amount.toFixed(2));
  }
  
  // ID 58: Country Code
  payload += formatValue('58', 'BR');
  
  // ID 59: Merchant Name
  payload += formatValue('59', merchantName.substring(0, 25));
  
  // ID 60: Merchant City (sempre em maiúsculo)
  payload += formatValue('60', merchantCity.toUpperCase().substring(0, 15));
  
  // ID 62: Additional Data Field Template
  if (txid || description) {
    let additionalData = '';
    if (txid) {
      additionalData += formatValue('05', txid.substring(0, 25));
    }
    if (description) {
      additionalData += formatValue('02', description.substring(0, 72));
    }
    payload += formatValue('62', additionalData);
  }
  
  // ID 63: CRC16
  payload += '6304';
  const checksum = crc16(payload);
  payload += checksum;
  
  return payload;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}
