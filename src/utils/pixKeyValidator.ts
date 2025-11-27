import { z } from 'zod';

// Validation schemas for different PIX key types
const phoneRegex = /^\+55\d{10,11}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cpfRegex = /^\d{11}$/;
const cnpjRegex = /^\d{14}$/;
const randomKeyRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export const pixKeySchema = z.string()
  .trim()
  .min(1, { message: "Chave PIX é obrigatória" })
  .max(77, { message: "Chave PIX inválida" })
  .refine((value) => {
    // Check if it's a valid phone, email, CPF, CNPJ, or random key
    return (
      phoneRegex.test(value) ||
      emailRegex.test(value) ||
      cpfRegex.test(value) ||
      cnpjRegex.test(value) ||
      randomKeyRegex.test(value)
    );
  }, {
    message: "Formato de chave PIX inválido. Use telefone (+55...), email, CPF, CNPJ ou chave aleatória"
  });

/**
 * Check if the value is ambiguous (could be CPF or phone)
 * Returns true if the value has exactly 11 digits (no +55 prefix)
 */
export const isAmbiguousCpfOrPhone = (value: string): boolean => {
  const cleaned = value.trim().replace(/\D/g, '');
  // 11 digits without +55 prefix could be either CPF or phone
  return cleaned.length === 11 && !value.startsWith('+');
};

/**
 * Format PIX key as phone (adds +55)
 */
export const formatAsPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  return `+55${digits}`;
};

/**
 * Format PIX key as CPF (keeps only digits)
 */
export const formatAsCpf = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Format PIX key input - automatically adds +55 for phone numbers
 * Only call this on blur, not on every keystroke
 */
export const formatPixKey = (value: string): string => {
  let cleaned = value.trim();
  
  // If empty, return empty
  if (!cleaned) return '';
  
  // Check if it looks like a phone number (only digits, possibly starting with +)
  const digitsOnly = cleaned.replace(/\D/g, '');
  
  // If it's 10 digits (phone without area code digit), add +55
  if (/^\d+$/.test(cleaned) && digitsOnly.length === 10) {
    return `+55${digitsOnly}`;
  }
  
  // If it starts with + followed by digits, it's already formatted as phone
  if (/^\+\d+$/.test(cleaned)) {
    return cleaned;
  }
  
  // For email, return lowercase
  if (cleaned.includes('@')) {
    return cleaned.toLowerCase();
  }
  
  return cleaned;
};

/**
 * Get PIX key type for display purposes
 */
export const getPixKeyType = (key: string): string => {
  if (phoneRegex.test(key)) return 'Telefone';
  if (emailRegex.test(key)) return 'E-mail';
  if (cpfRegex.test(key)) return 'CPF';
  if (cnpjRegex.test(key)) return 'CNPJ';
  if (randomKeyRegex.test(key)) return 'Chave Aleatória';
  return 'Desconhecido';
};

/**
 * Validate PIX key
 */
export const validatePixKey = (key: string): { valid: boolean; error?: string } => {
  try {
    pixKeySchema.parse(key);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0]?.message };
    }
    return { valid: false, error: 'Chave PIX inválida' };
  }
};
