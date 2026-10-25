import 'dart:convert';
import 'package:uuid/uuid.dart';
import 'todo_item_model.dart';

class NoteModel {
  final String id;
  final String title;
  final String content;
  final String category;
  final bool isPinned;
  final bool isFavorite;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int colorValue;
  final DateTime? reminderDateTime;
  final List<TodoItemModel> todoItems;

  NoteModel({
    String? id,
    required this.title,
    required this.content,
    this.category = 'Personal',
    this.isPinned = false,
    this.isFavorite = false,
    DateTime? createdAt,
    DateTime? updatedAt,
    this.colorValue = 0,
    this.reminderDateTime,
    List<TodoItemModel>? todoItems,
  })  : id = id ?? const Uuid().v4(),
        createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now(),
        todoItems = todoItems ?? const [];

  NoteModel copyWith({
    String? id,
    String? title,
    String? content,
    String? category,
    bool? isPinned,
    bool? isFavorite,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? colorValue,
    DateTime? reminderDateTime,
    bool clearReminder = false,
    List<TodoItemModel>? todoItems,
  }) {
    return NoteModel(
      id: id ?? this.id,
      title: title ?? this.title,
      content: content ?? this.content,
      category: category ?? this.category,
      isPinned: isPinned ?? this.isPinned,
      isFavorite: isFavorite ?? this.isFavorite,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      colorValue: colorValue ?? this.colorValue,
      reminderDateTime:
          clearReminder ? null : (reminderDateTime ?? this.reminderDateTime),
      todoItems: todoItems ?? this.todoItems,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'content': content,
      'category': category,
      'isPinned': isPinned ? 1 : 0,
      'isFavorite': isFavorite ? 1 : 0,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'colorValue': colorValue,
      'reminderDateTime': reminderDateTime?.toIso8601String(),
      'todoItems': json.encode(todoItems.map((e) => e.toMap()).toList()),
    };
  }

  factory NoteModel.fromMap(Map<String, dynamic> map) {
    List<TodoItemModel> parsedTodos = [];
    if (map['todoItems'] != null && map['todoItems'].toString().isNotEmpty) {
      try {
        final decoded = json.decode(map['todoItems'].toString());
        if (decoded is List) {
          parsedTodos = decoded
              .map((item) =>
                  TodoItemModel.fromMap(item as Map<String, dynamic>))
              .toList();
        }
      } catch (_) {
        parsedTodos = [];
      }
    }

    return NoteModel(
      id: map['id'] as String,
      title: map['title'] as String? ?? '',
      content: map['content'] as String? ?? '',
      category: map['category'] as String? ?? 'Personal',
      isPinned: (map['isPinned'] == 1 || map['isPinned'] == true),
      isFavorite: (map['isFavorite'] == 1 || map['isFavorite'] == true),
      createdAt: map['createdAt'] != null
          ? DateTime.tryParse(map['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: map['updatedAt'] != null
          ? DateTime.tryParse(map['updatedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      colorValue: map['colorValue'] is int
          ? map['colorValue'] as int
          : int.tryParse(map['colorValue']?.toString() ?? '0') ?? 0,
      reminderDateTime: map['reminderDateTime'] != null
          ? DateTime.tryParse(map['reminderDateTime'].toString())
          : null,
      todoItems: parsedTodos,
    );
  }

  String toJson() => json.encode(toMap());

  factory NoteModel.fromJson(String source) =>
      NoteModel.fromMap(json.decode(source) as Map<String, dynamic>);
}
