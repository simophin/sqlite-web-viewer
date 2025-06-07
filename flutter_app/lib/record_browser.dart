import 'package:flutter/material.dart';
import 'package:flutter/src/widgets/framework.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_app/query.dart';
import 'package:flutter_app/record_table.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:syncfusion_flutter_datagrid/datagrid.dart';

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
  const RecordBrowser({
    super.key,
    required this.endpoint,
    required this.queryInfo,
  });

  final Uri endpoint;
  final RecordQueryInfo queryInfo;

  @override
  Widget build(BuildContext context) {
    final pageIndex = useState(0);
    final pageSize = useState(200);
    final results = useQueries(
      endpoint,
      _QueryInfoRequestProvider.fromQueryInfo(
        queryInfo,
        currentPageIndex: pageIndex.value,
        pageSize: pageSize.value,
      ),
    );

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

    return RecordTable(
      columns: mainResults.columns.map((x) => x.name).toList(),
      rowCount: mainResults.rows.length,
      cellBuilder: (ctx, rowIndex, columnIndex) {
        final cellValue = mainResults.rows[rowIndex][columnIndex];
        return Center(
          child: Text(
            cellValue?.toString() ?? '',
            overflow: TextOverflow.ellipsis,
          ),
        );
      },
    );
  }
}
