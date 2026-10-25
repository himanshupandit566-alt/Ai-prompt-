import 'package:flutter/material.dart';

enum NoteCategory {
  all,
  personal,
  study,
  work,
  ideas,
  other,
}

extension NoteCategoryExtension on NoteCategory {
  String get displayName {
    switch (this) {
      case NoteCategory.all:
        return 'All';
      case NoteCategory.personal:
        return 'Personal';
      case NoteCategory.study:
        return 'Study';
      case NoteCategory.work:
        return 'Work';
      case NoteCategory.ideas:
        return 'Ideas';
      case NoteCategory.other:
        return 'Other';
    }
  }

  IconData get icon {
    switch (this) {
      case NoteCategory.all:
        return Icons.grid_view_rounded;
      case NoteCategory.personal:
        return Icons.person_rounded;
      case NoteCategory.study:
        return Icons.school_rounded;
      case NoteCategory.work:
        return Icons.work_rounded;
      case NoteCategory.ideas:
        return Icons.lightbulb_rounded;
      case NoteCategory.other:
        return Icons.folder_rounded;
    }
  }

  Color get color {
    switch (this) {
      case NoteCategory.all:
        return const Color(0xFF6750A4);
      case NoteCategory.personal:
        return const Color(0xFFE06D53);
      case NoteCategory.study:
        return const Color(0xFF388E3C);
      case NoteCategory.work:
        return const Color(0xFF1976D2);
      case NoteCategory.ideas:
        return const Color(0xFFF57C00);
      case NoteCategory.other:
        return const Color(0xFF7B1FA2);
    }
  }

  static NoteCategory fromString(String? name) {
    if (name == null) return NoteCategory.personal;
    for (var cat in NoteCategory.values) {
      if (cat.name.toLowerCase() == name.toLowerCase() ||
          cat.displayName.toLowerCase() == name.toLowerCase()) {
        return cat;
      }
    }
    return NoteCategory.personal;
  }
}
