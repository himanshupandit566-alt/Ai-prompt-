import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';

class SecurityService {
  static const int _saltLength = 16;

  /// Generates a cryptographically secure random salt string
  static String generateSalt() {
    final random = Random.secure();
    final values = List<int>.generate(_saltLength, (i) => random.nextInt(256));
    return base64Url.encode(values);
  }

  /// Hashes a PIN using SHA-256 with a salt
  static String hashPin(String pin, String salt) {
    final saltedBytes = utf8.encode(pin + salt);
    final digest = sha256.convert(saltedBytes);
    return digest.toString();
  }

  /// Verifies if the entered PIN matches the stored hash
  static bool verifyPin({
    required String enteredPin,
    required String storedHash,
    required String salt,
  }) {
    final computedHash = hashPin(enteredPin, salt);
    return computedHash == storedHash;
  }

  /// Validates PIN format (must be 4 to 6 numeric digits)
  static bool isValidPinFormat(String pin) {
    final regex = RegExp(r'^\d{4,6}$');
    return regex.hasMatch(pin);
  }
}
