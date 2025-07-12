import 'package:flutter/material.dart';
import 'package:flutter_app/console.dart';
import 'package:flutter_app/highlighter.dart';
import 'package:flutter_app/query.dart';
import 'package:flutter_app/record_browser.dart';
import 'package:flutter_app/record_query_info.dart';
import 'package:flutter_app/shared_prefs.dart';
import 'package:flutter_app/sql_query_edit.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:uuid/uuid.dart';

class QueryHistoryView extends HookWidget {
  final Uri endpoint;
  final String consoleId;

  const QueryHistoryView(this.consoleId, {super.key, required this.endpoint});

  @override
  Widget build(BuildContext context) {
    useAutomaticKeepAlive();

    final history = usePreference<List<ConsoleHistoryItem>>(
      'console_$consoleId',
      [],
      jsonCodec: (
        (json) => (json as List)
            .map((item) => ConsoleHistoryItem.fromJson(item))
            .toList(),
        (items) => items.map((item) => item.toJson()).toList(),
      ),
    );

    final draft = usePreference<TextEditingValue>(
      'console_${consoleId}_draft',
      TextEditingValue(),
      jsonCodec: (
        (json) => TextEditingValue.fromJSON(json),
        (value) => value.toJSON(),
      ),
    );

    final currentQuery = useState<SingleSQLQueryInfo?>(null);
    final currentQueryManuallyTyped = useRef(true);

    final onRunTapped = useCallback(() async {
      currentQuery.value = SingleSQLQueryInfo(
        SQLQuery(sql: draft.value.text, params: []),
      );

      if (!currentQueryManuallyTyped.value) {
        history.value = [
          ...history.value,
          ConsoleHistoryItem(
            id: Uuid().v4(),
            query: draft.value.text,
            timestamp: DateTime.now(),
          ),
        ];
      }

      currentQueryManuallyTyped.value = true;
    }, []);

    final onHistoryItemTapped = useCallback((ConsoleHistoryItem item) {
      draft.value = TextEditingValue(text: item.query);
      currentQuery.value = SingleSQLQueryInfo(
        SQLQuery(sql: item.query, params: []),
      );
      currentQueryManuallyTyped.value = false;
    }, [draft]);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 200,
          child: Row(
            children: [
              Expanded(
                flex: 1,
                child: SQLQueryEditor(
                  query: draft.value,
                  onQueryChanged: (value) => draft.value = value,
                  onClearTapped: () => draft.value = const TextEditingValue(),
                  onRunTapped: onRunTapped,
                ),
              ),
              const SizedBox(width: 8.0),
              Expanded(
                flex: 1,
                child: ListView.separated(
                  itemCount: history.value.length,
                  itemBuilder: (_, index) => _HistoryItemView(
                    history.value[index],
                    onTap: onHistoryItemTapped,
                  ),
                  separatorBuilder: (context, index) =>
                      Divider(thickness: 1, height: 1),
                ),
              ),
            ],
          ),
        ),
        if (currentQuery.value != null) ...[
          const SizedBox(height: 8.0),
          Expanded(
            child: RecordBrowser(
              endpoint: endpoint,
              queryInfo: currentQuery.value!,
            ),
          ),
        ],
      ],
    );
  }
}

class _HistoryItemView extends HookWidget {
  final ConsoleHistoryItem item;
  final void Function(ConsoleHistoryItem) onTap;

  const _HistoryItemView(this.item, {required this.onTap});

  @override
  Widget build(BuildContext context) {
    final highlighter = useHighlighter();
    final text =
        highlighter?.highlight(item.query) ?? TextSpan(text: item.query);

    return ListTile(
      title: Text.rich(text, style: Theme.of(context).textTheme.bodyMedium),
      subtitle: Text(
        item.timestamp.toLocal().toIso8601String(),
        style: Theme.of(context).textTheme.bodySmall,
      ),
      visualDensity: VisualDensity.compact,
      onTap: () => onTap(item),
    );
  }
}
