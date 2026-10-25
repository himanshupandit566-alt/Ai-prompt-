import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:uuid/uuid.dart';
import '../models/note_model.dart';
import '../models/todo_item_model.dart';
import '../models/category_model.dart';
import '../providers/notes_provider.dart';
import '../providers/settings_provider.dart';
import '../services/ai_service.dart';
import '../services/notification_service.dart';
import '../theme/app_theme.dart';
import '../widgets/voice_input_dialog.dart';
import '../widgets/reminder_picker_dialog.dart';

class NoteEditorScreen extends StatefulWidget {
  final NoteModel? note;

  const NoteEditorScreen({super.key, this.note});

  @override
  State<NoteEditorScreen> createState() => _NoteEditorScreenState();
}

class _NoteEditorScreenState extends State<NoteEditorScreen> {
  late TextEditingController _titleController;
  late TextEditingController _contentController;
  late TextEditingController _todoInputController;

  late String _noteId;
  late String _selectedCategory;
  late bool _isPinned;
  late bool _isFavorite;
  late int _colorValue;
  DateTime? _reminderDateTime;
  late List<TodoItemModel> _todoItems;
  late DateTime _createdAt;

  bool _isSaving = false;
  bool _isAiProcessing = false;

  @override
  void initState() {
    super.initState();
    final note = widget.note;
    _noteId = note?.id ?? const Uuid().v4();
    _titleController = TextEditingController(text: note?.title ?? '');
    _contentController = TextEditingController(text: note?.content ?? '');
    _todoInputController = TextEditingController();

    _selectedCategory = note?.category ?? 'Personal';
    _isPinned = note?.isPinned ?? false;
    _isFavorite = note?.isFavorite ?? false;
    _colorValue = note?.colorValue ?? 0;
    _reminderDateTime = note?.reminderDateTime;
    _todoItems = note != null
        ? List<TodoItemModel>.from(note.todoItems)
        : [];
    _createdAt = note?.createdAt ?? DateTime.now();
  }

  @override
  void dispose() {
    _autoSaveNote();
    _titleController.dispose();
    _contentController.dispose();
    _todoInputController.dispose();
    super.dispose();
  }

  /// Automatically and safely saves the note to SQLite without dropping changes
  Future<void> _autoSaveNote() async {
    final title = _titleController.text.trim();
    final content = _contentController.text.trim();

    // If completely empty and no to-dos, discard safely without saving dummy entry
    if (title.isEmpty && content.isEmpty && _todoItems.isEmpty) {
      if (widget.note != null) {
        // If it previously existed but was cleared, delete it
        final notesProvider = Provider.of<NotesProvider>(context, listen: false);
        await notesProvider.deleteNote(_noteId);
      }
      return;
    }

    final updatedNote = NoteModel(
      id: _noteId,
      title: title,
      content: content,
      category: _selectedCategory,
      isPinned: _isPinned,
      isFavorite: _isFavorite,
      createdAt: _createdAt,
      updatedAt: DateTime.now(),
      colorValue: _colorValue,
      reminderDateTime: _reminderDateTime,
      todoItems: _todoItems,
    );

    final notesProvider = Provider.of<NotesProvider>(context, listen: false);

    if (widget.note == null) {
      await notesProvider.addNote(updatedNote);
    } else {
      await notesProvider.updateNote(updatedNote);
    }
  }

  void _addTodoItem() {
    final text = _todoInputController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _todoItems.add(
        TodoItemModel(
          id: const Uuid().v4(),
          text: text,
          isCompleted: false,
        ),
      );
      _todoInputController.clear();
    });
  }

  void _toggleTodoItem(String id) {
    setState(() {
      _todoItems = _todoItems.map((item) {
        if (item.id == id) {
          return item.copyWith(isCompleted: !item.isCompleted);
        }
        return item;
      }).toList();
    });
  }

  void _deleteTodoItem(String id) {
    setState(() {
      _todoItems.removeWhere((item) => item.id == id);
    });
  }

  void _openVoiceInput() async {
    final result = await showDialog<String>(
      context: context,
      builder: (context) => const VoiceInputDialog(),
    );

    if (result != null && result.isNotEmpty) {
      setState(() {
        if (_contentController.text.isNotEmpty) {
          _contentController.text += ' $result';
        } else {
          _contentController.text = result;
        }
      });
    }
  }

  void _openReminderPicker() async {
    final result = await showDialog<dynamic>(
      context: context,
      builder: (context) => ReminderPickerDialog(
        initialDateTime: _reminderDateTime,
      ),
    );

    if (result == 'clear') {
      setState(() => _reminderDateTime = null);
      await NotificationService.instance.cancelReminder(_noteId.hashCode);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Reminder removed')),
        );
      }
    } else if (result is DateTime) {
      setState(() => _reminderDateTime = result);
      final success = await NotificationService.instance.scheduleReminder(
        id: _noteId.hashCode,
        title: _titleController.text.isNotEmpty
            ? _titleController.text
            : 'Note Reminder',
        body: _contentController.text,
        scheduledDate: result,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(success
                ? 'Reminder scheduled for ${DateFormat.yMMMd().add_jm().format(result)}'
                : 'Could not schedule reminder. Check notification permissions in Android Settings.'),
          ),
        );
      }
    }
  }

  void _runAiAssistant() async {
    final content = _contentController.text.trim();
    if (content.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please write some content first to analyze.')),
      );
      return;
    }

    setState(() => _isAiProcessing = true);

    final settings = Provider.of<SettingsProvider>(context, listen: false);
    final result = await AIService.instance.summarizeNote(
      content: content,
      title: _titleController.text,
      apiKey: settings.settings.customAiApiKey,
    );

    if (!mounted) return;
    setState(() => _isAiProcessing = false);

    _showAiBottomSheet(result);
  }

  void _showAiBottomSheet(AISummaryResult result) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.auto_awesome, color: AppTheme.primaryColor),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Smart AI Insights',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        result.isFromCloudAi
                            ? 'Generated via Gemini Cloud LLM'
                            : 'Generated via Local Offline Smart Extractor (100% Private)',
                        style: TextStyle(
                          fontSize: 11,
                          color: result.isFromCloudAi
                              ? AppTheme.accentColor
                              : (isDark ? Colors.white60 : Colors.black54),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Text(
              'Key Summary:',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                result.summary,
                style: const TextStyle(fontSize: 14, height: 1.4),
              ),
            ),
            if (result.keyActionItems.isNotEmpty) ...[
              const SizedBox(height: 14),
              const Text(
                'Identified Action Items:',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
              const SizedBox(height: 6),
              ...result.keyActionItems.map(
                (item) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2.0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('• ', style: TextStyle(fontWeight: FontWeight.bold)),
                      Expanded(child: Text(item, style: const TextStyle(fontSize: 13))),
                      IconButton(
                        icon: const Icon(Icons.add_task, size: 18),
                        tooltip: 'Add to checklist',
                        onPressed: () {
                          setState(() {
                            _todoItems.add(
                              TodoItemModel(
                                id: const Uuid().v4(),
                                text: item,
                              ),
                            );
                          });
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Added to checklist!')),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ],
            if (result.suggestedTitle != null && _titleController.text.isEmpty) ...[
              const SizedBox(height: 14),
              FilledButton.tonal(
                onPressed: () {
                  setState(() => _titleController.text = result.suggestedTitle!);
                  Navigator.pop(ctx);
                },
                child: Text('Apply Title: "${result.suggestedTitle}"'),
              ),
            ],
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Close'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showColorPicker() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final palette = isDark ? AppTheme.noteColorsDark : AppTheme.noteColors;

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Select Note Accent Color',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: List.generate(palette.length, (index) {
                final color = palette[index];
                final isSelected = _colorValue == index;

                return GestureDetector(
                  onTap: () {
                    setState(() => _colorValue = index);
                    Navigator.pop(ctx);
                  },
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: index == 0
                          ? (isDark ? const Color(0xFF1E293B) : Colors.white)
                          : color,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isSelected
                            ? AppTheme.primaryColor
                            : (isDark ? Colors.white24 : Colors.black12),
                        width: isSelected ? 3 : 1,
                      ),
                    ),
                    child: isSelected
                        ? const Icon(Icons.check, size: 20, color: AppTheme.primaryColor)
                        : (index == 0
                            ? const Icon(Icons.format_color_reset, size: 16, color: Colors.grey)
                            : null),
                  ),
                );
              }),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _showDeleteDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Note?'),
        content: const Text(
          'This will permanently delete this note. Are you sure you want to proceed?',
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
              if (widget.note != null) {
                final notesProvider =
                    Provider.of<NotesProvider>(context, listen: false);
                await notesProvider.deleteNote(_noteId);
              }
              if (mounted) {
                Navigator.pop(context);
              }
            },
            child: const Text('Delete Permanently'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final Color screenBgColor = _colorValue != 0
        ? (isDark
            ? AppTheme.noteColorsDark[_colorValue % AppTheme.noteColorsDark.length]
            : AppTheme.noteColors[_colorValue % AppTheme.noteColors.length])
        : theme.scaffoldBackgroundColor;

    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) {
          _autoSaveNote();
        }
      },
      child: Scaffold(
        backgroundColor: screenBgColor,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () {
              _autoSaveNote();
              Navigator.pop(context);
            },
          ),
          actions: [
            // Voice Input
            IconButton(
              icon: const Icon(Icons.mic_none_rounded),
              tooltip: 'Voice Input',
              onPressed: _openVoiceInput,
            ),
            // AI Assistant
            IconButton(
              icon: _isAiProcessing
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.auto_awesome_outlined),
              tooltip: 'Smart AI Insights',
              onPressed: _isAiProcessing ? null : _runAiAssistant,
            ),
            // Reminder
            IconButton(
              icon: Icon(
                _reminderDateTime != null
                    ? Icons.alarm_on
                    : Icons.alarm_add_outlined,
                color: _reminderDateTime != null ? AppTheme.primaryColor : null,
              ),
              tooltip: 'Set Reminder',
              onPressed: _openReminderPicker,
            ),
            // Pin Toggle
            IconButton(
              icon: Icon(
                _isPinned ? Icons.push_pin : Icons.push_pin_outlined,
                color: _isPinned ? AppTheme.primaryColor : null,
              ),
              tooltip: _isPinned ? 'Unpin Note' : 'Pin Note',
              onPressed: () => setState(() => _isPinned = !_isPinned),
            ),
            // Favorite Toggle
            IconButton(
              icon: Icon(
                _isFavorite ? Icons.favorite : Icons.favorite_border,
                color: _isFavorite ? Colors.redAccent : null,
              ),
              tooltip: _isFavorite ? 'Remove Favorite' : 'Favorite',
              onPressed: () => setState(() => _isFavorite = !_isFavorite),
            ),
            // More menu (Color, Share, Delete)
            PopupMenuButton<String>(
              onSelected: (val) {
                if (val == 'color') _showColorPicker();
                if (val == 'share') {
                  Share.share(
                    '${_titleController.text}\n\n${_contentController.text}',
                    subject: _titleController.text,
                  );
                }
                if (val == 'delete') _showDeleteDialog();
              },
              itemBuilder: (ctx) => [
                const PopupMenuItem(
                  value: 'color',
                  child: Row(
                    children: [
                      Icon(Icons.palette_outlined),
                      SizedBox(width: 8),
                      Text('Change Color'),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'share',
                  child: Row(
                    children: [
                      Icon(Icons.share_outlined),
                      SizedBox(width: 8),
                      Text('Share Note'),
                    ],
                  ),
                ),
                if (widget.note != null) ...[
                  const PopupMenuDivider(),
                  PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: [
                        Icon(Icons.delete_outline, color: theme.colorScheme.error),
                        const SizedBox(width: 8),
                        Text('Delete Note',
                            style: TextStyle(color: theme.colorScheme.error)),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
        body: SafeArea(
          child: Column(
            children: [
              // Category Pill Selector Bar
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                child: Row(
                  children: [
                    for (var cat in NoteCategory.values)
                      if (cat != NoteCategory.all)
                        Padding(
                          padding: const EdgeInsets.only(right: 6.0),
                          child: ChoiceChip(
                            label: Text(cat.displayName),
                            selected: _selectedCategory.toLowerCase() ==
                                cat.displayName.toLowerCase(),
                            onSelected: (sel) {
                              if (sel) {
                                setState(() => _selectedCategory = cat.displayName);
                              }
                            },
                            avatar: Icon(cat.icon, size: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                        ),
                  ],
                ),
              ),

              const Divider(height: 1),

              // Scrollable Note Body
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  children: [
                    // Reminder Indicator banner if active
                    if (_reminderDateTime != null) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                          border: BorderSide(
                              color: AppTheme.primaryColor.withOpacity(0.3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.alarm,
                                size: 16, color: AppTheme.primaryColor),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Reminder: ${DateFormat.yMMMd().add_jm().format(_reminderDateTime!)}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.primaryColor,
                                ),
                              ),
                            ),
                            InkWell(
                              onTap: () => setState(() => _reminderDateTime = null),
                              child: const Icon(Icons.close, size: 16),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],

                    // Title TextField
                    TextField(
                      controller: _titleController,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        letterSpacing: -0.5,
                      ),
                      decoration: const InputDecoration(
                        hintText: 'Note Title...',
                        hintStyle: TextStyle(color: Colors.black26),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        filled: false,
                        contentPadding: EdgeInsets.zero,
                      ),
                      maxLines: null,
                    ),

                    // Timestamp metadata
                    Text(
                      'Created ${DateFormat.yMMMd().add_jm().format(_createdAt)}',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.white38 : Colors.black38,
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Main Content TextField
                    TextField(
                      controller: _contentController,
                      style: const TextStyle(fontSize: 16, height: 1.5),
                      decoration: const InputDecoration(
                        hintText: 'Start typing your note here...',
                        hintStyle: TextStyle(color: Colors.black26),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        filled: false,
                        contentPadding: EdgeInsets.zero,
                      ),
                      maxLines: null,
                      keyboardType: TextInputType.multiline,
                    ),

                    const SizedBox(height: 24),

                    // Embedded Checklist Tasks Section
                    Row(
                      children: [
                        const Icon(Icons.checklist, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Checklist (${_todoItems.where((i) => i.isCompleted).length}/${_todoItems.length})',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    // To-Do items list
                    for (final todo in _todoItems)
                      ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: Checkbox(
                          value: todo.isCompleted,
                          onChanged: (_) => _toggleTodoItem(todo.id),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(6),
                          ),
                        ),
                        title: Text(
                          todo.text,
                          style: TextStyle(
                            fontSize: 14,
                            decoration: todo.isCompleted
                                ? TextDecoration.lineThrough
                                : null,
                            color: todo.isCompleted
                                ? (isDark ? Colors.white38 : Colors.black38)
                                : null,
                          ),
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.close, size: 16),
                          onPressed: () => _deleteTodoItem(todo.id),
                        ),
                      ),

                    // Add new task input row
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4.0),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _todoInputController,
                              decoration: InputDecoration(
                                hintText: 'Add a task item...',
                                isDense: true,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              onSubmitted: (_) => _addTodoItem(),
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton.filled(
                            onPressed: _addTodoItem,
                            icon: const Icon(Icons.add, size: 18),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
