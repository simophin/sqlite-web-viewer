import 'package:flutter/material.dart';
import 'package:flutter_app/query.dart';
import 'package:flutter_app/record_browser.dart';
import 'package:flutter_app/record_query_info.dart';
import 'package:flutter_app/table_schema_view.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

class TableView extends HookWidget {
  final Uri endpoint;
  final String tableName;
  final void Function(SQLQuery)? onRunInConsole;

  const TableView({
    super.key,
    required this.endpoint,
    required this.tableName,
    this.onRunInConsole,
  });

  @override
  Widget build(BuildContext context) {
    final selectedPage = useState(0);
    final pageController = usePageController();

    useEffect(() {
      if (pageController.hasClients) {
        pageController.animateToPage(
          selectedPage.value,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
        );
      }

      return null;
    }, [selectedPage.value]);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SegmentedButton(
          segments: [
            ButtonSegment(
              value: 0,
              label: Text('Records'),
              icon: Icon(Icons.table_chart),
              tooltip: 'View records in the table',
            ),
            ButtonSegment(
              value: 1,
              label: Text('Schema'),
              icon: Icon(Icons.code),
              tooltip: 'View table schema as SQL',
            ),
          ],
          selected: <int>{selectedPage.value},
          multiSelectionEnabled: false,
          onSelectionChanged: (v) => selectedPage.value = v.first,
          emptySelectionAllowed: false,
          showSelectedIcon: false,
        ),

        const SizedBox(height: 8.0),

        Expanded(
          child: PageView(
            controller: pageController,
            children: [
              RecordBrowser(
                endpoint: endpoint,
                queryInfo: TableRecordQueryInfo(tableName),
              ),
              TableSchemaView(endpoint: endpoint, tableName: tableName),
            ],
          ),
        ),
      ],
    );
  }
}
