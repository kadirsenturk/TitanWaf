/**
 * XSS (Cross-Site Scripting) saldırılarını tespit eden fonksiyon
 * @param input Kullanıcıdan gelen veri
 * @returns boolean
 */
export function detectXSS(input: string): boolean {
    if (!input) return false;

    const xssPatterns = [
        /<script\b[^>]*>[\s\S]*?<\/script>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe\b[^>]*>[\s\S]*?<\/iframe>/i,
        /<img\b[^>]*onerror\s*=/i,
        /<img\b[^>]*onload\s*=/i,
        /<svg\b[^>]*>[\s\S]*?<\/svg>/i,
        /<style\b[^>]*>[\s\S]*?<\/style>/i,
        /<link\b[^>]*>/i,
        /<meta\b[^>]*>/i,
        /<object\b[^>]*>[\s\S]*?<\/object>/i,
        /<embed\b[^>]*>/i,
        /<applet\b[^>]*>[\s\S]*?<\/applet>/i,
        /<base\b[^>]*>/i,
        /<form\b[^>]*>[\s\S]*?<\/form>/i,
        /<input\b[^>]*>/i,
        /<textarea\b[^>]*>[\s\S]*?<\/textarea>/i,
        /<select\b[^>]*>[\s\S]*?<\/select>/i,
        /<button\b[^>]*>[\s\S]*?<\/button>/i,
        /<a\b[^>]*>[\s\S]*?<\/a>/i
    ];

    return xssPatterns.some(pattern => pattern.test(input));
}