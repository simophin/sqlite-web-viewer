import 'package:flutter/material.dart';
import 'package:flutter_app/cell_value.dart';
import 'package:flutter_app/query.dart';
import 'package:flutter_app/record_table.dart';
import 'package:flutter_app/value_display.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

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
  }) {
    final queries = <SQLQuery>[];
    int? columnMetaQueryIndex;
    int? countQueryIndex;

    if (queryInfo.canPaginate) {
      countQueryIndex = queries.length;
      queries.add(queryInfo.query(forCount: true));
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

  const RecordBrowser({
    super.key,
    required this.endpoint,
    required this.queryInfo,
  });

  @override
  Widget build(BuildContext context) {
    final pageIndex = useState(0);
    final pageSize = useState(100);
    final results = useQueries(
      endpoint,
      _QueryInfoRequestProvider.fromQueryInfo(
        queryInfo,
        currentPageIndex: pageIndex.value,
        pageSize: pageSize.value,
      ),
    );
    final selectedCell = useState<Cell?>(null);

    useEffect(() => selectedCell.value = null, [queryInfo]);

    if (results.hasError) {
      return Center(child: Text('Error: ${results.error}'));
    }

    final data = results.data;

    if (data == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final countQueryIndex = data.request.countQueryIndex;
    final totalRecordCount = countQueryIndex != null
        ? data.data.results[countQueryIndex].rows.first.first as int
        : 0;

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

    final selectedCellValue =
        selectedCell.value != null &&
            selectedCell.value!.rowIndex < mainResults.rows.length &&
            selectedCell.value!.columnIndex < mainResults.columns.length
        ? mainResults.rows[selectedCell.value!.rowIndex][selectedCell
              .value!
              .columnIndex]
        : null;

    final selectedColumnMeta = selectedCell.value != null
        ? columnMetas[mainResults.columns[selectedCell.value!.columnIndex].name]
        : null;

    var themeData = Theme.of(context);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Expanded(
          child: RecordTable(
            columns: mainResults.columns.map((x) => x.name).toList(),
            primaryKeyColumns: primaryKeys,
            rowCount: mainResults.rows.length,
            textStyle: themeData.textTheme.bodySmall!,
            selectedCell: selectedCell.value,
            onCellSelected: (cell) => selectedCell.value = cell,
            cellValue: (ctx, rowIndex, columnIndex) {
              final cellValue = mainResults.rows[rowIndex][columnIndex];
              return formatCellValue(cellValue, theme: themeData);
            },
          ),
        ),
        if (selectedCellValue != null) ...[
          const SizedBox(width: 8.0),
          Container(
            width: 300,
            decoration: BoxDecoration(
              color: themeData.colorScheme.surfaceContainerLow,
              border: Border.all(color: themeData.colorScheme.outlineVariant),
              borderRadius: BorderRadius.circular(8.0),
            ),
            child: _ValueDisplayPanel(
              value: selectedCellValue,
              metadata: selectedColumnMeta ?? [],
              columnName:
                  mainResults.columns[selectedCell.value!.columnIndex].name,
            ),
          ),
        ],
      ],
    );
  }
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
            return _ColumnMetaRow(
              label: meta.label,
              value: meta.value,
            );
          } else {
            throw Exception('Unknown ColumnMeta type: ${meta.runtimeType}');
          }
        }),

        // Value display row
        _ColumnMetaRow(label: 'Value', value: ''),

        Padding(
          padding: const EdgeInsets.all(8.0),
          child: ValueDisplay(value),
        ),
      ],
    );
  }
}

class _ColumnMetaRow extends HookWidget {
  final String label;
  final String value;

  const _ColumnMetaRow({
    super.key,
    required this.label,
    required this.value,
  });

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
