import 'package:flutter_test/flutter_test.dart';
import 'package:smart_notes_ai/models/note_model.dart';
import 'package:smart_notes_ai/models/todo_item_model.dart';

void main() {
  group('NoteModel Tests', () {
    test('creates NoteModel with defaults correctly', () {
      final note = NoteModel(
        title: 'Meeting Notes',
        content: 'Review Flutter architecture and roadmap.',
      );

      expect(note.title, 'Meeting Notes');
      expect(note.content, 'Review Flutter architecture and roadmap.');
      expect(note.category, 'Personal');
      expect(note.isPinned, false);
      expect(note.isFavorite, false);
      expect(note.todoItems.isEmpty, true);
      expect(note.id.isNotEmpty, true);
    });

    test('serializes and deserializes with todo items accurately', () {
      final todo1 = TodoItemModel(id: 't1', text: 'Task 1', isCompleted: false);
      final todo2 = TodoItemModel(id: 't2', text: 'Task 2', isCompleted: true);

      final original = NoteModel(
        id: 'test-id-123',
        title: 'Project Sprint',
        content: 'Sprint review agenda',
        category: 'Work',
        isPinned: true,
        isFavorite: true,
        colorValue: 2,
        reminderDateTime: DateTime(2026, 12, 1, 10, 0),
        todoItems: [todo1, todo2],
      );

      final map = original.toMap();
      final restored = NoteModel.fromMap(map);

      expect(restored.id, original.id);
      expect(restored.title, original.title);
      expect(restored.content, original.content);
      expect(restored.category, original.category);
      expect(restored.isPinned, true);
      expect(restored.isFavorite, true);
      expect(restored.colorValue, 2);
      expect(restored.reminderDateTime?.year, 2026);
      expect(restored.todoItems.length, 2);
      expect(restored.todoItems.first.text, 'Task 1');
      expect(restored.todoItems.last.isCompleted, true);
    });

    test('copyWith updates specific properties without modifying originals', () {
      final original = NoteModel(
        title: 'Original Title',
        content: 'Original Content',
      );

      final updated = original.copyWith(
        title: 'Updated Title',
        isPinned: true,
      );

      expect(updated.title, 'Updated Title');
      expect(updated.content, 'Original Content');
      expect(updated.isPinned, true);
      expect(original.title, 'Original Title');
      expect(original.isPinned, false);
    });
  });
}
