import 'package:flutter_test/flutter_test.dart';
import 'package:smart_notes_ai/models/note_model.dart';
import 'package:smart_notes_ai/services/export_import_service.dart';

void main() {
  group('ExportImportService Tests', () {
    test('creates valid JSON backup and parses it back accurately', () {
      final notes = [
        NoteModel(
          id: 'note-1',
          title: 'First Note',
          content: 'Details here',
          category: 'Personal',
        ),
        NoteModel(
          id: 'note-2',
          title: 'Second Note',
          content: 'Work project',
          category: 'Work',
          isPinned: true,
        ),
      ];

      final jsonBackup = ExportImportService.createBackupJson(notes);
      expect(jsonBackup.contains('SmartNotesAI_Backup'), true);

      final restoredNotes = ExportImportService.parseBackupJson(jsonBackup);
      expect(restoredNotes.length, 2);
      expect(restoredNotes[0].title, 'First Note');
      expect(restoredNotes[1].title, 'Second Note');
      expect(restoredNotes[1].isPinned, true);
    });

    test('throws FormatException on corrupted JSON', () {
      expect(
        () => ExportImportService.parseBackupJson('invalid json string'),
        throwsFormatException,
      );
    });
  });
}
