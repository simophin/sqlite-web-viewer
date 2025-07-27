import 'package:flutter/material.dart';
import 'package:flutter_app/cell_value.dart';
import 'package:flutter_app/highlighter.dart';
import 'package:flutter_app/pagination_bar.dart';
import 'package:flutter_app/query.dart';
import 'package:flutter_app/record_header_bar.dart';
import 'package:flutter_app/record_table.dart';
import 'package:flutter_app/sql_viewer.dart';
import 'package:flutter_app/value_display.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:intl/intl.dart';

import 'record_query_info.dart';

part 'record_browser.freezed.dart';

@freezed
abstract class _QueryInfoRequestProvider
    with _$QueryInfoRequestProvider
    implements RequestProvider {
  const factory _QueryInfoRequestProvider({
    required Request request,
    int? columnMetaQueryIndex,
    Map<String, List<ColumnMeta>> Function(List<List<dynamic>> rows)?
    columnMetaParser,
    int? countQueryIndex,
    required int mainQueryIndex,
  }) = _$_QueryInfoRequestProvider;

  factory _QueryInfoRequestProvider.fromQueryInfo(
    RecordQueryInfo queryInfo, {
    required int currentPageIndex,
    required int pageSize,
    required List<Sort> sorts,
    String? extraWhereClause,
  }) {
    final queries = <ConditionalSQLQuery>[];
    int? columnMetaQueryIndex;
    int? countQueryIndex;

    if (queryInfo.canPaginate) {
      countQueryIndex = queries.length;
      queries.add(
        queryInfo.query(
          forCount: true,
          sorts: sorts,
          extraWhereClause: extraWhereClause,
        ),
      );
    }

    if (queryInfo.columnMetaQuery != null) {
      columnMetaQueryIndex = queries.length;
      queries.add(queryInfo.columnMetaQuery!.query);
    }

    int mainQueryIndex = queries.length;
    queries.add(
      queryInfo.query(
        pagination: Pagination(
          offset: currentPageIndex * pageSize,
          limit: pageSize,
        ),
        sorts: sorts,
        extraWhereClause: extraWhereClause,
      ),
    );

    return _QueryInfoRequestProvider(
      request: Request(runInTransaction: true, queries: queries),
      columnMetaQueryIndex: columnMetaQueryIndex,
      countQueryIndex: countQueryIndex,
      mainQueryIndex: mainQueryIndex,
      columnMetaParser: queryInfo.columnMetaQuery?.parse,
    );
  }
}

class RecordBrowser extends HookWidget {
  final Uri endpoint;
  final RecordQueryInfo queryInfo;
  final void Function(SQLQuery)? onRunInConsole;

  const RecordBrowser({
    super.key,
    required this.endpoint,
    required this.queryInfo,
    this.onRunInConsole,
  });

  @override
  Widget build(BuildContext context) {
    useAutomaticKeepAlive();

    final pageIndex = useState(0);
    final pageSize = useState(100);
    final manualRefreshAt = useState(0);
    final refresh = useCallback(() {
      manualRefreshAt.value = DateTime.timestamp().millisecondsSinceEpoch;
    }, []);
    final sorts = useState<List<Sort>>([]);
    final extraWhereClause = useState<String?>(null);

    final results = useQueries(
      endpoint,
      _QueryInfoRequestProvider.fromQueryInfo(
        queryInfo,
        currentPageIndex: pageIndex.value,
        pageSize: pageSize.value,
        sorts: sorts.value,
        extraWhereClause: extraWhereClause.value,
      ),
      deps: [manualRefreshAt.value],
    );
    final selectedCell = useState<Cell?>(null);

    useEffect(() => selectedCell.value = null, [queryInfo]);

    final showValueDisplay = useState<bool>(false);

    final whereClauseController = useMemoized(
      () => SQLEditingController.fromValue(TextEditingValue.empty),
      const [],
    );
    final orderByClauseController = useMemoized(
      () => SQLEditingController.fromValue(TextEditingValue.empty),
      const [],
    );

    final Widget recordTable;
    final List<Widget> valueDisplayPanel;

    final data = results.data;
    final themeData = Theme.of(context);

    if (results.hasError) {
      recordTable = Center(child: Text('Error: ${results.error}'));
      valueDisplayPanel = const [];
    } else if (data == null) {
      recordTable = const Center(child: CircularProgressIndicator());
      valueDisplayPanel = const [];
    } else {
      final mainResults = data.data.results[data.request.mainQueryIndex];
      final columnMetas = data.request.columnMetaQueryIndex != null
          ? data.request.columnMetaParser!(
              data.data.results[data.request.columnMetaQueryIndex!].rows,
            )
          : <String, List<ColumnMeta>>{};

      final primaryKeys = columnMetas.entries
          .where(
            (entry) => entry.value.any((meta) => meta is ColumnMetaPrimaryKey),
          )
          .map((entry) => entry.key)
          .toList(growable: false);

      final selectedColumnMeta = selectedCell.value != null
          ? columnMetas[mainResults
                .columns[selectedCell.value!.columnIndex]
                .name]
          : null;

      final selectedCellValue =
          selectedCell.value != null &&
              selectedCell.value!.rowIndex < mainResults.rows.length &&
              selectedCell.value!.columnIndex < mainResults.columns.length
          ? [
              mainResults.rows[selectedCell.value!.rowIndex][selectedCell
                  .value!
                  .columnIndex],
            ]
          : null;

      recordTable = RecordTable(
        columns: mainResults.columns.map((x) => x.name).toList(),
        primaryKeyColumns: primaryKeys,
        rowCount: mainResults.rows.length,
        textStyle: themeData.textTheme.bodySmall!,
        selectedCell: selectedCell.value,
        sorts: sorts.value,
        onSortChanged: queryInfo.canSort
            ? (column, currSort) {
                sorts.value = updateSort(currSort, column, sorts.value);
                orderByClauseController.text = buildOrderByClause(sorts.value);
              }
            : null,
        onCellSelected: (cell) {
          if (selectedCell.value == cell) {
            showValueDisplay.value = !showValueDisplay.value;
          } else {
            showValueDisplay.value = true;
            selectedCell.value = cell;
          }
        },
        cellValue: (ctx, rowIndex, columnIndex) {
          return formatCellValue(
            mainResults.rows[rowIndex][columnIndex],
            theme: themeData,
          );
        },
      );

      valueDisplayPanel = (selectedCellValue != null && showValueDisplay.value)
          ? [
              const SizedBox(width: 8.0),
              Container(
                width: 300,
                decoration: BoxDecoration(
                  color: themeData.colorScheme.surfaceContainerLow,
                  border: Border.all(
                    color: themeData.colorScheme.outlineVariant,
                  ),
                  borderRadius: BorderRadius.circular(8.0),
                ),
                child: _ValueDisplayPanel(
                  value: selectedCellValue[0],
                  metadata: selectedColumnMeta ?? [],
                  columnName:
                      mainResults.columns[selectedCell.value!.columnIndex].name,
                ),
              ),
            ]
          : [];
    }

    final pagination = data?.request.countQueryIndex != null
        ? PaginationBar(
            currentPage: pageIndex.value,
            numPerPage: pageSize.value,
            totalItemCount:
                data!.data.results[data.request.countQueryIndex!].rows[0][0]
                    as int,
            onPageChanged: (newIndex) => pageIndex.value = newIndex,
            onRefresh: refresh,
          )
        : const SizedBox.shrink();

    return Stack(
      children: [
        Positioned.fill(
          child: Column(
            mainAxisSize: MainAxisSize.max,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              RecordHeaderBar(
                whereClause: whereClauseController,
                orderByClause: orderByClauseController,
                onSubmitted: () {
                  extraWhereClause.value = whereClauseController.text.isNotEmpty
                      ? whereClauseController.text
                      : null;

                  sorts.value = _buildSortsFromClause(
                    orderByClauseController.text,
                  );
                },
              ),
              const SizedBox(height: 8),
              Expanded(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(child: recordTable),
                    ...valueDisplayPanel,
                  ],
                ),
              ),
            ],
          ),
        ),
        Container(
          alignment: Alignment.bottomCenter,
          padding: const EdgeInsets.only(bottom: 8),
          child: pagination,
        ),
      ],
    );
  }

  List<Sort> updateSort(
    Sort? currSort,
    String column,
    List<Sort> currentSorts,
  ) {
    final newSort = currSort == null
        ? Sort(column: column, ascending: true)
        : (currSort.ascending ? Sort(column: column, ascending: false) : null);

    final newSorts = currentSorts.toList();
    final existingSortIndex = newSorts.indexWhere(
      (sort) => sort.column == column,
    );

    if (newSort != null && existingSortIndex != -1) {
      // Replace existing sort
      newSorts[existingSortIndex] = newSort;
    } else if (newSort != null) {
      newSorts.add(newSort);
    } else if (existingSortIndex != -1) {
      // Remove existing sort
      newSorts.removeAt(existingSortIndex);
    }
    return newSorts;
  }

  List<Sort> _buildSortsFromClause(String orderByClause) {
    if (orderByClause.isEmpty) return [];
    final sorts = <Sort>[];
    final parts = orderByClause.split(',');
    for (var part in parts) {
      part = part.trim();
      if (part.isEmpty) continue;
      final ascending = !part.endsWith(' DESC');
      final column = ascending
          ? part
          : part.substring(0, part.length - 5).trim();
      sorts.add(Sort(column: column, ascending: ascending));
    }
    return sorts;
  }

  Widget _buildInfoBox(ThemeData themeData, Widget child) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: themeData.colorScheme.surfaceContainerLow,
        border: Border.all(color: themeData.colorScheme.outlineVariant),
        borderRadius: BorderRadius.circular(4),
      ),
      child: child,
    );
  }

  String buildOrderByClause(List<Sort> sorts) {
    if (sorts.isEmpty) return '';
    return sorts
        .map((sort) {
          return '${sort.column}${sort.ascending ? '' : ' DESC'}';
        })
        .join(', ');
  }

  Widget _buildSQLViewBox(
    ThemeData themeData,
    String sql,
    void Function() onRefresh,
    void Function()? onRunInConsole,
  ) {
    return _buildInfoBox(
      themeData,
      Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 200, maxWidth: 500),
            child: SingleChildScrollView(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: SQLViewer(sql: sql),
              ),
            ),
          ),
          const SizedBox(width: 8.0),
          // Refresh button
          IconButton(
            onPressed: onRefresh,
            icon: const Icon(Icons.refresh_outlined),
            iconSize: 16,
            tooltip: 'Refresh',
            visualDensity: VisualDensity.compact,
          ),
          // Run in console button
          if (onRunInConsole != null)
            IconButton(
              onPressed: onRunInConsole,
              icon: const Icon(Icons.play_arrow_outlined),
              iconSize: 16,
              tooltip: 'Run in console',
              visualDensity: VisualDensity.compact,
            ),
        ],
      ),
    );
  }

  Widget _buildQueryInfoBox(
    ThemeData themeData,
    UseQueryResults<_QueryInfoRequestProvider> data,
  ) {
    final countQueryIndex = data.request.countQueryIndex;
    final totalRecordCount = countQueryIndex != null
        ? data.data.results[countQueryIndex].rows.first.first as int
        : 0;

    return _buildInfoBox(
      themeData,
      RichText(
        text: TextSpan(
          text: '',
          style: themeData.textTheme.bodySmall,
          children: [
            TextSpan(
              text: _formatRecordCount(
                data.data.results[data.request.mainQueryIndex].rows.length,
              ),
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const TextSpan(text: ' rows(s) in '),
            TextSpan(
              text: _formatExecutionTime(data.data.executionTimeUs),
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const TextSpan(text: ' at '),
            TextSpan(
              text: _formatLastUpdated(data.timestamp),
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const TextSpan(text: '. Total record(s): '),
            TextSpan(
              text: _formatRecordCount(totalRecordCount),
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const TextSpan(text: '.'),
          ],
        ),
        overflow: TextOverflow.ellipsis,
      ),
    );
  }
}

String _formatRecordCount(int count) {
  return NumberFormat.decimalPattern().format(count);
}

String _formatExecutionTime(int timeUs) {
  if (timeUs < 1_000_000) {
    return '${(timeUs / 1000).toStringAsFixed(2)} ms';
  } else {
    return '${(timeUs / 1_000_000).toStringAsFixed(2)} s';
  }
}

String _formatLastUpdated(DateTime dateTime) {
  return DateFormat.jms().format(dateTime);
}

class _ValueDisplayPanel extends HookWidget {
  final dynamic value;
  final String columnName;
  final List<ColumnMeta> metadata;

  const _ValueDisplayPanel({
    super.key,
    required this.value,
    required this.columnName,
    required this.metadata,
  });

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        _ColumnMetaRow(label: 'Column', value: columnName),
        // Dynamic column metadata rows
        ...metadata.map((meta) {
          if (meta is ColumnMetaPrimaryKey) {
            return _ColumnMetaRow(label: 'Primary key', value: 'Yes');
          } else if (meta is ColumnMetaExtra) {
            return _ColumnMetaRow(label: meta.label, value: meta.value);
          } else {
            throw Exception('Unknown ColumnMeta type: ${meta.runtimeType}');
          }
        }),

        // Value display row
        _ColumnMetaRow(label: 'Value', value: ''),

        Padding(padding: const EdgeInsets.all(8.0), child: ValueDisplay(value)),
      ],
    );
  }
}

class _ColumnMetaRow extends HookWidget {
  final String label;
  final String value;

  const _ColumnMetaRow({super.key, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    var colors = Theme.of(context).colorScheme;
    return Row(
      children: [
        Container(
          color: colors.secondaryContainer,
          padding: const EdgeInsets.all(4.0),
          child: Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(width: 8.0),
        Text(value),
      ],
    );
  }
}
