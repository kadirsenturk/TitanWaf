import { detectSQLInjection } from './sqlInjectionDetector';

describe('detectSQLInjection', () => {
    it('should detect basic SQL injection patterns', () => {
        expect(detectSQLInjection("SELECT * FROM users")).toBe(true);
        expect(detectSQLInjection("admin' --")).toBe(true);
        expect(detectSQLInjection("1 OR 1=1")).toBe(true);
        expect(detectSQLInjection("DROP TABLE students;")).toBe(true);
    });

    it('should not flag normal input', () => {
        expect(detectSQLInjection("hello world")).toBe(false);
        expect(detectSQLInjection("safe input")).toBe(false);
    });

    it('should handle encoded input', () => {
        expect(detectSQLInjection("SELECT%20*%20FROM%20users")).toBe(true);
        expect(detectSQLInjection("admin%27%20--")).toBe(true);
    });
});