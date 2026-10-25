import 'package:flutter_test/flutter_test.dart';
import 'package:smart_notes_ai/database/security_service.dart';

void main() {
  group('SecurityService Tests', () {
    test('generates secure unique salts', () {
      final salt1 = SecurityService.generateSalt();
      final salt2 = SecurityService.generateSalt();

      expect(salt1.isNotEmpty, true);
      expect(salt2.isNotEmpty, true);
      expect(salt1 != salt2, true);
    });

    test('hashes PIN deterministically with salt', () {
      final salt = SecurityService.generateSalt();
      const pin = '1234';

      final hash1 = SecurityService.hashPin(pin, salt);
      final hash2 = SecurityService.hashPin(pin, salt);

      expect(hash1, hash2);
      expect(hash1 != pin, true);
    });

    test('verifies correct PIN and rejects incorrect PIN', () {
      final salt = SecurityService.generateSalt();
      const pin = '5678';
      final storedHash = SecurityService.hashPin(pin, salt);

      final isMatch = SecurityService.verifyPin(
        enteredPin: '5678',
        storedHash: storedHash,
        salt: salt,
      );
      expect(isMatch, true);

      final isWrongMatch = SecurityService.verifyPin(
        enteredPin: '0000',
        storedHash: storedHash,
        salt: salt,
      );
      expect(isWrongMatch, false);
    });

    test('validates PIN formats strictly (4 to 6 numeric digits)', () {
      expect(SecurityService.isValidPinFormat('1234'), true);
      expect(SecurityService.isValidPinFormat('123456'), true);
      expect(SecurityService.isValidPinFormat('123'), false); // Too short
      expect(SecurityService.isValidPinFormat('1234567'), false); // Too long
      expect(SecurityService.isValidPinFormat('12a4'), false); // Contains letter
      expect(SecurityService.isValidPinFormat(''), false); // Empty
    });
  });
}
