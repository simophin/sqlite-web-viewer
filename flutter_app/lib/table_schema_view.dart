import 'package:flutter/material.dart';
import 'package:flutter_app/highlighter.dart';
import 'package:flutter_app/query.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

class TableSchemaView extends HookWidget {
  final Uri endpoint;
  final String tableName;

  const TableSchemaView({
    super.key,
    required this.endpoint,
    required this.tableName,
  });

  @override
  Widget build(BuildContext context) {
    final result = useSingleQuery(
      endpoint,
      ConditionalSQLQuery(
        sql:
            "SELECT sql FROM sqlite_master WHERE type IN ('table', 'view') AND name = ?",
        params: [tableName],
      ),
    );

    if (result.hasError) {
      return Center(
        child: Text(
          'Error: ${result.error}',
          style: TextStyle(color: Theme.of(context).colorScheme.error),
        ),
      );
    }

    if (!result.hasData) {
      return Center(child: CircularProgressIndicator());
    }

    final highlighter = useHighlighter();
    final sql = result.data?.rows.firstOrNull?[0] as String?;

    if (sql == null) {
      return Center(child: Text('No schema found for table: $tableName'));
    }

    final highlightedText = highlighter?.highlight(sql) ?? TextSpan(text: sql);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: SelectableText.rich(
        highlightedText,
        style: TextStyle(
          fontFamily: 'Courier New',
          fontSize: 14.0,
          color: Theme.of(context).colorScheme.onSurface,
        ),
      ),
    );
  }
}
