import 'package:flutter/widgets.dart';

class RecordTable<CellType> extends StatelessWidget {
  final List<String> columns;
  final int rowCount;
  final Widget Function(BuildContext context, int rowIndex, int columnIndex)
  cellBuilder;

  const RecordTable({
    super.key,
    required this.columns,
    required this.rowCount,
    required this.cellBuilder,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: columns.length,
      ),
      itemCount: rowCount * columns.length,
      itemBuilder: (BuildContext context, int index) {
        final rowIndex = index ~/ columns.length;
        final columnIndex = index % columns.length;
        return cellBuilder(context, rowIndex, columnIndex);
      },
    );
  }
}
