import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/note_model.dart';
import '../models/todo_item_model.dart';
import '../models/category_model.dart';
import '../models/app_settings_model.dart';
import '../database/database_helper.dart';

class NotesProvider extends ChangeNotifier {
  final DatabaseHelper _dbHelper = DatabaseHelper.instance;

  List<NoteModel> _notes = [];
  bool _isLoading = true;
  String _searchQuery = '';
  NoteCategory _selectedCategory = NoteCategory.all;
  NoteSortOption _currentSortOption = NoteSortOption.recentlyUpdated;

  List<NoteModel> get allNotes => _notes;
  bool get isLoading => _isLoading;
  String get searchQuery => _searchQuery;
  NoteCategory get selectedCategory => _selectedCategory;
  NoteSortOption get currentSortOption => _currentSortOption;

  int get totalNotesCount => _notes.length;

  /// Returns pinned notes
  List<NoteModel> get pinnedNotes =>
      _notes.where((note) => note.isPinned).toList();

  /// Returns recently edited notes (non-pinned or all recent)
  List<NoteModel> get recentNotes {
    final list = List<NoteModel>.from(_notes);
    list.sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    return list.take(5).toList();
  }

  /// Aggregates all to-do items from all notes for the dedicated To-Do List screen
  List<Map<String, dynamic>> get allTodoItems {
    final List<Map<String, dynamic>> items = [];
    for (final note in _notes) {
      for (final todo in note.todoItems) {
        items.add({
          'noteId': note.id,
          'noteTitle': note.title.isNotEmpty ? note.title : 'Untitled Note',
          'todo': todo,
        });
      }
    }
    // Sort: pending first, then by creation date
    items.sort((a, b) {
      final TodoItemModel todoA = a['todo'] as TodoItemModel;
      final TodoItemModel todoB = b['todo'] as TodoItemModel;
      if (todoA.isCompleted != todoB.isCompleted) {
        return todoA.isCompleted ? 1 : -1;
      }
      return todoB.createdAt.compareTo(todoA.createdAt);
    });
    return items;
  }

  /// Filtered and sorted notes list based on current active filters
  List<NoteModel> get filteredNotes {
    List<NoteModel> list = List<NoteModel>.from(_notes);

    // Filter by Category
    if (_selectedCategory != NoteCategory.all) {
      list = list
          .where((note) =>
              note.category.toLowerCase() ==
              _selectedCategory.displayName.toLowerCase())
          .toList();
    }

    // Filter by Search Query
    if (_searchQuery.trim().isNotEmpty) {
      final q = _searchQuery.toLowerCase().trim();
      list = list.where((note) {
        final titleMatch = note.title.toLowerCase().contains(q);
        final contentMatch = note.content.toLowerCase().contains(q);
        final todoMatch = note.todoItems
            .any((t) => t.text.toLowerCase().contains(q));
        return titleMatch || contentMatch || todoMatch;
      }).toList();
    }

    // Sorting (Pinned notes always on top, then chosen sort option)
    list.sort((a, b) {
      if (a.isPinned != b.isPinned) {
        return a.isPinned ? -1 : 1;
      }

      switch (_currentSortOption) {
        case NoteSortOption.recentlyUpdated:
          return b.updatedAt.compareTo(a.updatedAt);
        case NoteSortOption.dateCreatedDesc:
          return b.createdAt.compareTo(a.createdAt);
        case NoteSortOption.dateCreatedAsc:
          return a.createdAt.compareTo(b.createdAt);
        case NoteSortOption.alphabeticalAsc:
          return a.title.toLowerCase().compareTo(b.title.toLowerCase());
        case NoteSortOption.alphabeticalDesc:
          return b.title.toLowerCase().compareTo(a.title.toLowerCase());
      }
    });

    return list;
  }

  /// Load all notes from SQLite database
  Future<void> loadNotes({NoteSortOption? defaultSort}) async {
    _isLoading = true;
    notifyListeners();

    if (defaultSort != null) {
      _currentSortOption = defaultSort;
    }

    try {
      _notes = await _dbHelper.getNotes(sortOption: _currentSortOption);
    } catch (e) {
      debugPrint('Error loading notes from SQLite: $e');
      _notes = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setSelectedCategory(NoteCategory category) {
    _selectedCategory = category;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void setSortOption(NoteSortOption option) {
    _currentSortOption = option;
    notifyListeners();
  }

  /// Add new note safely to SQLite
  Future<void> addNote(NoteModel note) async {
    await _dbHelper.insertNote(note);
    _notes.insert(0, note);
    notifyListeners();
  }

  /// Update existing note in SQLite
  Future<void> updateNote(NoteModel note) async {
    final updated = note.copyWith(updatedAt: DateTime.now());
    await _dbHelper.updateNote(updated);

    final index = _notes.indexWhere((n) => n.id == note.id);
    if (index != -1) {
      _notes[index] = updated;
    } else {
      _notes.insert(0, updated);
    }
    notifyListeners();
  }

  /// Delete note from SQLite
  Future<void> deleteNote(String id) async {
    await _dbHelper.deleteNote(id);
    _notes.removeWhere((n) => n.id == id);
    notifyListeners();
  }

  /// Toggle pin status
  Future<void> togglePin(String id) async {
    final index = _notes.indexWhere((n) => n.id == id);
    if (index != -1) {
      final updated = _notes[index].copyWith(
        isPinned: !_notes[index].isPinned,
        updatedAt: DateTime.now(),
      );
      await _dbHelper.updateNote(updated);
      _notes[index] = updated;
      notifyListeners();
    }
  }

  /// Toggle favorite status
  Future<void> toggleFavorite(String id) async {
    final index = _notes.indexWhere((n) => n.id == id);
    if (index != -1) {
      final updated = _notes[index].copyWith(
        isFavorite: !_notes[index].isFavorite,
        updatedAt: DateTime.now(),
      );
      await _dbHelper.updateNote(updated);
      _notes[index] = updated;
      notifyListeners();
    }
  }

  /// Add To-Do item to a note
  Future<void> addTodoItem(String noteId, String text) async {
    if (text.trim().isEmpty) return;

    final index = _notes.indexWhere((n) => n.id == noteId);
    if (index != -1) {
      final currentNote = _notes[index];
      final newTodo = TodoItemModel(
        id: const Uuid().v4(),
        text: text.trim(),
        isCompleted: false,
      );

      final updatedTodos = List<TodoItemModel>.from(currentNote.todoItems)
        ..add(newTodo);

      final updatedNote = currentNote.copyWith(
        todoItems: updatedTodos,
        updatedAt: DateTime.now(),
      );

      await _dbHelper.updateNote(updatedNote);
      _notes[index] = updatedNote;
      notifyListeners();
    }
  }

  /// Toggle To-Do completion
  Future<void> toggleTodoItem(String noteId, String todoId) async {
    final index = _notes.indexWhere((n) => n.id == noteId);
    if (index != -1) {
      final currentNote = _notes[index];
      final updatedTodos = currentNote.todoItems.map((todo) {
        if (todo.id == todoId) {
          return todo.copyWith(isCompleted: !todo.isCompleted);
        }
        return todo;
      }).toList();

      final updatedNote = currentNote.copyWith(
        todoItems: updatedTodos,
        updatedAt: DateTime.now(),
      );

      await _dbHelper.updateNote(updatedNote);
      _notes[index] = updatedNote;
      notifyListeners();
    }
  }

  /// Delete To-Do item
  Future<void> deleteTodoItem(String noteId, String todoId) async {
    final index = _notes.indexWhere((n) => n.id == noteId);
    if (index != -1) {
      final currentNote = _notes[index];
      final updatedTodos = currentNote.todoItems
          .where((todo) => todo.id != todoId)
          .toList();

      final updatedNote = currentNote.copyWith(
        todoItems: updatedTodos,
        updatedAt: DateTime.now(),
      );

      await _dbHelper.updateNote(updatedNote);
      _notes[index] = updatedNote;
      notifyListeners();
    }
  }

  /// Import notes from backup
  Future<int> importBackupNotes(List<NoteModel> importedNotes) async {
    final count = await _dbHelper.importNotes(importedNotes);
    await loadNotes();
    return count;
  }

  /// Wipe all notes
  Future<void> clearAllNotes() async {
    await _dbHelper.deleteAllNotes();
    _notes.clear();
    notifyListeners();
  }
}
