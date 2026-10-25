import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/app_settings_model.dart';
import '../database/security_service.dart';

class SettingsProvider extends ChangeNotifier {
  static const String _keyThemeMode = 'setting_theme_mode';
  static const String _keySortOption = 'setting_sort_option';
  static const String _keyPinLock = 'setting_pin_lock';
  static const String _keyPinHash = 'setting_pin_hash';
  static const String _keyPinSalt = 'setting_pin_salt';
  static const String _keyHidePreviews = 'setting_hide_previews';
  static const String _keyAiApiKey = 'setting_ai_api_key';

  AppSettingsModel _settings = const AppSettingsModel();
  bool _isAppUnlocked = false;

  AppSettingsModel get settings => _settings;
  bool get isAppUnlocked => _isAppUnlocked;
  bool get requiresUnlock => _settings.isPinLockEnabled && !_isAppUnlocked;

  Future<void> loadSettings() async {
    final prefs = await SharedPreferences.getInstance();

    final themeStr = prefs.getString(_keyThemeMode);
    ThemeMode themeMode = ThemeMode.system;
    if (themeStr == 'light') themeMode = ThemeMode.light;
    if (themeStr == 'dark') themeMode = ThemeMode.dark;

    final sortStr = prefs.getString(_keySortOption);
    final sortOption = NoteSortOptionExtension.fromString(sortStr);

    final isPinLock = prefs.getBool(_keyPinLock) ?? false;
    final pinHash = prefs.getString(_keyPinHash);
    final pinSalt = prefs.getString(_keyPinSalt);
    final hidePreviews = prefs.getBool(_keyHidePreviews) ?? false;
    final aiApiKey = prefs.getString(_keyAiApiKey);

    _settings = AppSettingsModel(
      themeMode: themeMode,
      defaultSortOption: sortOption,
      isPinLockEnabled: isPinLock && pinHash != null,
      pinHash: pinHash,
      pinSalt: pinSalt,
      hideRecentPreviews: hidePreviews,
      customAiApiKey: aiApiKey,
    );

    // If pin lock is not enabled, mark as unlocked
    if (!_settings.isPinLockEnabled) {
      _isAppUnlocked = true;
    }

    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    _settings = _settings.copyWith(themeMode: mode);
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    String val = 'system';
    if (mode == ThemeMode.light) val = 'light';
    if (mode == ThemeMode.dark) val = 'dark';
    await prefs.setString(_keyThemeMode, val);
  }

  Future<void> setDefaultSortOption(NoteSortOption option) async {
    _settings = _settings.copyWith(defaultSortOption: option);
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keySortOption, option.name);
  }

  Future<void> setHideRecentPreviews(bool hide) async {
    _settings = _settings.copyWith(hideRecentPreviews: hide);
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyHidePreviews, hide);
  }

  Future<void> setAiApiKey(String? key) async {
    final cleanKey = key?.trim();
    _settings = _settings.copyWith(
      customAiApiKey: cleanKey,
      clearAiApiKey: cleanKey == null || cleanKey.isEmpty,
    );
    notifyListeners();

    final prefs = await SharedPreferences.getInstance();
    if (cleanKey != null && cleanKey.isNotEmpty) {
      await prefs.setString(_keyAiApiKey, cleanKey);
    } else {
      await prefs.remove(_keyAiApiKey);
    }
  }

  /// Sets up a new PIN securely with a random cryptographic salt and SHA-256 hash
  Future<bool> setPin(String pin) async {
    if (!SecurityService.isValidPinFormat(pin)) return false;

    final salt = SecurityService.generateSalt();
    final hash = SecurityService.hashPin(pin, salt);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyPinHash, hash);
    await prefs.setString(_keyPinSalt, salt);
    await prefs.setBool(_keyPinLock, true);

    _settings = _settings.copyWith(
      isPinLockEnabled: true,
      pinHash: hash,
      pinSalt: salt,
    );
    _isAppUnlocked = true;
    notifyListeners();
    return true;
  }

  /// Verifies entered PIN against stored hash
  bool unlockWithPin(String enteredPin) {
    if (!_settings.isPinLockEnabled ||
        _settings.pinHash == null ||
        _settings.pinSalt == null) {
      _isAppUnlocked = true;
      notifyListeners();
      return true;
    }

    final isValid = SecurityService.verifyPin(
      enteredPin: enteredPin,
      storedHash: _settings.pinHash!,
      salt: _settings.pinSalt!,
    );

    if (isValid) {
      _isAppUnlocked = true;
      notifyListeners();
    }
    return isValid;
  }

  /// Disables PIN lock after successful verification
  Future<bool> removePin(String currentPin) async {
    if (!unlockWithPin(currentPin)) return false;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyPinHash);
    await prefs.remove(_keyPinSalt);
    await prefs.setBool(_keyPinLock, false);

    _settings = _settings.copyWith(
      isPinLockEnabled: false,
      clearPin: true,
    );
    _isAppUnlocked = true;
    notifyListeners();
    return true;
  }

  /// Locks app when sent to background or requested
  void lockApp() {
    if (_settings.isPinLockEnabled) {
      _isAppUnlocked = false;
      notifyListeners();
    }
  }
}
