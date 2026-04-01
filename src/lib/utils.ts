import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

// ============================================
// MÁSCARAS DE FORMATAÇÃO
// ============================================

/**
 * Remove todos os caracteres não numéricos
 */
export function onlyNumbers(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Máscara para CPF (000.000.000-00)
 */
export function maskCPF(value: string): string {
  const numbers = onlyNumbers(value);
  if (numbers.length === 0) return '';
  
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  } else if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  } else {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  }
}

/**
 * Máscara para CNPJ (00.000.000/0000-00)
 */
export function maskCNPJ(value: string): string {
  const numbers = onlyNumbers(value);
  if (numbers.length === 0) return '';
  
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 5) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  } else if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  } else if (numbers.length <= 12) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  } else {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  }
}

/**
 * Máscara automática para CNPJ ou CPF
 * Detecta automaticamente o tipo baseado no tamanho
 */
export function maskCNPJCPF(value: string): string {
  const numbers = onlyNumbers(value);
  
  if (numbers.length <= 11) {
    return maskCPF(value);
  } else {
    return maskCNPJ(value);
  }
}

/**
 * Máscara para telefone ((00) 00000-0000)
 */
export function maskPhone(value: string): string {
  const numbers = onlyNumbers(value);
  if (numbers.length === 0) return '';
  
  if (numbers.length <= 2) {
    return `(${numbers}`;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  } else {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }
}

/**
 * Valida CPF
 */
export function validateCPF(cpf: string): boolean {
  const numbers = onlyNumbers(cpf);
  if (numbers.length !== 11) return false;
  
  // Verifica dígitos repetidos
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validação do primeiro dígito
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(numbers[9])) return false;
  
  // Validação do segundo dígito
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(numbers[10])) return false;
  
  return true;
}

/**
 * Valida CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  const numbers = onlyNumbers(cnpj);
  if (numbers.length !== 14) return false;
  
  // Verifica dígitos repetidos
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validação do primeiro dígito
  let sum = 0;
  let multiplier = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * multiplier;
    multiplier = multiplier === 2 ? 9 : multiplier - 1;
  }
  let digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  if (digit !== parseInt(numbers[12])) return false;
  
  // Validação do segundo dígito
  sum = 0;
  multiplier = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * multiplier;
    multiplier = multiplier === 2 ? 9 : multiplier - 1;
  }
  digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  if (digit !== parseInt(numbers[13])) return false;
  
  return true;
}

/**
 * Valida CNPJ ou CPF
 */
export function validateCNPJCPF(value: string): boolean {
  const numbers = onlyNumbers(value);
  if (numbers.length === 11) {
    return validateCPF(value);
  } else if (numbers.length === 14) {
    return validateCNPJ(value);
  }
  return false;
}
