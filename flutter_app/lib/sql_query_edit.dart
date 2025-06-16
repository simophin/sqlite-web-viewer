import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

import 'highlighter.dart';

class SQLQueryEditor extends HookWidget {
  final TextEditingValue query;
  final void Function(TextEditingValue) onQueryChanged;
  final void Function() onRunTapped;
  final void Function() onClearTapped;

  const SQLQueryEditor({
    super.key,
    required this.query,
    required this.onQueryChanged,
    required this.onRunTapped,
    required this.onClearTapped,
  });

  @override
  Widget build(BuildContext context) {
    final controller = useMemoized(
      () => SQLEditingController.fromValue(query),
      [],
    );
    final highlighter = useHighlighter();
    final isHovered = useState(false);

    useEffect(() {
      controller.addListener(() => onQueryChanged(controller.value));
      return controller.dispose;
    }, [controller]);

    useEffect(() {
      controller.highlighter = highlighter;
      return null;
    }, [highlighter]);

    useEffect(() {
      controller.value = query;
      return null;
    }, [query]);

    return Stack(
      alignment: Alignment.bottomRight,
      children: [
        TextField(
          controller: controller,
          maxLines: null,
          expands: true,
          style: const TextStyle(fontFamily: 'Monospace'),
          textAlign: TextAlign.start,
          textAlignVertical: TextAlignVertical.top,
          decoration: const InputDecoration(border: OutlineInputBorder()),
        ),
        MouseRegion(
          onEnter: (_) => isHovered.value = true,
          onExit: (_) => isHovered.value = false,
          child: Opacity(
            opacity: isHovered.value ? 1.0 : 0.5,
            child: Padding(
              padding: const EdgeInsets.all(8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    onPressed: onRunTapped,
                    icon: Icon(
                      Icons.play_arrow,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  IconButton(
                    onPressed: onClearTapped,
                    icon: Icon(
                      Icons.delete_sweep,
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
