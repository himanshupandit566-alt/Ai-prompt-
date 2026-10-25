import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/category_model.dart';
import '../providers/notes_provider.dart';
import '../providers/settings_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/category_chip.dart';
import '../widgets/note_card.dart';
import '../widgets/stat_badge.dart';
import '../widgets/empty_state_widget.dart';
import 'note_editor_screen.dart';
import 'todo_list_screen.dart';
import 'settings_screen.dart';
import 'pin_lock_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final settings = Provider.of<SettingsProvider>(context, listen: false);
      Provider.of<NotesProvider>(context, listen: false).loadNotes(
        defaultSort: settings.settings.defaultSortOption,
      );
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _openNoteEditor([NoteModel? note]) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => NoteEditorScreen(note: note),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final settingsProvider = Provider.of<SettingsProvider>(context);

    // If locked by PIN, show PIN lock screen
    if (settingsProvider.requiresUnlock) {
      return const PinLockScreen();
    }

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _buildNotesTab(),
          const TodoListScreen(),
          const SettingsScreen(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() => _currentIndex = index);
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.note_alt_outlined),
            selectedIcon: Icon(Icons.note_alt_rounded),
            label: 'Notes',
          ),
          NavigationDestination(
            icon: Icon(Icons.checklist_outlined),
            selectedIcon: Icon(Icons.checklist_rounded),
            label: 'To-Do',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings_rounded),
            label: 'Settings',
          ),
        ],
      ),
      floatingActionButton: _currentIndex == 0
          ? FloatingActionButton.extended(
              onPressed: () => _openNoteEditor(),
              icon: const Icon(Icons.edit_note_rounded, size: 22),
              label: const Text(
                'New Note',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            )
          : null,
    );
  }

  Widget _buildNotesTab() {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final notesProvider = Provider.of<NotesProvider>(context);

    final pinnedNotes = notesProvider.pinnedNotes;
    final filteredNotes = notesProvider.filteredNotes;
    final totalNotes = notesProvider.totalNotesCount;
    final totalTodos = notesProvider.allTodoItems.length;

    return SafeArea(
      child: CustomScrollView(
        slivers: [
          // App Bar with Logo & Branding
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(left: 20, right: 20, top: 16, bottom: 8),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppTheme.primaryColor, AppTheme.accentColor],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.auto_awesome, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'SmartNotes AI',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.5,
                        ),
                      ),
                      Text(
                        'Offline • Smart • Private',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: isDark ? Colors.white60 : Colors.black54,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  // Quick Settings shortcut button
                  IconButton(
                    icon: const Icon(Icons.tune_rounded),
                    tooltip: 'Sort & Preferences',
                    onPressed: () => setState(() => _currentIndex = 2),
                  ),
                ],
              ),
            ),
          ),

          // Overview Stats Badges
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    StatBadge(
                      icon: Icons.notes_rounded,
                      label: 'Total Notes',
                      value: totalNotes.toString(),
                      color: AppTheme.primaryColor,
                    ),
                    const SizedBox(width: 10),
                    StatBadge(
                      icon: Icons.push_pin_rounded,
                      label: 'Pinned',
                      value: pinnedNotes.length.toString(),
                      color: AppTheme.warningColor,
                    ),
                    const SizedBox(width: 10),
                    StatBadge(
                      icon: Icons.task_alt_rounded,
                      label: 'Tasks',
                      value: totalTodos.toString(),
                      color: AppTheme.accentColor,
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Search Bar
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: TextField(
                controller: _searchController,
                onChanged: (val) => notesProvider.setSearchQuery(val),
                decoration: InputDecoration(
                  hintText: 'Search title, content, or tasks...',
                  prefixIcon: const Icon(Icons.search_rounded),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded, size: 18),
                          onPressed: () {
                            _searchController.clear();
                            notesProvider.setSearchQuery('');
                          },
                        )
                      : null,
                ),
              ),
            ),
          ),

          // Category Chips Horizontal Bar
          SliverToBoxAdapter(
            child: Container(
              height: 48,
              margin: const EdgeInsets.symmetric(vertical: 4),
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                scrollDirection: Axis.horizontal,
                itemCount: NoteCategory.values.length,
                itemBuilder: (ctx, index) {
                  final cat = NoteCategory.values[index];
                  final isSelected = notesProvider.selectedCategory == cat;
                  return CategoryChip(
                    category: cat,
                    isSelected: isSelected,
                    onSelected: () => notesProvider.setSelectedCategory(cat),
                  );
                },
              ),
            ),
          ),

          // Pinned Notes Section (only if pinned notes exist and no search active)
          if (pinnedNotes.isNotEmpty && notesProvider.searchQuery.isEmpty) ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(left: 20, right: 20, top: 12, bottom: 6),
                child: Row(
                  children: [
                    const Icon(Icons.push_pin_rounded, size: 16, color: AppTheme.primaryColor),
                    const SizedBox(width: 6),
                    const Text(
                      'Pinned Notes',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '(${pinnedNotes.length})',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? Colors.white54 : Colors.black45,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (ctx, index) => NoteCard(
                    note: pinnedNotes[index],
                    onTap: () => _openNoteEditor(pinnedNotes[index]),
                  ),
                  childCount: pinnedNotes.length,
                ),
              ),
            ),
          ],

          // Section Header for All / Filtered Notes
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(left: 20, right: 20, top: 16, bottom: 6),
              child: Row(
                children: [
                  Text(
                    notesProvider.searchQuery.isNotEmpty
                        ? 'Search Results (${filteredNotes.length})'
                        : 'Recent & All Notes',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                  ),
                  const Spacer(),
                  Text(
                    notesProvider.currentSortOption.displayName,
                    style: TextStyle(
                      fontSize: 11,
                      color: isDark ? Colors.white54 : Colors.black45,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Filtered Notes List or Empty State
          if (notesProvider.isLoading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator()),
            )
          else if (filteredNotes.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: EmptyStateWidget(
                icon: notesProvider.searchQuery.isNotEmpty
                    ? Icons.search_off_rounded
                    : Icons.note_add_rounded,
                title: notesProvider.searchQuery.isNotEmpty
                    ? 'No matching notes found'
                    : 'No notes yet',
                message: notesProvider.searchQuery.isNotEmpty
                    ? 'Try searching with another keyword or change your category filter.'
                    : 'Capture your thoughts, ideas, study points, and to-do lists.',
                buttonText:
                    notesProvider.searchQuery.isEmpty ? 'Create First Note' : null,
                onButtonPressed: () => _openNoteEditor(),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (ctx, index) {
                    final note = filteredNotes[index];
                    return NoteCard(
                      note: note,
                      onTap: () => _openNoteEditor(note),
                    );
                  },
                  childCount: filteredNotes.length,
                ),
              ),
            ),

          const SliverToBoxAdapter(
            child: SizedBox(height: 80), // Padding for FAB and Bottom Bar
          ),
        ],
      ),
    );
  }
}
