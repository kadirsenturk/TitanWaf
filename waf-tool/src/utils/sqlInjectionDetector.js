/**
 * Gelişmiş SQL Injection tespit fonksiyonu
 * @param input Kullanıcıdan gelen veri
 * @returns boolean
 */
export function detectSQLInjection(input) {
    if (!input)
        return false;
    var sqlPatterns = [
        /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
        /(\b(OR|AND)\b.+\=)/i,
        /(\bSELECT\b|\bUNION\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i
    ];
    return sqlPatterns.some(function (pattern) { return pattern.test(input); });
}
console.log('detectSQLInjection test:', detectSQLInjection("admin' --"));
