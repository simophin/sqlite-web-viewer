import 'package:flutter/material.dart';
import 'package:flutter/src/widgets/framework.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

import 'highlighter.dart';

class SQLViewer extends HookWidget {
  final String sql;

  const SQLViewer({super.key, required this.sql});

  @override
  Widget build(BuildContext context) {
    final highlighter = useHighlighter();

    final monospaceTextStyle = TextStyle(fontFamily: 'Monospace', fontSize: 14);

    if (highlighter == null) {
      return SelectableText(sql, style: monospaceTextStyle);
    } else {
      return SelectableText.rich(
        highlighter.highlight(sql),
        style: monospaceTextStyle,
      );
    }
  }
}
