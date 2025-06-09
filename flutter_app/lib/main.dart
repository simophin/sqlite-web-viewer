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
    return MaterialApp(
      title: 'Flutter Demo',
      theme: ThemeData(
        // This is the theme of your application.
        //
        // TRY THIS: Try running your application with "flutter run". You'll see
        // the application has a purple toolbar. Then, without quitting the app,
        // try changing the seedColor in the colorScheme below to Colors.green
        // and then invoke "hot reload" (save your changes or press the "hot
        // reload" button in a Flutter-supported IDE, or press "r" if you used
        // the command line to start the app).
        //
        // Notice that the counter didn't reset back to zero; the application
        // state is not lost during the reload. To reset the state, use hot
        // restart instead.
        //
        // This works for code too, not just values: Most code changes can be
        // tested with just a hot reload.
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      darkTheme: ThemeData.dark(useMaterial3: true),
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
                onItemSelected: (id) => selectedNavItemId.value = id,
              ),
            ),
            Expanded(
              flex: 1,
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
          ],
        ),
      ),
    );
  }
}
