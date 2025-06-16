import 'package:flutter/material.dart';
import 'package:flutter_app/console_view.dart';
import 'package:flutter_app/drag_handle.dart';
import 'package:flutter_app/record_browser.dart';
import 'package:flutter_app/section_nav.dart';
import 'package:flutter_app/shared_prefs.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

import 'record_query_info.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    var seedColor = Colors.amber;
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: seedColor),
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: seedColor,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
        brightness: Brightness.dark,
      ),
      home: const MyHomePage(title: 'Flutter Demo Home Page'),
      themeMode: ThemeMode.system,
    );
  }
}

const _minNavColumnWidth = 150.0;
const _maxNavColumnWidth = 600.0;

class MyHomePage extends HookWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    final endpoint = Uri.parse("http://localhost:3000");
    final selectedNavItemId = useState<NavItem?>(null);
    final onItemSelected = useCallback((NavItem item) {
      selectedNavItemId.value = item;
    }, [selectedNavItemId]);
    final navColumnWidth = usePreference('nav_column_width', 300.0);
    return Scaffold(
      body: SizedBox.expand(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            SizedBox(
              width: navColumnWidth.value,
              child: SectionNav(
                endpoint: endpoint,
                selectedItem: selectedNavItemId.value,
                onItemSelected: onItemSelected,
              ),
            ),
            DraggingDivider(
              onDragMoved: (dx) {
                navColumnWidth.value = (navColumnWidth.value + dx).clamp(
                  _minNavColumnWidth,
                  _maxNavColumnWidth,
                );
                return true;
              },
            ),
            Expanded(
              flex: 1,
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: switch (selectedNavItemId.value) {
                  NavItemTable(name: final name) => RecordBrowser(
                    endpoint: endpoint,
                    queryInfo: TableRecordQueryInfo(name),
                  ),
                  NavItemView(name: final name) => RecordBrowser(
                    endpoint: endpoint,
                    queryInfo: TableRecordQueryInfo(name),
                  ),
                  NavItemConsole(id: final id) => QueryHistoryView(
                    id,
                    endpoint: endpoint,
                  ),
                  _ => const Text('No item selected'),
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
