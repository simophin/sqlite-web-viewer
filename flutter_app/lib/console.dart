
import 'package:freezed_annotation/freezed_annotation.dart';

part 'console.freezed.dart';
part 'console.g.dart';

@freezed
abstract class ConsoleItem with _$ConsoleItem {
  const factory ConsoleItem({
    required String id,
    required String name,
  }) = _ConsoleItem;

  factory ConsoleItem.fromJson(Map<String, dynamic> json) =>
      _$ConsoleItemFromJson(json);
}

@freezed
abstract class ConsoleHistoryItem with _$ConsoleHistoryItem {
  const factory ConsoleHistoryItem({
    required String id,
    required String query,
    required DateTime timestamp,
  }) = _ConsoleHistoryItem;

  factory ConsoleHistoryItem.fromJson(Map<String, dynamic> json) =>
      _$ConsoleHistoryItemFromJson(json);
}