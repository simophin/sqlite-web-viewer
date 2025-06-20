import 'package:flutter/material.dart';
import 'package:flutter_app/console.dart';
import 'package:flutter_app/query.dart';
import 'package:flutter_app/shared_prefs.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:uuid/uuid.dart';

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

    final consoles = usePreference<List<ConsoleItem>>(
      'console_list',
      [const ConsoleItem(id: "1", name: "Query console")],
      jsonCodec: (
        (json) =>
            (json as List).map((item) => ConsoleItem.fromJson(item)).toList(),
        (items) => items.map((item) => item.toJson()).toList(),
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

          final itemWidget = _SectionItem(
            label: label,
            selected: selectedItem?.id == navItem.id,
            onTap: () => onItemSelected?.call(navItem),
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
          return <Widget>[_SectionGroupLabel(label: label), ...items];
        })
        .toList();

    final consoleItems = [
      _SectionGroupLabel(label: 'Consoles'),
      ...consoles.value.map((console) {
        return _SectionItem(
          label: console.name,
          selected:
              selectedItem is NavItemConsole &&
              (selectedItem as NavItemConsole).id == console.id,
          onTap: () => onItemSelected?.call(NavItem.console(id: console.id)),
          onRightClicked: (double x, double y) {
            showMenu(
              context: context,
              position: RelativeRect.fromLTRB(x, y, 0, 0),
              items: [
                PopupMenuItem(
                  onTap: () {
                    consoles.value = consoles.value
                        .where((c) => c.id != console.id)
                        .toList();
                  },
                  child: Text('Delete console'),
                ),
              ],
            );
          },
        );
      }),
      _SectionItem(
        label: 'New console',
        trailingIcon: Icons.add,
        selected: false,
        onTap: () {
          consoles.value = [
            ...consoles.value,
            ConsoleItem(
              id: Uuid().v4(),
              name: findNewConsoleName(consoles.value),
            ),
          ];
        },
      ),
    ];

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [...consoleItems, ...children],
      ),
    );
  }
}

String findNewConsoleName(List<ConsoleItem> consoles) {
  final existingNames = consoles.map((c) => c.name).toSet();
  var index = 1;
  while (true) {
    final newName = 'Query console $index';
    if (!existingNames.contains(newName)) {
      return newName;
    }
    index++;
  }
}

class _SectionGroupLabel extends StatelessWidget {
  final String label;

  const _SectionGroupLabel({super.key, required this.label});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 8.0),
      child: Text(label, style: Theme.of(context).textTheme.labelMedium),
    );
  }
}

class _SectionItem extends StatelessWidget {
  final String label;
  final bool selected;
  final void Function() onTap;
  final IconData? trailingIcon;
  final void Function(double x, double y)? onRightClicked;

  const _SectionItem({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
    this.trailingIcon,
    this.onRightClicked,
  });

  @override
  Widget build(BuildContext context) {
    final tile = ListTile(
      title: Text(label),
      selected: selected,
      onTap: onTap,
      trailing: trailingIcon != null
          ? Icon(
              trailingIcon,
              size: 16,
              color: Theme.of(context).colorScheme.primary,
            )
          : null,
      titleTextStyle: Theme.of(context).textTheme.bodyMedium,
      selectedTileColor: Theme.of(context).colorScheme.primaryContainer,
      selectedColor: Theme.of(context).colorScheme.onPrimaryContainer,
      visualDensity: VisualDensity(vertical: VisualDensity.minimumDensity),
    );

    if (onRightClicked != null) {
      return GestureDetector(
        onSecondaryTapDown: (evt) {
          onRightClicked?.call(evt.localPosition.dx, evt.localPosition.dy);
        },
        child: tile,
      );
    } else {
      return tile;
    }
  }
}
