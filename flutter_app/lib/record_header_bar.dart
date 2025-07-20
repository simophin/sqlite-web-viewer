import 'package:flutter/material.dart';
import 'package:flutter_app/highlighter.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

class RecordHeaderBar extends HookWidget {
  final TextEditingController whereClause;
  final TextEditingController orderByClause;
  final List<String> columns;

  final void Function() onSubmitted;

  const RecordHeaderBar({
    super.key,
    required this.whereClause,
    required this.orderByClause,
    required this.onSubmitted,
    required this.columns,
  });

  @override
  Widget build(BuildContext context) {
    useListenable(whereClause);
    useListenable(orderByClause);

    final highlighter = useHighlighter();
    useEffect(() {
      if (whereClause is SQLEditingController) {
        (whereClause as SQLEditingController).highlighter = highlighter;
      }

      if (orderByClause is SQLEditingController) {
        (orderByClause as SQLEditingController).highlighter = highlighter;
      }
    }, [highlighter, whereClause, orderByClause]);

    final theme = Theme.of(context);
    final whereColor = whereClause.text.isEmpty
        ? theme.colorScheme.onSurface.withAlpha(130)
        : theme.colorScheme.onSurface;
    final orderByColor = orderByClause.text.isEmpty
        ? theme.colorScheme.onSurface.withAlpha(130)
        : theme.colorScheme.onSurface;

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainer,
        border: Border.all(color: theme.colorScheme.outlineVariant, width: 1.0),
      ),
      child: Row(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4),
            child: Icon(Icons.filter_alt_outlined, size: 16, color: whereColor),
          ),
          Text(
            'WHERE',
            style: theme.textTheme.labelMedium!.copyWith(color: whereColor),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: Autocomplete(
              optionsBuilder: (value) async {
                return <String>[];
              },
              child: TextField(
                controller: whereClause,
                style: theme.textTheme.labelMedium,
                maxLines: 1,
                onSubmitted: (_) => onSubmitted(),
                // Disable decoration
                decoration: const InputDecoration(
                  border: InputBorder.none,
                  isDense: true,
                ),
              ),
            ),
          ),
          Visibility(
            visible: whereClause.text.isNotEmpty,
            maintainSize: true,
            maintainAnimation: true,
            maintainState: true,
            child: IconButton(
              onPressed: () {
                whereClause.clear();
                onSubmitted();
              },
              visualDensity: VisualDensity.compact,
              padding: const EdgeInsets.all(0),
              icon: const Icon(Icons.clear, size: 16),
            ),
          ),
          const SizedBox(width: 4),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 4),
            child: Icon(Icons.reorder_outlined, size: 16, color: orderByColor),
          ),
          Text(
            'ORDER BY',
            style: theme.textTheme.labelMedium!.copyWith(color: orderByColor),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: TextField(
              controller: orderByClause,
              style: theme.textTheme.labelMedium,
              maxLines: 1,
              onSubmitted: (_) => onSubmitted(),
              // Disable decoration
              decoration: const InputDecoration(
                border: InputBorder.none,
                isDense: true,
              ),
            ),
          ),
          Visibility(
            visible: orderByClause.text.isNotEmpty,
            maintainSize: true,
            maintainAnimation: true,
            maintainState: true,
            child: IconButton(
              onPressed: () {
                orderByClause.clear();
                onSubmitted();
              },
              visualDensity: VisualDensity.compact,
              padding: const EdgeInsets.all(0),
              icon: const Icon(Icons.clear, size: 16),
            ),
          ),
        ],
      ),
    );
  }
}
