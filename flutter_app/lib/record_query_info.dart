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

abstract class RecordQueryInfo {
  bool get canPaginate;
  bool get canSort;
  SQLQuery? get primaryKeyQuery;
  SQLQuery query({Pagination? pagination, List<Sort>? sorts, bool? forCount});
}

class TableRecordQueryInfo extends RecordQueryInfo {
  final String tableName;

  TableRecordQueryInfo(this.tableName);

  @override
  bool get canPaginate => true;

  @override
  bool get canSort => true;

  @override
  SQLQuery? get primaryKeyQuery {
    // Assuming the primary key is always the first column in the table
    return SQLQuery(
      sql: "SELECT name FROM pragma_table_xinfo(?) WHERE pk > 0 ORDER BY pk ",
      params: [tableName],
    );
  }

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
