import 'package:flutter/src/widgets/framework.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

class PaginationBar extends HookWidget {
  final int currentPage;
  final int numPerPage;
  final int numItems;
  final void Function(int page) onPageChanged;

  const PaginationBar({
    super.key,
    required this.currentPage,
    required this.numPerPage,
    required this.numItems,
    required this.onPageChanged,
  });

  @override
  Widget build(BuildContext context) {
    // TODO: implement build
    throw UnimplementedError();
  }
}
