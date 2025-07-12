import 'package:freezed_annotation/freezed_annotation.dart';

part 'nav_item.freezed.dart';

part 'nav_item.g.dart';

@freezed
abstract class NavItem with _$NavItem {
  const NavItem._();

  const factory NavItem.table({required String name}) = NavItemTable;

  const factory NavItem.view({required String name}) = NavItemView;

  const factory NavItem.console({required String name}) = NavItemConsole;

  factory NavItem.fromJson(Map<String, dynamic> json) =>
      _$NavItemFromJson(json);

  String get id {
    return switch (this) {
      NavItemTable(name: final name) => name,
      NavItemView(name: final name) => name,
      NavItemConsole(name: final name) => name,
      _ => throw Exception('Unknown NavItem type: $this'),
    };
  }
}
