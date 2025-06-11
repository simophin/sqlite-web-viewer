import 'package:flutter/material.dart';
import 'package:flutter_app/record_browser.dart';
import 'package:flutter_app/section_nav.dart';
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

class MyHomePage extends HookWidget {
  const MyHomePage({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    final endpoint = Uri.parse("http://localhost:3000");
    final selectedNavItemId = useState<NavItem?>(null);
    final onItemSelected = useCallback(
      (NavItem item) {
        selectedNavItemId.value = item;
      },
      [selectedNavItemId],
    );

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(title),
      ),
      body: SizedBox.expand(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            SizedBox(
              width: 300,
              child: SectionNav(
                endpoint: endpoint,
                selectedItem: selectedNavItemId.value,
                onItemSelected: onItemSelected,
              ),
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
                  _ => const Text('No item selected'),
                },
              ),
            )
          ],
        ),
      ),
    );
  }
}
