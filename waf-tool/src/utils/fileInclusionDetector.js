/**
 * File Inclusion saldırılarını tespit eden fonksiyon
 * @param input Kullanıcıdan gelen veri
 * @returns boolean
 */
export function detectFileInclusion(input) {
    if (!input)
        return false;
    var fileInclusionPatterns = [
        // Dosya yolu manipülasyonu
        /\.\.\//,
        /\.\.\\/,
        /\/etc\/passwd/i,
        /\/etc\/shadow/i,
        /\/etc\/hosts/i,
        /\/proc\/self\/environ/i,
        /\/proc\/self\/cmdline/i,
        /\/proc\/self\/status/i,
        /\/proc\/self\/fd\/\d+/i,
        /\/var\/log\/apache2\/access\.log/i,
        /\/var\/log\/apache2\/error\.log/i,
        /\/var\/log\/nginx\/access\.log/i,
        /\/var\/log\/nginx\/error\.log/i,
        /\/var\/log\/httpd\/access\.log/i,
        /\/var\/log\/httpd\/error\.log/i,
        /\/var\/log\/auth\.log/i,
        /\/var\/log\/syslog/i,
        /\/var\/log\/messages/i,
        /\/var\/log\/secure/i,
        /\/var\/log\/mail\.log/i,
        /\/var\/log\/mail\.err/i,
        /\/var\/log\/mail\.info/i,
        /\/var\/log\/mail\.warn/i,
        /\/var\/log\/mail\.crit/i,
        /\/var\/log\/mail\.debug/i,
        /\/var\/log\/mail\.notice/i,
        /\/var\/log\/mail\.alert/i,
        /\/var\/log\/mail\.emerg/i,
        /\/var\/log\/mail\.error/i,
        /\/var\/log\/mail\.warning/i,
        /\/var\/log\/mail\.critical/i,
        /\/var\/log\/mail\.debug/i,
        /\/var\/log\/mail\.notice/i,
        /\/var\/log\/mail\.alert/i,
        /\/var\/log\/mail\.emerg/i,
        /\/var\/log\/mail\.error/i,
        /\/var\/log\/mail\.warning/i,
        /\/var\/log\/mail\.critical/i,
        // PHP dosya dahil etme
        /php:\/\/filter/i,
        /php:\/\/input/i,
        /php:\/\/stdin/i,
        /php:\/\/memory/i,
        /php:\/\/temp/i,
        /php:\/\/fd/i,
        /data:\/\/text\/plain/i,
        /data:\/\/text\/html/i,
        /data:\/\/application\/x-httpd-php/i,
        /data:\/\/application\/x-httpd-php-source/i,
        /data:\/\/application\/x-httpd-php-script/i,
        /data:\/\/application\/x-httpd-php-script-source/i,
        /data:\/\/application\/x-httpd-php-script-source-source/i,
        // Tehlikeli dosya uzantıları
        /\.(php|phtml|php3|php4|php5|php7|phar|inc|phps|pht|phptml|phar|phar\.gz|phar\.bz2|phar\.zip|phar\.tar|phar\.tgz|phar\.tar\.gz|phar\.tar\.bz2|phar\.tar\.zip|phar\.tar\.tgz)$/i,
        // Tehlikeli protokoller
        /^(file|ftp|sftp|smb|webdav|gopher|dict|ldap|jar|netdoc|mailto|telnet|tftp|nntp|news|ldaps|ldapi|ldap:\/\/|ldaps:\/\/|ldapi:\/\/|jar:\/\/|netdoc:\/\/|gopher:\/\/|dict:\/\/|file:\/\/|ftp:\/\/|sftp:\/\/|smb:\/\/|webdav:\/\/|mailto:\/\/|telnet:\/\/|tftp:\/\/|nntp:\/\/|news:\/\/)/i
    ];
    return fileInclusionPatterns.some(function (pattern) { return pattern.test(input); });
}
