import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_app/console.dart';
import 'package:flutter_app/highlighter.dart';
import 'package:flutter_app/shared_prefs.dart';
import 'package:flutter_app/sql_query_edit.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

class QueryHistoryView extends HookWidget {
  final String consoleId;

  const QueryHistoryView(this.consoleId, {super.key});

  @override
  Widget build(BuildContext context) {
    final (history, setHistory) = useJsonPreference(
      'console_$consoleId',
      <ConsoleHistoryItem>[],
      fromJson: (json) => (json as List)
          .map((item) => ConsoleHistoryItem.fromJson(item))
          .toList(),
      toJson: (items) =>
          jsonEncode(items.map((item) => item.toJson()).toList()),
    );

    final newQuery = useState<String>('');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 300,
          child: Row(
            children: [
              Expanded(
                flex: 1,
                child: ListView.separated(
                  itemCount: history.length,
                  itemBuilder: (_, index) => _HistoryItemView(history[index]),
                  separatorBuilder: (context, index) => Divider(thickness: 1),
                ),
              ),
              Expanded(
                flex: 1,
                child: SQLQueryEditor(
                  query: newQuery.value,
                  onQueryChanged: (v) => newQuery.value = v,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _HistoryItemView extends HookWidget {
  final ConsoleHistoryItem item;

  const _HistoryItemView(this.item, {super.key});

  @override
  Widget build(BuildContext context) {
    final highlighter = useHighlighter();
    final text =
        highlighter?.highlight(item.query) ?? TextSpan(text: item.query);

    return Container(
      padding: const EdgeInsets.all(8.0),
      child: SelectableText.rich(
        text,
        onTap: () {
          // Handle tap on the history item, e.g., re-execute the query
        },
      ),
    );
  }
}
