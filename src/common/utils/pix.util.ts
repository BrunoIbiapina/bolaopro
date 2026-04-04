/**
 * Gerador de payload PIX (Pix Copia e Cola) no formato EMV QR Code
 * Seguindo a especificação do Banco Central do Brasil
 */

function emv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) crc = (crc << 1) ^ 0x1021;
      else crc <<= 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Remove acentos e caracteres não-ASCII para cumprir a spec EMV/PIX */
function sanitizeAscii(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^\x20-\x7E]/g, '')    // remove non-ASCII
    .trim();
}

export function generatePixPayload(params: {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount?: number;
  txid?: string;
  description?: string;
}): string {
  const { pixKey, amount, txid } = params;
  const merchantName = sanitizeAscii(params.merchantName);
  const merchantCity = sanitizeAscii(params.merchantCity);
  const description = params.description ? sanitizeAscii(params.description) : undefined;

  // Merchant Account Information (campo 26)
  const gui = emv('00', 'br.gov.bcb.pix');
  const key = emv('01', pixKey);
  const info = description ? emv('02', description.substring(0, 72)) : '';
  const merchantAccount = emv('26', gui + key + info);

  // Additional Data Field (campo 62) — txid obrigatório
  const safeTxid = (txid ?? '***').replace(/[^a-zA-Z0-9]/g, '').substring(0, 25) || '***';
  const additionalData = emv('62', emv('05', safeTxid));

  // Monta o payload sem o CRC
  let payload =
    emv('00', '01') +                    // Payload Format Indicator
    emv('01', '12') +                    // Point of Initiation (12 = dinâmico / único uso)
    merchantAccount +
    emv('52', '0000') +                  // MCC — genérico
    emv('53', '986') +                   // Moeda BRL
    (amount ? emv('54', amount.toFixed(2)) : '') +
    emv('58', 'BR') +
    emv('59', merchantName.substring(0, 25)) +
    emv('60', merchantCity.substring(0, 15)) +
    additionalData +
    '6304';                              // CRC placeholder

  payload += crc16(payload);
  return payload;
}
