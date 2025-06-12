import 'package:flutter/material.dart';
import 'package:flutter_app/query.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'section_nav.freezed.dart';
part 'section_nav.g.dart';

@freezed
abstract class NavItem with _$NavItem {
  const NavItem._();
  const factory NavItem.table({required String name}) = NavItemTable;
  const factory NavItem.view({required String name}) = NavItemView;
  const factory NavItem.console({required String id}) = NavItemConsole;

  factory NavItem.fromJson(Map<String, dynamic> json) =>
      _$NavItemFromJson(json);

  String get id {
    return switch (this) {
      NavItemTable(name: final name) => name,
      NavItemView(name: final name) => name,
      NavItemConsole(id: final id) => id,
      _ => throw Exception('Unknown NavItem type: $this'),
    };
  }
}

class SectionNav extends HookWidget {
  final Uri endpoint;
  final NavItem? selectedItem;
  final void Function(NavItem item)? onItemSelected;

  const SectionNav({
    super.key,
    required this.endpoint,
    this.selectedItem,
    this.onItemSelected,
  });

  @override
  Widget build(BuildContext context) {
    final results = useSingleQuery(
      endpoint,
      SQLQuery(
        sql:
            "SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') ORDER BY type, name",
        params: [],
      ),
    );

    if (results.error != null) {
      return Center(
        child: Text(
          'Error: ${results.error}',
          style: const TextStyle(color: Colors.red),
        ),
      );
    }

    var data = results.data;
    if (data == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final children = data.rows
        .fold(<(String, List<Widget>)>[], (acc, row) {
          final String groupLabel, label;
          final NavItem navItem;
          switch (row[1].toString()) {
            case 'table':
              groupLabel = 'Tables';
              label = row[0].toString();
              navItem = NavItem.table(name: label);
            case 'view':
              groupLabel = 'Views';
              label = row[0].toString();
              navItem = NavItem.view(name: label);
            default:
              throw Exception('Unknown type in sqlite_master: ${row[1]}');
          }

          final itemWidget = ListTile(
            title: Text(label),
            selected: selectedItem == navItem,
            onTap: () => onItemSelected?.call(navItem),
            titleTextStyle: Theme.of(context).textTheme.bodyMedium,
            selectedTileColor: Theme.of(context).colorScheme.primaryContainer,
            selectedColor: Theme.of(context).colorScheme.onPrimaryContainer,
            visualDensity: VisualDensity(
              vertical: VisualDensity.minimumDensity,
            ),
          );

          if (acc.lastOrNull?.$1 != groupLabel) {
            acc.add((groupLabel, [itemWidget]));
          } else {
            acc.last.$2.add(itemWidget);
          }

          return acc;
        })
        .expand((i) {
          final (label, items) = i;
          return <Widget>[
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 8.0),
              child: Text(label, style: Theme.of(context).textTheme.labelMedium),
            ),
            ...items
          ];
        })
        .toList();

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }
}
