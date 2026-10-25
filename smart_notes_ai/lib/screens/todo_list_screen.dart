import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../models/note_model.dart';
import '../models/todo_item_model.dart';
import '../providers/notes_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/empty_state_widget.dart';

class TodoListScreen extends StatefulWidget {
  const TodoListScreen({super.key});

  @override
  State<TodoListScreen> createState() => _TodoListScreenState();
}

class _TodoListScreenState extends State<TodoListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _taskController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _taskController.dispose();
    super.dispose();
  }

  /// Adds a standalone quick task into a dedicated 'General Tasks' note container
  Future<void> _addNewTask() async {
    final text = _taskController.text.trim();
    if (text.isEmpty) return;

    final notesProvider = Provider.of<NotesProvider>(context, listen: false);

    // Find existing "Quick Tasks" note or create one
    NoteModel? tasksNote;
    try {
      tasksNote = notesProvider.allNotes.firstWhere(
        (n) => n.title == 'Quick Tasks' && n.category == 'Personal',
      );
    } catch (_) {
      tasksNote = null;
    }

    if (tasksNote == null) {
      final newNote = NoteModel(
        title: 'Quick Tasks',
        content: 'Checklist created from To-Do manager.',
        category: 'Personal',
        todoItems: [
          TodoItemModel(
            id: const Uuid().v4(),
            text: text,
            isCompleted: false,
          ),
        ],
      );
      await notesProvider.addNote(newNote);
    } else {
      await notesProvider.addTodoItem(tasksNote.id, text);
    }

    _taskController.clear();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final notesProvider = Provider.of<NotesProvider>(context);

    final allTodos = notesProvider.allTodoItems;
    final pendingTodos = allTodos
        .where((item) => !(item['todo'] as TodoItemModel).isCompleted)
        .toList();
    final completedTodos = allTodos
        .where((item) => (item['todo'] as TodoItemModel).isCompleted)
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('To-Do Tasks'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.primaryColor,
          labelColor: AppTheme.primaryColor,
          tabs: [
            Tab(text: 'Pending (${pendingTodos.length})'),
            Tab(text: 'Completed (${completedTodos.length})'),
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Quick Add Input Box
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _taskController,
                      decoration: InputDecoration(
                        hintText: 'Add a new task...',
                        prefixIcon: const Icon(Icons.add_circle_outline),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      onSubmitted: (_) => _addNewTask(),
                    ),
                  ),
                  const SizedBox(width: 10),
                  FilledButton(
                    onPressed: _addNewTask,
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.all(16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Icon(Icons.send_rounded),
                  ),
                ],
              ),
            ),

            // Tab Views for Pending vs Completed
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  // Pending Tab
                  pendingTodos.isEmpty
                      ? const EmptyStateWidget(
                          icon: Icons.check_circle_outline,
                          title: 'All caught up!',
                          message:
                              'You have no pending tasks. Add a task above to stay organized.',
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: pendingTodos.length,
                          itemBuilder: (ctx, index) {
                            final item = pendingTodos[index];
                            final TodoItemModel todo =
                                item['todo'] as TodoItemModel;
                            final String noteId = item['noteId'] as String;
                            final String noteTitle =
                                item['noteTitle'] as String;

                            return Card(
                              child: ListTile(
                                leading: Checkbox(
                                  value: todo.isCompleted,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  onChanged: (_) async {
                                    await notesProvider.toggleTodoItem(
                                        noteId, todo.id);
                                  },
                                ),
                                title: Text(
                                  todo.text,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 15,
                                  ),
                                ),
                                subtitle: Text(
                                  'In: $noteTitle',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isDark
                                        ? Colors.white54
                                        : Colors.black45,
                                  ),
                                ),
                                trailing: IconButton(
                                  icon: const Icon(Icons.delete_outline,
                                      size: 18),
                                  onPressed: () async {
                                    await notesProvider.deleteTodoItem(
                                        noteId, todo.id);
                                  },
                                ),
                              ),
                            );
                          },
                        ),

                  // Completed Tab
                  completedTodos.isEmpty
                      ? const EmptyStateWidget(
                          icon: Icons.task_alt,
                          title: 'No completed tasks yet',
                          message:
                              'Tasks you check off will appear here for reference.',
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: completedTodos.length,
                          itemBuilder: (ctx, index) {
                            final item = completedTodos[index];
                            final TodoItemModel todo =
                                item['todo'] as TodoItemModel;
                            final String noteId = item['noteId'] as String;
                            final String noteTitle =
                                item['noteTitle'] as String;

                            return Card(
                              child: ListTile(
                                leading: Checkbox(
                                  value: todo.isCompleted,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  onChanged: (_) async {
                                    await notesProvider.toggleTodoItem(
                                        noteId, todo.id);
                                  },
                                ),
                                title: Text(
                                  todo.text,
                                  style: TextStyle(
                                    decoration: TextDecoration.lineThrough,
                                    color: isDark
                                        ? Colors.white38
                                        : Colors.black38,
                                    fontSize: 15,
                                  ),
                                ),
                                subtitle: Text(
                                  'In: $noteTitle',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: isDark
                                        ? Colors.white38
                                        : Colors.black38,
                                  ),
                                ),
                                trailing: IconButton(
                                  icon: const Icon(Icons.delete_outline,
                                      size: 18),
                                  onPressed: () async {
                                    await notesProvider.deleteTodoItem(
                                        noteId, todo.id);
                                  },
                                ),
                              ),
                            );
                          },
                        ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
