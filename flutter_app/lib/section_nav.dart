import 'package:flutter/material.dart';
import 'package:flutter_app/console.dart';
import 'package:flutter_app/query.dart';
import 'package:flutter_app/shared_prefs.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:uuid/uuid.dart';

import 'nav_item.dart';

class SectionNav extends HookWidget {
  final List<NavItem> navItems;
  final NavItem? selectedItem;
  final void Function(NavItem item)? onItemSelected;

  const SectionNav({
    super.key,
    required this.navItems,
    this.selectedItem,
    this.onItemSelected,
  });

  @override
  Widget build(BuildContext context) {
    // if (results.error != null) {
    //   return Center(
    //     child: Text(
    //       'Error: ${results.error}',
    //       style: const TextStyle(color: Colors.red),
    //     ),
    //   );
    // }
    //
    // var data = results.data;
    // if (data == null) {
    //   return const Center(child: CircularProgressIndicator());
    // }

    final children = navItems
        .fold(<(String, List<Widget>)>[], (acc, navItem) {
          final String groupLabel, label;
          switch (navItem) {
            case NavItemTable(name: final name):
              groupLabel = 'Tables';
              label = name;
            case NavItemView(name: final name):
              groupLabel = 'Views';
              label = name;
            case NavItemConsole(id: final name):
              groupLabel = 'Consoles';
              label = name;
            default:
              throw Exception('Unknown NavItem type: $navItem');
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

    // final consoleItems = [
    //   _SectionGroupLabel(label: 'Consoles'),
    //   ...consoles.value.map((console) {
    //     return _SectionItem.withHoveredActions(
    //       label: console.name,
    //       selected:
    //           selectedItem is NavItemConsole &&
    //           (selectedItem as NavItemConsole).id == console.id,
    //       onTap: () => onItemSelected?.call(NavItem.console(id: console.id)),
    //       hoveredTrailing: () => Row(
    //         mainAxisSize: MainAxisSize.min,
    //         children: [
    //           IconButton(
    //             icon: const Icon(Icons.edit, size: 16),
    //             onPressed: () {},
    //           ),
    //           const SizedBox(width: 4),
    //           IconButton(
    //             icon: const Icon(Icons.delete, size: 16),
    //             onPressed: () {
    //               consoles.value = consoles.value
    //                   .where((item) => item.id != console.id)
    //                   .toList();
    //               // if (selectedItem is NavItemConsole &&
    //               //     (selectedItem as NavItemConsole).id == console.id) {
    //               //   onItemSelected?.call(consoles.value.first);
    //               // }
    //             },
    //           ),
    //         ],
    //       ),
    //     );
    //   }),
    //   _SectionItem(
    //     label: 'New console',
    //     selected: false,
    //     trailing: (_) => const Icon(Icons.add, size: 16),
    //     onTap: () {
    //       var newItem = ConsoleItem(
    //         id: Uuid().v4(),
    //         name: findNewConsoleName(consoles.value),
    //       );
    //       consoles.value = [...consoles.value, newItem];
    //       onItemSelected?.call(NavItem.console(id: newItem.id));
    //     },
    //   ),
    // ];

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
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

class _SectionItem extends HookWidget {
  final String label;
  final bool selected;
  final void Function() onTap;
  final Widget? Function(bool hovered)? trailing;

  const _SectionItem({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
    this.trailing,
  });

  factory _SectionItem.withHoveredActions({
    required String label,
    required bool selected,
    required void Function() onTap,
    required Widget Function() hoveredTrailing,
  }) {
    return _SectionItem(
      label: label,
      selected: selected,
      onTap: onTap,
      trailing: (hovered) => hovered ? hoveredTrailing() : null,
    );
  }

  @override
  Widget build(BuildContext context) {
    final hovered = useState(false);

    final tile = ListTile(
      title: Text(label),
      selected: selected,
      onTap: onTap,
      trailing: trailing?.call(hovered.value),
      titleTextStyle: Theme.of(context).textTheme.bodyMedium,
      selectedTileColor: Theme.of(context).colorScheme.primaryContainer,
      selectedColor: Theme.of(context).colorScheme.onPrimaryContainer,
      visualDensity: VisualDensity(vertical: VisualDensity.minimumDensity),
    );

    if (trailing != null) {
      return MouseRegion(
        onEnter: (_) => hovered.value = true,
        onExit: (_) => hovered.value = false,
        child: tile,
      );
    } else {
      return tile;
    }
  }
}
