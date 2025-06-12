import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

class DraggableWidget extends HookWidget {
  final bool Function(double deltaX) onDragMoved;
  final Function(bool isOver)? onMouseOver;
  final Widget child;

  const DraggableWidget({
    super.key,
    required this.onDragMoved,
    required this.child,
    this.onMouseOver,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      child: MouseRegion(
        cursor: SystemMouseCursors.resizeLeftRight,
        child: child,
        onEnter: (_) => onMouseOver?.call(true),
        onExit: (_) => onMouseOver?.call(false),
      ),
      onHorizontalDragUpdate: (details) {
        if (!onDragMoved(details.delta.dx)) {
          // If the drag was not handled, prevent further processing
          return;
        }
      },
    );
  }
}

class DraggingDivider extends HookWidget {
  final bool Function(double deltaX) onDragMoved;

  const DraggingDivider({super.key, required this.onDragMoved});

  @override
  Widget build(BuildContext context) {
    final dragHovered = useState(false);

    return DraggableWidget(
      onMouseOver: (hovered) => dragHovered.value = hovered,
      onDragMoved: onDragMoved,
      child: Container(
        alignment: Alignment.center,
        child: VerticalDivider(
          width: 8.0,
          thickness: dragHovered.value ? 6.0 : 2.0,
          color: Theme.of(context).colorScheme.outlineVariant.withAlpha(
            dragHovered.value ? 0xFF : 0x80,
          ),
        ),
      ),
    );
  }

}