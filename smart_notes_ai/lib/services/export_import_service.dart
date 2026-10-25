import 'dart:convert';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../models/note_model.dart';

class ExportImportService {
  static const String appSignature = 'SmartNotesAI_Backup';
  static const int schemaVersion = 1;

  /// Creates a structured JSON export of notes
  static String createBackupJson(List<NoteModel> notes) {
    final Map<String, dynamic> backupData = {
      'app': appSignature,
      'schemaVersion': schemaVersion,
      'exportedAt': DateTime.now().toIso8601String(),
      'totalNotes': notes.length,
      'notes': notes.map((n) => n.toMap()).toList(),
    };

    return const JsonEncoder.withIndent('  ').convert(backupData);
  }

  /// Exports notes and presents Android share dialog
  static Future<bool> exportAndShare(List<NoteModel> notes) async {
    try {
      final jsonString = createBackupJson(notes);
      final tempDir = await getTemporaryDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final file = File('${tempDir.path}/smartnotes_backup_$timestamp.json');

      await file.writeAsString(jsonString, flush: true);

      final xFile = XFile(file.path, mimeType: 'application/json');
      final result = await Share.shareXFiles(
        [xFile],
        text: 'SmartNotes AI Backup - ${notes.length} notes exported',
        subject: 'SmartNotes AI Backup',
      );

      return result.status == ShareResultStatus.success ||
          result.status == ShareResultStatus.dismissed;
    } catch (e) {
      debugPrint('Export and share error: $e');
      return false;
    }
  }

  /// Validates and parses a JSON backup string into a list of NoteModel
  static List<NoteModel> parseBackupJson(String jsonString) {
    final dynamic decoded = json.decode(jsonString);

    if (decoded is! Map<String, dynamic>) {
      throw const FormatException('Invalid backup file format: Root is not an object.');
    }

    if (decoded['app'] != appSignature && decoded['notes'] == null) {
      throw const FormatException('Unrecognized backup structure or incompatible version.');
    }

    final dynamic notesList = decoded['notes'];
    if (notesList is! List) {
      throw const FormatException('Backup contains no valid notes array.');
    }

    final List<NoteModel> parsedNotes = [];
    for (final item in notesList) {
      try {
        if (item is Map<String, dynamic>) {
          parsedNotes.add(NoteModel.fromMap(item));
        }
      } catch (e) {
        debugPrint('Skipping malformed note item: $e');
      }
    }

    return parsedNotes;
  }

  /// Opens file picker and imports backup file
  static Future<List<NoteModel>?> pickAndImportBackup() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['json'],
      );

      if (result == null || result.files.isEmpty) {
        return null;
      }

      final path = result.files.single.path;
      if (path == null) return null;

      final file = File(path);
      final jsonContent = await file.readAsString();

      return parseBackupJson(jsonContent);
    } catch (e) {
      debugPrint('Import backup error: $e');
      rethrow;
    }
  }
}
