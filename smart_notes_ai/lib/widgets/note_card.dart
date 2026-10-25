import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../models/note_model.dart';
import '../models/category_model.dart';
import '../providers/notes_provider.dart';
import '../providers/settings_provider.dart';
import '../theme/app_theme.dart';

class NoteCard extends StatelessWidget {
  final NoteModel note;
  final VoidCallback onTap;

  const NoteCard({
    super.key,
    required this.note,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final settingsProvider = Provider.of<SettingsProvider>(context);
    final notesProvider = Provider.of<NotesProvider>(context, listen: false);

    final category = NoteCategoryExtension.fromString(note.category);
    final hidePreviews = settingsProvider.settings.hideRecentPreviews;

    final Color cardBgColor = note.colorValue != 0
        ? (isDark
            ? AppTheme.noteColorsDark[note.colorValue % AppTheme.noteColorsDark.length]
            : AppTheme.noteColors[note.colorValue % AppTheme.noteColors.length])
        : theme.cardTheme.color ?? (isDark ? const Color(0xFF1E293B) : Colors.white);

    final completedTodos =
        note.todoItems.where((item) => item.isCompleted).length;
    final totalTodos = note.todoItems.length;

    return Card(
      color: cardBgColor,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Row: Category Pill & Badges & Action Menu
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: category.color.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(category.icon, size: 12, color: category.color),
                        const SizedBox(width: 4),
                        Text(
                          category.displayName,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: category.color,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  if (note.reminderDateTime != null) ...[
                    Icon(
                      Icons.alarm,
                      size: 16,
                      color: note.reminderDateTime!.isBefore(DateTime.now())
                          ? theme.colorScheme.error
                          : AppTheme.primaryColor,
                    ),
                    const SizedBox(width: 6),
                  ],
                  if (note.isPinned) ...[
                    const Icon(
                      Icons.push_pin,
                      size: 16,
                      color: AppTheme.primaryColor,
                    ),
                    const SizedBox(width: 6),
                  ],
                  if (note.isFavorite) ...[
                    const Icon(
                      Icons.favorite,
                      size: 16,
                      color: Colors.redAccent,
                    ),
                    const SizedBox(width: 6),
                  ],
                  PopupMenuButton<String>(
                    icon: Icon(
                      Icons.more_vert,
                      size: 18,
                      color: isDark ? Colors.white60 : Colors.black45,
                    ),
                    padding: EdgeInsets.zero,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    onSelected: (value) async {
                      if (value == 'pin') {
                        await notesProvider.togglePin(note.id);
                      } else if (value == 'fav') {
                        await notesProvider.toggleFavorite(note.id);
                      } else if (value == 'share') {
                        Share.share(
                          '${note.title}\n\n${note.content}',
                          subject: note.title,
                        );
                      } else if (value == 'delete') {
                        _showDeleteConfirm(context, notesProvider);
                      }
                    },
                    itemBuilder: (context) => [
                      PopupMenuItem(
                        value: 'pin',
                        child: Row(
                          children: [
                            Icon(note.isPinned
                                ? Icons.push_pin_outlined
                                : Icons.push_pin),
                            const SizedBox(width: 8),
                            Text(note.isPinned ? 'Unpin' : 'Pin to top'),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        value: 'fav',
                        child: Row(
                          children: [
                            Icon(note.isFavorite
                                ? Icons.favorite_border
                                : Icons.favorite),
                            const SizedBox(width: 8),
                            Text(note.isFavorite
                                ? 'Remove Favorite'
                                : 'Favorite'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'share',
                        child: Row(
                          children: [
                            Icon(Icons.share_outlined),
                            const SizedBox(width: 8),
                            Text('Share Note'),
                          ],
                        ),
                      ),
                      const PopupMenuDivider(),
                      PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete_outline,
                                color: theme.colorScheme.error),
                            const SizedBox(width: 8),
                            Text('Delete',
                                style:
                                    TextStyle(color: theme.colorScheme.error)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Title
              Text(
                note.title.isNotEmpty ? note.title : 'Untitled Note',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),

              const SizedBox(height: 6),

              // Content Preview (respecting hide previews)
              Text(
                hidePreviews
                    ? '•••••••••••••••••••••••••'
                    : (note.content.isNotEmpty
                        ? note.content
                        : (totalTodos > 0
                            ? '$totalTodos checklist tasks'
                            : 'No additional text')),
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? Colors.white70 : const Color(0xFF475569),
                  height: 1.4,
                  fontStyle:
                      hidePreviews ? FontStyle.italic : FontStyle.normal,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),

              // Checklist summary if present
              if (totalTodos > 0) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    Icon(
                      Icons.check_circle_outline,
                      size: 14,
                      color: completedTodos == totalTodos
                          ? AppTheme.successColor
                          : theme.colorScheme.primary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '$completedTodos / $totalTodos completed',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: isDark ? Colors.white60 : Colors.black54,
                      ),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 12),

              // Footer: Formatted Date
              Text(
                'Updated ${DateFormat.yMMMd().add_jm().format(note.updatedAt)}',
                style: TextStyle(
                  fontSize: 11,
                  color: isDark ? Colors.white38 : Colors.black38,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showDeleteConfirm(
      BuildContext context, NotesProvider notesProvider) {
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        title: const Text('Delete Note?'),
        content: Text(
          'Are you sure you want to delete "${note.title.isNotEmpty ? note.title : 'this note'}"? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            onPressed: () async {
              Navigator.pop(dialogCtx);
              await notesProvider.deleteNote(note.id);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Note deleted')),
                );
              }
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
