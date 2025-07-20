import 'dart:math';

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

    final startIndex = normalisedCurrentPage * numPerPage + 1;
    final endIndex = min(
      totalItemCount,
      (normalisedCurrentPage + 1) * numPerPage,
    );

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
            isHovering.value ? 255 : 180,
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
            if (totalPages > 0)
              IconButton(
                icon: const Icon(Icons.first_page, size: 16),
                onPressed: () => onPageChanged(0),
                tooltip: 'First Page',
                visualDensity: VisualDensity.compact,
              ),
            IconButton(
              icon: const Icon(Icons.navigate_before, size: 16),
              onPressed: normalisedCurrentPage > 0
                  ? () => onPageChanged(normalisedCurrentPage - 1)
                  : null,
              tooltip: 'Previous Page',
              visualDensity: VisualDensity.compact,
            ),
            const SizedBox(width: 4),
            Text(
              '$startIndex - $endIndex of $totalItemCount',
              style: themeData.textTheme.labelMedium,
            ),
            const SizedBox(width: 4),
            IconButton(
              icon: const Icon(Icons.navigate_next, size: 16),
              onPressed: normalisedCurrentPage < totalPages - 1
                  ? () => onPageChanged(normalisedCurrentPage + 1)
                  : null,
              tooltip: 'Next Page',
              visualDensity: VisualDensity.compact,
            ),
            if (totalPages > 0)
              IconButton(
                icon: const Icon(Icons.last_page, size: 16),
                onPressed: normalisedCurrentPage < totalPages - 1
                    ? () => onPageChanged(totalPages - 1)
                    : null,
                tooltip: 'Last page',
                visualDensity: VisualDensity.compact,
              ),
          ],
        ),
      ),
    );
  }
}
