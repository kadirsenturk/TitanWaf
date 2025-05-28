// @ts-ignore
import { decode } from 'he'

/**
 * Gelişmiş SQL Injection tespit fonksiyonu
 * @param input Kullanıcıdan gelen veri
 * @returns boolean
 */
export function detectSQLInjection(input: string): boolean {
    if (!input) return false;
    const sqlPatterns = [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
        /(\b(OR|AND)\b.+\=)/i,
        /(\bSELECT\b|\bUNION\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i
    ];
    return sqlPatterns.some((pattern) => pattern.test(input));
}

console.log('detectSQLInjection test:', detectSQLInjection("admin' --"));