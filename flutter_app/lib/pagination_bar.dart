import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

class PaginationBar extends HookWidget {
  final int currentPage;
  final int numPerPage;
  final int totalItemCount;
  final void Function(int page) onPageChanged;
  final void Function() onRefresh;

  const PaginationBar({
    super.key,
    required this.currentPage,
    required this.numPerPage,
    required this.totalItemCount,
    required this.onPageChanged,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final totalPages = (totalItemCount / numPerPage.toDouble()).ceil();
    final normalisedCurrentPage = currentPage.clamp(0, totalPages - 1);

    var themeData = Theme.of(context);

    final isHovering = useState(false);

    return MouseRegion(
      onEnter: (_) => isHovering.value = true,
      onExit: (_) => isHovering.value = false,
      child: Container(
        decoration: BoxDecoration(
          border: BoxBorder.all(
            width: 1.0,
            color: themeData.colorScheme.outlineVariant,
          ),
          borderRadius: BorderRadius.circular(8),
          color: themeData.colorScheme.surfaceContainer.withAlpha(
            isHovering.value ? 255 : 100,
          ),
        ),
        padding: const EdgeInsets.all(4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.refresh, size: 16),
              onPressed: onRefresh,
              tooltip: 'Refresh',
              visualDensity: VisualDensity.compact,
            ),
            const SizedBox(width: 8),
            Text(
              'Page ${normalisedCurrentPage + 1} of $totalPages',
              style: themeData.textTheme.labelMedium,
            ),
            IconButton(
              icon: const Icon(Icons.navigate_before, size: 16),
              onPressed: normalisedCurrentPage > 0
                  ? () => onPageChanged(normalisedCurrentPage - 1)
                  : null,
              tooltip: 'Previous Page',
              visualDensity: VisualDensity.compact,
            ),
            IconButton(
              icon: const Icon(Icons.navigate_next, size: 16),
              onPressed: normalisedCurrentPage < totalPages - 1
                  ? () => onPageChanged(normalisedCurrentPage + 1)
                  : null,
              tooltip: 'Next Page',
              visualDensity: VisualDensity.compact,
            ),
          ],
        ),
      ),
    );
  }
}
