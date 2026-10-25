import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/settings_provider.dart';
import '../theme/app_theme.dart';

class PinLockScreen extends StatefulWidget {
  final bool isCreatingNewPin;
  final VoidCallback? onPinSuccess;

  const PinLockScreen({
    super.key,
    this.isCreatingNewPin = false,
    this.onPinSuccess,
  });

  @override
  State<PinLockScreen> createState() => _PinLockScreenState();
}

class _PinLockScreenState extends State<PinLockScreen> {
  String _enteredPin = '';
  String _confirmPin = '';
  bool _isConfirming = false;
  String _errorMessage = '';

  void _onDigitPressed(String digit) {
    if (_enteredPin.length < 6) {
      setState(() {
        _errorMessage = '';
        _enteredPin += digit;
      });

      if (_enteredPin.length >= 4) {
        // Can submit or auto-submit at 4 if not in setup
        if (!widget.isCreatingNewPin && _enteredPin.length == 4) {
          _verifyAndUnlock();
        }
      }
    }
  }

  void _onDeletePressed() {
    if (_enteredPin.isNotEmpty) {
      setState(() {
        _enteredPin = _enteredPin.substring(0, _enteredPin.length - 1);
        _errorMessage = '';
      });
    }
  }

  void _verifyAndUnlock() {
    final settings = Provider.of<SettingsProvider>(context, listen: false);
    final success = settings.unlockWithPin(_enteredPin);

    if (success) {
      if (widget.onPinSuccess != null) {
        widget.onPinSuccess!();
      }
    } else {
      setState(() {
        _errorMessage = 'Incorrect PIN. Please try again.';
        _enteredPin = '';
      });
    }
  }

  void _handleSetupPin() async {
    if (_enteredPin.length < 4) {
      setState(() => _errorMessage = 'PIN must be at least 4 digits.');
      return;
    }

    if (!_isConfirming) {
      setState(() {
        _confirmPin = _enteredPin;
        _enteredPin = '';
        _isConfirming = true;
      });
    } else {
      if (_enteredPin == _confirmPin) {
        final settings = Provider.of<SettingsProvider>(context, listen: false);
        final success = await settings.setPin(_enteredPin);
        if (success && mounted) {
          if (widget.onPinSuccess != null) {
            widget.onPinSuccess!();
          } else {
            Navigator.pop(context, true);
          }
        }
      } else {
        setState(() {
          _errorMessage = 'PINs do not match. Try again.';
          _enteredPin = '';
          _confirmPin = '';
          _isConfirming = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return PopScope(
      canPop: !widget.isCreatingNewPin,
      child: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.lock_outline_rounded,
                    size: 48,
                    color: AppTheme.primaryColor,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  widget.isCreatingNewPin
                      ? (_isConfirming ? 'Confirm your new PIN' : 'Create a 4-6 digit PIN')
                      : 'SmartNotes AI Locked',
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  widget.isCreatingNewPin
                      ? 'Your PIN is securely hashed and stored locally.'
                      : 'Enter your security PIN to access your notes.',
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark ? Colors.white60 : Colors.black54,
                  ),
                ),
                const SizedBox(height: 32),

                // PIN Dots
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(4, (index) {
                    final isFilled = index < _enteredPin.length;
                    return Container(
                      margin: const EdgeInsets.symmetric(horizontal: 10),
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isFilled
                            ? AppTheme.primaryColor
                            : (isDark ? Colors.white24 : Colors.black12),
                        border: Border.all(
                          color: isFilled
                              ? AppTheme.primaryColor
                              : (isDark ? Colors.white38 : Colors.black26),
                          width: 2,
                        ),
                      ),
                    );
                  }),
                ),

                if (_errorMessage.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Text(
                    _errorMessage,
                    style: TextStyle(
                      color: theme.colorScheme.error,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ],

                const Spacer(),

                // Number Keypad
                for (var row in [
                  ['1', '2', '3'],
                  ['4', '5', '6'],
                  ['7', '8', '9'],
                ]) ...[
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: row.map((d) => _buildKeypadButton(d)).toList(),
                  ),
                  const SizedBox(height: 12),
                ],
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    if (widget.isCreatingNewPin && _enteredPin.length >= 4)
                      IconButton(
                        onPressed: _handleSetupPin,
                        icon: const Icon(Icons.check, color: AppTheme.primaryColor),
                        iconSize: 28,
                      )
                    else
                      const SizedBox(width: 72),
                    _buildKeypadButton('0'),
                    IconButton(
                      onPressed: _onDeletePressed,
                      icon: const Icon(Icons.backspace_outlined),
                      iconSize: 26,
                      color: isDark ? Colors.white70 : Colors.black54,
                    ),
                  ],
                ),
                const Spacer(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildKeypadButton(String digit) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return SizedBox(
      width: 72,
      height: 72,
      child: OutlinedButton(
        onPressed: () => _onDigitPressed(digit),
        style: OutlinedButton.styleFrom(
          shape: const CircleBorder(),
          side: BorderSide(
            color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
          ),
          backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
        ),
        child: Text(
          digit,
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
