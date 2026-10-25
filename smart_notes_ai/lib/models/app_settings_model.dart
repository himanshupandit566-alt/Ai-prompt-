import 'package:flutter/material.dart';

enum NoteSortOption {
  recentlyUpdated,
  dateCreatedDesc,
  dateCreatedAsc,
  alphabeticalAsc,
  alphabeticalDesc,
}

extension NoteSortOptionExtension on NoteSortOption {
  String get displayName {
    switch (this) {
      case NoteSortOption.recentlyUpdated:
        return 'Recently Updated';
      case NoteSortOption.dateCreatedDesc:
        return 'Date Created (Newest)';
      case NoteSortOption.dateCreatedAsc:
        return 'Date Created (Oldest)';
      case NoteSortOption.alphabeticalAsc:
        return 'Alphabetical (A - Z)';
      case NoteSortOption.alphabeticalDesc:
        return 'Alphabetical (Z - A)';
    }
  }

  static NoteSortOption fromString(String? val) {
    if (val == null) return NoteSortOption.recentlyUpdated;
    for (var opt in NoteSortOption.values) {
      if (opt.name == val) return opt;
    }
    return NoteSortOption.recentlyUpdated;
  }
}

class AppSettingsModel {
  final ThemeMode themeMode;
  final NoteSortOption defaultSortOption;
  final bool isPinLockEnabled;
  final String? pinHash;
  final String? pinSalt;
  final bool hideRecentPreviews;
  final String? customAiApiKey;

  const AppSettingsModel({
    this.themeMode = ThemeMode.system,
    this.defaultSortOption = NoteSortOption.recentlyUpdated,
    this.isPinLockEnabled = false,
    this.pinHash,
    this.pinSalt,
    this.hideRecentPreviews = false,
    this.customAiApiKey,
  });

  AppSettingsModel copyWith({
    ThemeMode? themeMode,
    NoteSortOption? defaultSortOption,
    bool? isPinLockEnabled,
    String? pinHash,
    String? pinSalt,
    bool? hideRecentPreviews,
    String? customAiApiKey,
    bool clearPin = false,
    bool clearAiApiKey = false,
  }) {
    return AppSettingsModel(
      themeMode: themeMode ?? this.themeMode,
      defaultSortOption: defaultSortOption ?? this.defaultSortOption,
      isPinLockEnabled: isPinLockEnabled ?? this.isPinLockEnabled,
      pinHash: clearPin ? null : (pinHash ?? this.pinHash),
      pinSalt: clearPin ? null : (pinSalt ?? this.pinSalt),
      hideRecentPreviews: hideRecentPreviews ?? this.hideRecentPreviews,
      customAiApiKey:
          clearAiApiKey ? null : (customAiApiKey ?? this.customAiApiKey),
    );
  }
}
