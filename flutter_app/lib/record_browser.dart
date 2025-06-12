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
    int? primaryKeyQueryIndex,
    int? countQueryIndex,
    required int mainQueryIndex,
  }) = _$_QueryInfoRequestProvider;

  factory _QueryInfoRequestProvider.fromQueryInfo(
    RecordQueryInfo queryInfo, {
    required int currentPageIndex,
    required int pageSize,
  }) {
    final queries = <SQLQuery>[];
    int? primaryKeyQueryIndex;
    int? countQueryIndex;

    if (queryInfo.canPaginate) {
      countQueryIndex = queries.length;
      queries.add(queryInfo.query(forCount: true));
    }

    final primaryKeyQuery = queryInfo.primaryKeyQuery;
    if (primaryKeyQuery != null) {
      primaryKeyQueryIndex = queries.length;
      queries.add(primaryKeyQuery);
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
      primaryKeyQueryIndex: primaryKeyQueryIndex,
      countQueryIndex: countQueryIndex,
      mainQueryIndex: mainQueryIndex,
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
    final primaryKeys = data.request.primaryKeyQueryIndex != null
        ? data.data.results[data.request.primaryKeyQueryIndex!].rows
              .map((x) => x.first as String)
              .toList(growable: false)
        : <String>[];

    final selectedCellValue =
        selectedCell.value != null &&
            selectedCell.value!.rowIndex < mainResults.rows.length &&
            selectedCell.value!.columnIndex < mainResults.columns.length
        ? mainResults.rows[selectedCell.value!.rowIndex][selectedCell
              .value!
              .columnIndex]
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
            decoration: BoxDecoration(color: themeData.colorScheme.surfaceContainerLow),
            child: ValueDisplay(selectedCellValue),
          )],
      ],
    );
  }
}
