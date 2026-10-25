import 'dart:async';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';
import '../models/note_model.dart';
import '../models/app_settings_model.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._internal();
  static Database? _database;

  DatabaseHelper._internal();

  static const String tableNotes = 'notes';
  static const String colId = 'id';
  static const String colTitle = 'title';
  static const String colContent = 'content';
  static const String colCategory = 'category';
  static const String colIsPinned = 'isPinned';
  static const String colIsFavorite = 'isFavorite';
  static const String colCreatedAt = 'createdAt';
  static const String colUpdatedAt = 'updatedAt';
  static const String colColorValue = 'colorValue';
  static const String colReminderDateTime = 'reminderDateTime';
  static const String colTodoItems = 'todoItems';

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'smart_notes_ai.db');

    return await openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE $tableNotes (
        $colId TEXT PRIMARY KEY,
        $colTitle TEXT NOT NULL,
        $colContent TEXT NOT NULL,
        $colCategory TEXT NOT NULL,
        $colIsPinned INTEGER NOT NULL DEFAULT 0,
        $colIsFavorite INTEGER NOT NULL DEFAULT 0,
        $colCreatedAt TEXT NOT NULL,
        $colUpdatedAt TEXT NOT NULL,
        $colColorValue INTEGER NOT NULL DEFAULT 0,
        $colReminderDateTime TEXT,
        $colTodoItems TEXT
      )
    ''');

    // Create index on category and updatedAt for fast queries
    await db.execute('CREATE INDEX idx_notes_category ON $tableNotes ($colCategory);');
    await db.execute('CREATE INDEX idx_notes_updatedAt ON $tableNotes ($colUpdatedAt);');
  }

  // Insert a note
  Future<int> insertNote(NoteModel note) async {
    final db = await database;
    return await db.insert(
      tableNotes,
      note.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // Update a note
  Future<int> updateNote(NoteModel note) async {
    final db = await database;
    return await db.update(
      tableNotes,
      note.toMap(),
      where: '$colId = ?',
      whereArgs: [note.id],
    );
  }

  // Delete a note
  Future<int> deleteNote(String id) async {
    final db = await database;
    return await db.delete(
      tableNotes,
      where: '$colId = ?',
      whereArgs: [id],
    );
  }

  // Get note by ID
  Future<NoteModel?> getNoteById(String id) async {
    final db = await database;
    final maps = await db.query(
      tableNotes,
      where: '$colId = ?',
      whereArgs: [id],
      limit: 1,
    );

    if (maps.isNotEmpty) {
      return NoteModel.fromMap(maps.first);
    }
    return null;
  }

  // Get all notes with optional category and sorting
  Future<List<NoteModel>> getNotes({
    String? category,
    NoteSortOption sortOption = NoteSortOption.recentlyUpdated,
  }) async {
    final db = await database;

    String? whereClause;
    List<dynamic>? whereArgs;

    if (category != null && category.toLowerCase() != 'all') {
      whereClause = '$colCategory = ?';
      whereArgs = [category];
    }

    String orderBy;
    switch (sortOption) {
      case NoteSortOption.recentlyUpdated:
        orderBy = '$colIsPinned DESC, $colUpdatedAt DESC';
        break;
      case NoteSortOption.dateCreatedDesc:
        orderBy = '$colIsPinned DESC, $colCreatedAt DESC';
        break;
      case NoteSortOption.dateCreatedAsc:
        orderBy = '$colIsPinned DESC, $colCreatedAt ASC';
        break;
      case NoteSortOption.alphabeticalAsc:
        orderBy = '$colIsPinned DESC, $colTitle COLLATE NOCASE ASC';
        break;
      case NoteSortOption.alphabeticalDesc:
        orderBy = '$colIsPinned DESC, $colTitle COLLATE NOCASE DESC';
        break;
    }

    final result = await db.query(
      tableNotes,
      where: whereClause,
      whereArgs: whereArgs,
      orderBy: orderBy,
    );

    return result.map((map) => NoteModel.fromMap(map)).toList();
  }

  // Full-text search across title and content
  Future<List<NoteModel>> searchNotes(String query, {String? category}) async {
    final db = await database;
    final sanitized = '%${query.trim()}%';

    String whereClause = '($colTitle LIKE ? OR $colContent LIKE ?)';
    List<dynamic> whereArgs = [sanitized, sanitized];

    if (category != null && category.toLowerCase() != 'all') {
      whereClause += ' AND $colCategory = ?';
      whereArgs.add(category);
    }

    final result = await db.query(
      tableNotes,
      where: whereClause,
      whereArgs: whereArgs,
      orderBy: '$colIsPinned DESC, $colUpdatedAt DESC',
    );

    return result.map((map) => NoteModel.fromMap(map)).toList();
  }

  // Total count of notes
  Future<int> getNotesCount() async {
    final db = await database;
    final result = await db.rawQuery('SELECT COUNT(*) as count FROM $tableNotes');
    return Sqflite.firstIntValue(result) ?? 0;
  }

  // Import notes safely in a transaction
  Future<int> importNotes(List<NoteModel> notes) async {
    final db = await database;
    int importedCount = 0;

    await db.transaction((txn) async {
      for (final note in notes) {
        await txn.insert(
          tableNotes,
          note.toMap(),
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
        importedCount++;
      }
    });

    return importedCount;
  }

  // Delete all notes
  Future<int> deleteAllNotes() async {
    final db = await database;
    return await db.delete(tableNotes);
  }

  // Close database
  Future<void> close() async {
    final db = await database;
    await db.close();
    _database = null;
  }
}
