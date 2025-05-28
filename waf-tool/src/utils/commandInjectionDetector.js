/**
 * Command Injection saldırılarını tespit eden fonksiyon
 * @param input Kullanıcıdan gelen veri
 * @returns boolean
 */
export function detectCommandInjection(input) {
    if (!input)
        return false;
    var commandPatterns = [
        // Temel komut enjeksiyonu desenleri
        /[;&|`\$]/,
        /\b(cat|chmod|curl|wget|nc|netcat|bash|sh|zsh|ksh|csh|tcsh|dash)\b/i,
        /\b(rm|cp|mv|mkdir|rmdir|touch|chown|chgrp|chmod)\b/i,
        /\b(grep|find|ls|dir|pwd|cd|echo|printf|exec|eval|system)\b/i,
        /\b(python|perl|ruby|php|node|java|gcc|g\+\+|javac)\b/i,
        /\b(ftp|ssh|telnet|rsh|rlogin|scp|sftp)\b/i,
        /\b(ifconfig|ipconfig|netstat|route|arp|ping|traceroute|nslookup|dig)\b/i,
        /\b(ps|top|kill|killall|pkill|pgrep)\b/i,
        /\b(useradd|userdel|usermod|groupadd|groupdel|groupmod)\b/i,
        /\b(service|systemctl|init|rc|rc.local)\b/i,
        // Tehlikeli karakterler ve operatörler
        /[<>]/,
        /[()]/,
        /[{}]/,
        /[\[\]]/,
        /[\\]/,
        /['"]/,
        /\b(AND|OR|NOT)\b/i,
        /\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE)\b/i,
        /\b(alert|confirm|prompt)\b/i,
        /\b(document|window|location|history|navigator)\b/i // JavaScript nesneleri
    ];
    return commandPatterns.some(function (pattern) { return pattern.test(input); });
}
