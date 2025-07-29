import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_app/console_view.dart';
import 'package:flutter_app/drag_handle.dart';
import 'package:flutter_app/query.dart';
import 'package:flutter_app/record_browser.dart';
import 'package:flutter_app/section_nav.dart';
import 'package:flutter_app/shared_prefs.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:lazy_load_indexed_stack/lazy_load_indexed_stack.dart';

import 'nav_item.dart';
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
      title: 'SQLite viewer',
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
      home: const MyHomePage(title: 'Home page'),
      themeMode: ThemeMode.system,
    );
  }
}

const _minNavColumnWidth = 150.0;
const _maxNavColumnWidth = 600.0;

const _defaultConsole = NavItem.console(name: "default");

class MyHomePage extends HookWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    final endpoint = kIsWeb
        ? Uri.base.resolveUri(Uri.parse('/'))
        : Uri.parse("http://192.168.8.236:3000");

    final results = useSingleQuery(
      endpoint,
      ConditionalSQLQuery(
        sql:
            "SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') ORDER BY type, name",
        params: [],
      ),
    );

    final navItems = useMemoized(() {
      if (results.error != null) {
        return <NavItem>[_defaultConsole];
      }
      final data = results.data;
      if (data == null) {
        return <NavItem>[_defaultConsole];
      }
      return [
        _defaultConsole,
        ...data.rows
            .map((row) {
              final name = row[0] as String;
              final type = row[1] as String;
              switch (type) {
                case 'table':
                  return NavItem.table(name: name);
                case 'view':
                  return NavItem.view(name: name);
                default:
                  throw Exception('Unknown type: $type');
              }
            })
            .toList(growable: false),
      ];
    }, [results.data, results.error]);

    final selectedNavItemId = useState<NavItem?>(null);
    final selectedNavItemIndex = useMemoized(() {
      if (selectedNavItemId.value == null) {
        return -1;
      }
      return navItems.indexWhere(
        (item) => item.id == selectedNavItemId.value!.id,
      );
    }, [navItems, selectedNavItemId.value]);
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
                navItems: navItems,
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
                child: selectedNavItemIndex < 0
                    ? const Center(
                        child: Text('Select an item from the navigation panel'),
                      )
                    : LazyLoadIndexedStack(
                        index: selectedNavItemIndex,
                        children: navItems
                            .mapIndexed<Widget>((index, item) {
                              final child = switch (item) {
                                NavItemTable(name: final name) => RecordBrowser(
                                  endpoint: endpoint,
                                  queryInfo: TableRecordQueryInfo(name),
                                  onRunInConsole: (query) {},
                                ),
                                NavItemView(name: final name) => RecordBrowser(
                                  endpoint: endpoint,
                                  queryInfo: TableRecordQueryInfo(name),
                                  onRunInConsole: (query) {},
                                ),
                                NavItemConsole(name: final name) =>
                                  QueryHistoryView(name, endpoint: endpoint),

                                NavItem() => throw Exception(
                                  'Unknown NavItem type: $item',
                                ),
                              };

                              return Offstage(
                                offstage: index != selectedNavItemIndex,
                                child: child,
                              );
                            })
                            .toList(growable: false),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
