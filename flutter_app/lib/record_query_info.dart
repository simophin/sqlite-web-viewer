import 'package:flutter_app/query.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'record_query_info.freezed.dart';

@freezed
abstract class Pagination with _$Pagination {
  const factory Pagination({int? offset, required int limit}) = _Pagination;
}

@freezed
abstract class Sort with _$Sort {
  const factory Sort({required String column, required bool ascending}) = _Sort;
}

@freezed
abstract class ColumnMeta with _$ColumnMeta {
  const factory ColumnMeta.primaryKey({required int priority}) =
      ColumnMetaPrimaryKey;

  const factory ColumnMeta.extra({
    required String label,
    required String value,
  }) = ColumnMetaExtra;
}

@freezed
abstract class ColumnMetaQuery with _$ColumnMetaQuery {
  const factory ColumnMetaQuery({
    required SQLQuery query,
    required Map<String, List<ColumnMeta>> Function(List<List<dynamic>> rows)
    parse,
  }) = _ColumnMetaQuery;
}

abstract class RecordQueryInfo {
  bool get canPaginate;

  bool get canSort;

  ColumnMetaQuery? get columnMetaQuery;

  SQLQuery query({Pagination? pagination, List<Sort>? sorts, bool? forCount});
}

class TableRecordQueryInfo implements RecordQueryInfo {
  final String tableName;

  const TableRecordQueryInfo(this.tableName);

  @override
  bool get canPaginate => true;

  @override
  bool get canSort => true;

  @override
  ColumnMetaQuery? get columnMetaQuery => ColumnMetaQuery(
    query: SQLQuery(
      sql:
          "SELECT name, type, `notnull`, dflt_value, pk, (hidden == 2) AS is_generated FROM pragma_table_xinfo(?)",
      params: [tableName],
    ),
    parse: (rows) => Map.fromEntries(
      rows.map((row) {
        var pk = row[4] as int;
        return MapEntry(row[0] as String, [
          if (pk > 0) ColumnMeta.primaryKey(priority: pk),
          ColumnMeta.extra(label: "Data type", value: row[1] as String),
          ColumnMeta.extra(
            label: "Not null",
            value: row[2] == 1 ? "Yes" : "No",
          ),
          ColumnMeta.extra(
            label: "Default value",
            value: row[3] != null ? row[3].toString() : "None",
          ),
          if (row[5] == 1)
            ColumnMeta.extra(label: "Generated column", value: "Yes"),
        ]);
      }),
    ),
  );

  @override
  SQLQuery query({
    Pagination? pagination,
    List<Sort>? sorts,
    bool? forCount = false,
  }) {
    final baseQuery = forCount == true
        ? 'SELECT COUNT(*) FROM $tableName'
        : 'SELECT * FROM $tableName';

    final query = StringBuffer(baseQuery);

    if (sorts != null && sorts.isNotEmpty) {
      query.write(' ORDER BY ');
      query.write(
        sorts
            .map((sort) => '${sort.column} ${sort.ascending ? 'ASC' : 'DESC'}')
            .join(', '),
      );
    }

    if (pagination != null) {
      if (pagination.offset != null) {
        query.write(' LIMIT ${pagination.offset}, ${pagination.limit}');
      } else {
        query.write(' LIMIT ${pagination.limit}');
      }
    }

    return SQLQuery(sql: query.toString(), params: []);
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other.runtimeType != runtimeType) return false;
    return other is TableRecordQueryInfo && other.tableName == tableName;
  }

  @override
  int get hashCode => tableName.hashCode;
}
