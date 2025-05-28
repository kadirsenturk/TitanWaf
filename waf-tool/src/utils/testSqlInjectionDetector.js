import { detectSQLInjection } from './sqlInjectionDetector';
// Test inputları
var testInputs = [
    "SELECT * FROM users WHERE id = 1",
    "admin' --",
    "normal input",
    "1 OR 1=1",
    "DROP TABLE students;",
    "hello world"
];
testInputs.forEach(function (input) {
    var result = detectSQLInjection(input);
    console.log("Input: \"".concat(input, "\" | SQL Injection: ").concat(result));
});
