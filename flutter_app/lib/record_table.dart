import 'dart:math';

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'record_table.freezed.dart';

const double _maxColumnWidth = 300.0;
const double _minColumnWidth = 35.0;

const double _primaryKeyIconSize = 16.0; // Size of the primary key icon
const double _primaryKeyIconGap = 4.0;

class _TableMeasurements {
  List<double> columnWidths;
  double columnHeaderHeight;

  _TableMeasurements({
    required this.columnWidths,
    required this.columnHeaderHeight,
  });
}

@freezed
abstract class Cell with _$Cell {
  const factory Cell({required int rowIndex, required int columnIndex}) = _Cell;
}

class RecordTable<CellType> extends HookWidget {
  final List<String> columns;
  final List<String> primaryKeyColumns;
  final int rowCount;
  final (String, TextStyle?) Function(
    BuildContext context,
    int rowIndex,
    int columnIndex,
  )
  cellValue;
  final TextStyle textStyle;
  final EdgeInsetsGeometry columnHeaderPaddings;
  final Cell? selectedCell;
  final void Function(Cell)? onCellSelected;

  TextStyle get _headerTextStyle =>
      textStyle.copyWith(fontWeight: FontWeight.w600);

  const RecordTable({
    super.key,
    required this.columns,
    required this.rowCount,
    required this.cellValue,
    required this.primaryKeyColumns,
    this.selectedCell,
    this.onCellSelected,
    this.textStyle = const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
    this.columnHeaderPaddings = const EdgeInsets.symmetric(
      horizontal: 8.0,
      vertical: 8.0,
    ),
  });

  @override
  Widget build(BuildContext context) {
    final columnSampleTexts = columns
        .mapIndexed(
          (columnIndex, col) => Iterable<int>.generate(min(10, rowCount)).fold(
            [col],
            (acc, rowIndex) {
              final (cellText, _) = cellValue(context, rowIndex, columnIndex);
              final prev = acc.length > 1 ? acc.last : null;
              if (prev == null || prev.length < cellText.length) {
                return [col, cellText];
              } else {
                return acc;
              }
            },
          ),
        )
        .toList();

    final textDirection = Directionality.of(context);
    final textScaler = MediaQuery.of(context).textScaler;
    final locale = Localizations.localeOf(context);

    final measures = useMemoized(
      () => columnSampleTexts.fold(
        _TableMeasurements(columnWidths: [], columnHeaderHeight: 0),
        (m, colTexts) {
          final headerTextStyle = textStyle.copyWith(
            fontWeight: FontWeight.w600,
          );
          final (maxWidth, maxHeight) = colTexts.foldIndexed(
            (_minColumnWidth, 0.0),
            (columnIndex, acc, text) {
              final isPrimaryKeyColumn = primaryKeyColumns.contains(
                columns[columnIndex],
              );

              final painter = TextPainter(
                textDirection: textDirection,
                textAlign: TextAlign.start,
                text: TextSpan(text: text, style: headerTextStyle),
                maxLines: 1,
                textScaler: textScaler,
                locale: locale,
                ellipsis: "...",
                strutStyle: StrutStyle.fromTextStyle(headerTextStyle),
              )..layout(minWidth: _minColumnWidth, maxWidth: _maxColumnWidth);

              try {
                return (
                  max(
                    acc.$1,
                    min(_maxColumnWidth, painter.maxIntrinsicWidth) +
                        columnHeaderPaddings.horizontal +
                        (isPrimaryKeyColumn
                            ? (_primaryKeyIconGap + _primaryKeyIconSize)
                            : 0.0) + // Extra space for primary key icon
                        2.0,
                  ), // +2 for the border
                  max(
                    acc.$2,
                    painter.height + columnHeaderPaddings.vertical,
                  ), // +2 for the border
                );
              } finally {
                painter.dispose();
              }
            },
          );

          m.columnWidths.add(maxWidth);
          if (maxHeight > m.columnHeaderHeight) {
            m.columnHeaderHeight = maxHeight;
          }

          return m;
        },
      ),
      [
        columnSampleTexts,
        textStyle,
        columnHeaderPaddings,
        textDirection,
        textScaler,
        locale,
      ],
    );

    final controller = useScrollController();

    final header = Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainer,
      ),
      child: _SizedRow(
        columnWidths: measures.columnWidths,
        showBottomBorder: true,
        showTopBorder: true,
        columnBuilder: (ctx, i) {
          final Widget child;

          if (primaryKeyColumns.contains(columns[i])) {
            child = RichText(
              text: TextSpan(
                children: [
                  WidgetSpan(
                    child: Icon(
                      Icons.key,
                      size: _primaryKeyIconSize,
                      color: textStyle.color,
                    ),
                  ),
                  const WidgetSpan(
                    child: SizedBox(
                      width: _primaryKeyIconGap,
                    ), // Gap after the icon
                  ),
                  TextSpan(text: columns[i], style: _headerTextStyle),
                ],
              ),
            );
          } else {
            child = Text(
              columns[i],
              style: _headerTextStyle,
              textAlign: TextAlign.start,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            );
          }

          return Container(padding: columnHeaderPaddings, child: child);
        },
      ),
    );

    final body = ListView.separated(
      itemBuilder: (ctx, row) {
        return _SizedRow(
          columnWidths: measures.columnWidths,
          columnBuilder: (ctx, column) {
            final isSelected =
                selectedCell != null &&
                    selectedCell!.rowIndex == row &&
                    selectedCell!.columnIndex == column;
            
            final (text, style) = cellValue(ctx, row, column);
            
            return _CellView(
              text: text,
              textStyle: textStyle.merge(style),
              paddings: columnHeaderPaddings,
              selected: isSelected,
              onCellSelected: () {
                if (onCellSelected != null) {
                  onCellSelected!(Cell(rowIndex: row, columnIndex: column));
                }
              },
            );
          },
          showTopBorder: row == 0,
          showBottomBorder: row == rowCount - 1,
        );
      },
      padding: EdgeInsets.only(
        top: measures.columnHeaderHeight - 1,
        bottom: 16.0,
      ),
      separatorBuilder: (ctx, row) =>
          Divider(height: 1.0, color: Theme.of(ctx).colorScheme.outlineVariant),
      itemCount: rowCount,
    );

    return Scrollbar(
      controller: controller,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        controller: controller,
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            Positioned.fill(child: body),
            header,
          ],
        ),
      ),
    );
  }
}

class _SizedRow extends HookWidget {
  final List<double> columnWidths;
  final Widget Function(BuildContext context, int columnIndex) columnBuilder;
  final bool showTopBorder;
  final bool showBottomBorder;

  const _SizedRow({
    super.key,
    required this.columnWidths,
    required this.columnBuilder,
    required this.showTopBorder,
    required this.showBottomBorder,
  });

  @override
  Widget build(BuildContext context) {
    final isHovered = useState(false);
    final children = <Widget>[];
    for (int i = 0; i < columnWidths.length; i++) {
      children.add(VerticalDivider(width: 1.0)); // Divider between columns
      children.add(
        SizedBox(width: columnWidths[i], child: columnBuilder(context, i)),
      );

      if (i == columnWidths.length - 1) {
        children.add(VerticalDivider(width: 1.0)); // Divider after last column
      }
    }

    var border = BorderSide(
      color: Theme.of(context).colorScheme.outlineVariant,
      width: 1.0,
    );

    return Container(
      decoration: BoxDecoration(
        border: Border(
          top: showTopBorder ? border : BorderSide.none,
          bottom: showBottomBorder ? border : BorderSide.none,
        ),
        color: isHovered.value
            ? Theme.of(context).colorScheme.surfaceContainer
            : null,
      ),
      child: MouseRegion(
        onEnter: (_) => isHovered.value = true,
        onExit: (_) => isHovered.value = false,
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              for (int i = 0; i < columnWidths.length; i++)
                Container(
                  width: columnWidths[i],
                  decoration: BoxDecoration(
                    border: Border(
                      left: border,
                      right: i < columnWidths.length - 1
                          ? BorderSide.none
                          : border,
                    ),
                  ),
                  child: columnBuilder(context, i),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CellView extends HookWidget {
  final String text;
  final TextStyle? textStyle;
  final bool selected;
  final void Function() onCellSelected;
  final EdgeInsetsGeometry paddings;

  const _CellView({
    super.key,
    required this.text,
    required this.textStyle,
    required this.selected,
    required this.onCellSelected,
    required this.paddings,
  });

  @override
  Widget build(BuildContext context) {
    final focusNode = useFocusNode(descendantsAreFocusable: false);
    
    return InkWell(
      onTap: () {
        focusNode.requestFocus();
        onCellSelected();
      },
      focusNode: focusNode,
      mouseCursor: SystemMouseCursors.basic,
      child: Container(
        padding: paddings,
        decoration: BoxDecoration(
          color: selected ? Theme.of(context).colorScheme.primaryContainer : null,
        ),
        alignment: Alignment.centerLeft,
        child: Text(
          text,
          style: textStyle,
          textAlign: TextAlign.start,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
    );
  }
}
