import 'dart:convert';

import 'package:flutter/widgets.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:http/http.dart' as http;

part 'query.freezed.dart';
part 'query.g.dart';

@freezed
abstract class SQLQuery with _$SQLQuery {
  const factory SQLQuery({required String sql, required List<String> params}) =
      _SQLQuery;

  factory SQLQuery.fromJson(Map<String, dynamic> json) =>
      _$SQLQueryFromJson(json);
}

@freezed
abstract class ConditionalSQLQuery with _$ConditionalSQLQuery {
  const factory ConditionalSQLQuery({
    required String sql,
    required List<String> params,
    Map<String, SQLQuery>? conditions,
  }) = _ConditionalSQLQuery;

  factory ConditionalSQLQuery.fromJson(Map<String, dynamic> json) =>
      _$ConditionalSQLQueryFromJson(json);
}

@freezed
abstract class Request with _$Request {
  const factory Request({
    @JsonKey(name: 'run_in_transaction') required bool runInTransaction,
    required List<ConditionalSQLQuery> queries,
  }) = _Request;

  factory Request.fromJson(Map<String, dynamic> json) =>
      _$RequestFromJson(json);
}

@freezed
abstract class ColumnInfo with _$ColumnInfo {
  const factory ColumnInfo({required String name}) = _ColumnInfo;

  factory ColumnInfo.fromJson(Map<String, dynamic> json) =>
      _$ColumnInfoFromJson(json);
}

@freezed
abstract class QueryResult with _$QueryResult {
  const factory QueryResult({
    @JsonKey(name: 'num_affected') required int numAffected,
    required List<ColumnInfo> columns,
    required List<List<dynamic>> rows,
  }) = _QueryResult;

  factory QueryResult.fromJson(Map<String, dynamic> json) =>
      _$QueryResultFromJson(json);
}

@freezed
abstract class QueryResults with _$QueryResults {
  const factory QueryResults({
    required List<QueryResult> results,
    @JsonKey(name: 'execution_time_us') required int executionTimeUs,
  }) = _QueryResults;

  factory QueryResults.fromJson(Map<String, dynamic> json) =>
      _$QueryResultsFromJson(json);
}

Future<QueryResults> fetchQueryResults(Uri uri, Request request) async {
  final resp = await http.post(
    uri.resolve('query'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode(request.toJson()),
  );

  if (resp.statusCode != 200) {
    throw Exception(
      'Failed to fetch query results: ${resp.statusCode}: ${resp.body}',
    );
  }

  return QueryResults.fromJson(jsonDecode(resp.body));
}

abstract class RequestProvider {
  Request get request;
}

@freezed
abstract class UseQueryResults<T> with _$UseQueryResults<T> {
  const factory UseQueryResults({
    required QueryResults data,
    required T request,
    required DateTime timestamp,
  }) = _UseQueryResults;
}

AsyncSnapshot<UseQueryResults<T>> useQueries<T extends RequestProvider>(
  Uri uri,
  T request, {
  List<Object> deps = const [],
}) {
  final realRequest = request.request;
  final fut = useMemoized(() async {
    return UseQueryResults(
      data: await fetchQueryResults(uri, realRequest),
      request: request,
      timestamp: DateTime.now(),
    );
  }, [uri, realRequest, ...deps]);

  return useFuture(fut);
}

AsyncSnapshot<QueryResult> useSingleQuery(Uri uri, ConditionalSQLQuery query) {
  final fut = useMemoized(() async {
    return (await fetchQueryResults(
      uri,
      Request(queries: [query], runInTransaction: false),
    )).results.first;
  }, [uri, query]);

  return useFuture(fut);
}
