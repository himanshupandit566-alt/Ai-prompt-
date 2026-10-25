import 'package:flutter/material.dart';
import '../services/speech_service.dart';
import '../theme/app_theme.dart';

class VoiceInputDialog extends StatefulWidget {
  const VoiceInputDialog({super.key});

  @override
  State<VoiceInputDialog> createState() => _VoiceInputDialogState();
}

class _VoiceInputDialogState extends State<VoiceInputDialog>
    with SingleTickerProviderStateMixin {
  final SpeechService _speechService = SpeechService.instance;
  String _recognizedText = '';
  bool _isListening = false;
  bool _speechAvailable = true;
  String _statusMessage = 'Initializing microphone...';
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat(reverse: true);

    _startListeningProcess();
  }

  Future<void> _startListeningProcess() async {
    final available = await _speechService.initSpeech();
    if (!mounted) return;

    if (!available) {
      setState(() {
        _speechAvailable = false;
        _statusMessage =
            'Microphone access or Speech Recognition service is unavailable.\n\nPlease check microphone permissions in Android Settings or type your note manually.';
      });
      return;
    }

    setState(() {
      _isListening = true;
      _statusMessage = 'Listening... Speak clearly into your microphone.';
    });

    await _speechService.startListening(
      onResult: (text) {
        if (mounted) {
          setState(() {
            _recognizedText = text;
          });
        }
      },
      onComplete: () {
        if (mounted) {
          setState(() {
            _isListening = false;
            _statusMessage = _recognizedText.isNotEmpty
                ? 'Speech captured!'
                : 'No speech detected.';
          });
        }
      },
    );
  }

  Future<void> _stopListening() async {
    await _speechService.stopListening();
    if (mounted) {
      setState(() {
        _isListening = false;
        _statusMessage = 'Finished listening.';
      });
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    _speechService.stopListening();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      title: Row(
        children: [
          Icon(
            Icons.mic_rounded,
            color: _isListening ? AppTheme.primaryColor : Colors.grey,
          ),
          const SizedBox(width: 10),
          const Text('Voice Input'),
        ],
      ),
      content: SizedBox(
        width: double.maxFinite,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 10),
            // Mic pulse animation or error icon
            if (_speechAvailable)
              AnimatedBuilder(
                animation: _animController,
                builder: (context, child) {
                  return Container(
                    padding: EdgeInsets.all(16 + (_isListening ? _animController.value * 12 : 0)),
                    decoration: BoxDecoration(
                      color: _isListening
                          ? AppTheme.primaryColor.withOpacity(0.15)
                          : Colors.grey.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _isListening ? Icons.mic : Icons.mic_off,
                      size: 40,
                      color: _isListening ? AppTheme.primaryColor : Colors.grey,
                    ),
                  );
                },
              )
            else
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: theme.colorScheme.error.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.mic_off_rounded,
                  size: 40,
                  color: theme.colorScheme.error,
                ),
              ),

            const SizedBox(height: 20),
            Text(
              _statusMessage,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: _speechAvailable
                    ? (_isListening ? AppTheme.primaryColor : (isDark ? Colors.white70 : Colors.black54))
                    : theme.colorScheme.error,
              ),
            ),
            const SizedBox(height: 16),

            // Live recognized transcript box
            Container(
              constraints: const BoxConstraints(minHeight: 80, maxHeight: 150),
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
                border: BorderSide(
                  color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                ),
              ),
              child: SingleChildScrollView(
                child: Text(
                  _recognizedText.isNotEmpty
                      ? _recognizedText
                      : 'Transcribed speech will appear here...',
                  style: TextStyle(
                    fontSize: 14,
                    color: _recognizedText.isNotEmpty
                        ? (isDark ? Colors.white : Colors.black87)
                        : (isDark ? Colors.white38 : Colors.black38),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        if (_speechAvailable && _isListening)
          FilledButton.icon(
            onPressed: _stopListening,
            icon: const Icon(Icons.stop, size: 16),
            label: const Text('Done Speaking'),
          )
        else if (_recognizedText.isNotEmpty)
          FilledButton.icon(
            onPressed: () => Navigator.pop(context, _recognizedText),
            icon: const Icon(Icons.check, size: 16),
            label: const Text('Insert Text'),
          ),
      ],
    );
  }
}
