import { detectSQLInjection } from './sqlInjectionDetector';

// Test inputs for SQL injection detection
const testInputs = [
    "SELECT * FROM users WHERE id = 1",
    "admin' --",
    "normal input",
    "1 OR 1=1",
    "DROP TABLE students;",
    "hello world"
];

testInputs.forEach(input => {
    const result = detectSQLInjection(input);
    console.log(`Input: "${input}" | SQL Injection: ${result}`);
});