import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/app_settings_model.dart';
import '../providers/settings_provider.dart';
import '../providers/notes_provider.dart';
import '../services/export_import_service.dart';
import '../services/cloud_sync_service.dart';
import '../theme/app_theme.dart';
import 'pin_lock_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final settingsProvider = Provider.of<SettingsProvider>(context);
    final notesProvider = Provider.of<NotesProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          // Section: Appearance
          _buildSectionHeader('Appearance', Icons.palette_outlined),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.brightness_medium),
                  title: const Text('Theme Mode'),
                  subtitle: Text(_themeModeName(settingsProvider.settings.themeMode)),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                  onTap: () => _showThemeDialog(context, settingsProvider),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Section: Notes & Sorting
          _buildSectionHeader('Notes Organization', Icons.sort_rounded),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.swap_vert_rounded),
                  title: const Text('Default Note Sorting'),
                  subtitle: Text(settingsProvider.settings.defaultSortOption.displayName),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                  onTap: () => _showSortDialog(context, settingsProvider, notesProvider),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Section: Privacy & Security
          _buildSectionHeader('Privacy & Security', Icons.security_rounded),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  secondary: const Icon(Icons.lock_outline),
                  title: const Text('App PIN Lock'),
                  subtitle: Text(
                    settingsProvider.settings.isPinLockEnabled
                        ? 'App is protected with a secure PIN'
                        : 'Protect your notes with a 4-6 digit PIN',
                  ),
                  value: settingsProvider.settings.isPinLockEnabled,
                  onChanged: (enabled) {
                    if (enabled) {
                      _setupPin(context);
                    } else {
                      _removePin(context, settingsProvider);
                    }
                  },
                ),
                const Divider(height: 1),
                SwitchListTile(
                  secondary: const Icon(Icons.visibility_off_outlined),
                  title: const Text('Hide Note Previews'),
                  subtitle: const Text('Mask note content from cards to prevent over-the-shoulder peeking'),
                  value: settingsProvider.settings.hideRecentPreviews,
                  onChanged: (val) {
                    settingsProvider.setHideRecentPreviews(val);
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Section: Backup & Restore
          _buildSectionHeader('Backup & Restore', Icons.backup_outlined),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.file_upload_outlined),
                  title: const Text('Export Notes (JSON)'),
                  subtitle: const Text('Save or share an offline JSON backup of all your notes'),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                  onTap: () async {
                    final notes = notesProvider.allNotes;
                    if (notes.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('No notes available to export.')),
                      );
                      return;
                    }
                    final success = await ExportImportService.exportAndShare(notes);
                    if (context.mounted && success) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Backup exported successfully!')),
                      );
                    }
                  },
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.file_download_outlined),
                  title: const Text('Import Backup File'),
                  subtitle: const Text('Restore notes safely from a SmartNotes AI JSON backup file'),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                  onTap: () async {
                    try {
                      final imported = await ExportImportService.pickAndImportBackup();
                      if (imported != null && imported.isNotEmpty) {
                        final count = await notesProvider.importBackupNotes(imported);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Successfully imported $count notes!')),
                          );
                        }
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Import failed: ${e.toString()}')),
                        );
                      }
                    }
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Section: Smart AI & Cloud Architecture
          _buildSectionHeader('AI & Cloud Integrations', Icons.auto_awesome),
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.smart_toy_outlined),
                  title: const Text('AI Summarizer Engine'),
                  subtitle: Text(
                    settingsProvider.settings.customAiApiKey != null &&
                            settingsProvider.settings.customAiApiKey!.isNotEmpty
                        ? 'Connected to Gemini Cloud LLM'
                        : 'Local Smart Extractor (100% Offline & Free)',
                  ),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                  onTap: () => _showAiConfigDialog(context, settingsProvider),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.cloud_off_outlined),
                  title: const Text('Cloud Synchronization'),
                  subtitle: Text(CloudSyncService.instance.syncStatusDescription),
                  trailing: const Icon(Icons.info_outline, size: 18),
                  onTap: () => _showCloudArchitectureDialog(context),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Section: Danger Zone
          _buildSectionHeader('Danger Zone', Icons.warning_amber_rounded, color: Colors.redAccent),
          Card(
            child: ListTile(
              leading: Icon(Icons.delete_forever, color: theme.colorScheme.error),
              title: Text('Delete All Notes & Data',
                  style: TextStyle(color: theme.colorScheme.error, fontWeight: FontWeight.bold)),
              subtitle: const Text('Irreversibly erase all notes from local SQLite database'),
              onTap: () => _showDeleteAllDataConfirm(context, notesProvider),
            ),
          ),
          const SizedBox(height: 24),

          // App Info & Version
          Center(
            child: Column(
              children: [
                const Icon(Icons.note_alt, size: 36, color: AppTheme.primaryColor),
                const SizedBox(height: 6),
                const Text(
                  'SmartNotes AI',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                Text(
                  'Version 1.0.0 (Production Release)\n100% Offline First • No Tracking • No Ads',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white54 : Colors.black45,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color ?? AppTheme.primaryColor),
          const SizedBox(width: 8),
          Text(
            title,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: color ?? AppTheme.primaryColor,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }

  String _themeModeName(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.system:
        return 'System Default';
      case ThemeMode.light:
        return 'Light Mode';
      case ThemeMode.dark:
        return 'Dark Mode';
    }
  }

  void _showThemeDialog(BuildContext context, SettingsProvider settings) {
    showDialog(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: const Text('Choose Theme'),
        children: [
          RadioListTile<ThemeMode>(
            title: const Text('System Default'),
            value: ThemeMode.system,
            groupValue: settings.settings.themeMode,
            onChanged: (val) {
              if (val != null) settings.setThemeMode(val);
              Navigator.pop(ctx);
            },
          ),
          RadioListTile<ThemeMode>(
            title: const Text('Light Mode'),
            value: ThemeMode.light,
            groupValue: settings.settings.themeMode,
            onChanged: (val) {
              if (val != null) settings.setThemeMode(val);
              Navigator.pop(ctx);
            },
          ),
          RadioListTile<ThemeMode>(
            title: const Text('Dark Mode'),
            value: ThemeMode.dark,
            groupValue: settings.settings.themeMode,
            onChanged: (val) {
              if (val != null) settings.setThemeMode(val);
              Navigator.pop(ctx);
            },
          ),
        ],
      ),
    );
  }

  void _showSortDialog(
      BuildContext context, SettingsProvider settings, NotesProvider notes) {
    showDialog(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: const Text('Default Sorting Order'),
        children: NoteSortOption.values.map((opt) {
          return RadioListTile<NoteSortOption>(
            title: Text(opt.displayName),
            value: opt,
            groupValue: settings.settings.defaultSortOption,
            onChanged: (val) {
              if (val != null) {
                settings.setDefaultSortOption(val);
                notes.setSortOption(val);
              }
              Navigator.pop(ctx);
            },
          );
        }).toList(),
      ),
    );
  }

  void _setupPin(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => const PinLockScreen(isCreatingNewPin: true),
      ),
    );
  }

  void _removePin(BuildContext context, SettingsProvider settings) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Enter Current PIN'),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          obscureText: true,
          decoration: const InputDecoration(hintText: '4-6 digit PIN'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              final ok = await settings.removePin(controller.text);
              if (ctx.mounted) Navigator.pop(ctx);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(ok
                        ? 'PIN lock removed.'
                        : 'Incorrect PIN. Could not remove lock.'),
                  ),
                );
              }
            },
            child: const Text('Remove Lock'),
          ),
        ],
      ),
    );
  }

  void _showAiConfigDialog(BuildContext context, SettingsProvider settings) {
    final controller = TextEditingController(
      text: settings.settings.customAiApiKey ?? '',
    );

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Smart AI Configuration'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'By default, SmartNotes AI uses an intelligent offline extraction algorithm that requires no internet connection and no API keys.',
                style: TextStyle(fontSize: 13, height: 1.3),
              ),
              const SizedBox(height: 12),
              const Text(
                'Optional Gemini API Key (for Cloud LLM):',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: controller,
                decoration: const InputDecoration(
                  hintText: 'AIzaSy...',
                  isDense: true,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'Note: Keys are stored exclusively on your device. Never share private keys.',
                style: TextStyle(fontSize: 11, color: Colors.grey),
              ),
            ],
          ),
        ),
        actions: [
          if (settings.settings.customAiApiKey != null)
            TextButton(
              onPressed: () {
                settings.setAiApiKey(null);
                Navigator.pop(ctx);
              },
              child: const Text('Reset to Offline'),
            ),
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              settings.setAiApiKey(controller.text);
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('AI configuration updated!')),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showCloudArchitectureDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cloud Synchronization Architecture'),
        content: const SingleChildScrollView(
          child: Text(
            'SmartNotes AI is built offline-first using SQLite.\n\n'
            'Future Firebase Integration Roadmap:\n'
            '• Firebase Authentication for Google Sign-In\n'
            '• Cloud Firestore for cross-device sync\n'
            '• Conflict Resolution: Last-Write-Wins (LWW) using ISO8601 timestamps and change-tracking queues\n\n'
            'Current Status: Fully functional offline. No cloud credentials required.',
            style: TextStyle(fontSize: 13, height: 1.4),
          ),
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Understood'),
          ),
        ],
      ),
    );
  }

  void _showDeleteAllDataConfirm(
      BuildContext context, NotesProvider notesProvider) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Erase All Notes & Data?'),
        content: const Text(
          'This will permanently erase all notes and tasks from your device SQLite storage. This action cannot be reversed.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              await notesProvider.clearAllNotes();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('All local notes have been erased.')),
                );
              }
            },
            child: const Text('Permanently Erase'),
          ),
        ],
      ),
    );
  }
}
