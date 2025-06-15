import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:syntax_highlight/syntax_highlight.dart';

Highlighter? useHighlighter() {
  final isDark =
      Theme.of(useContext()).colorScheme.brightness == Brightness.dark;
  final highlighterFut = useMemoized(
    () => (() async {
      await Highlighter.initialize(['sql']);
      final theme = isDark
          ? (await HighlighterTheme.loadDarkTheme())
          : (await HighlighterTheme.loadLightTheme());
      return Highlighter(language: 'sql', theme: theme);
    })(),
    [isDark],
  );

  final highlighter = useFuture(highlighterFut);

  return highlighter.data;
}

class SQLEditingController extends TextEditingController {
  Highlighter? _highlighter;

  set highlighter(Highlighter? value) {
    if (value != _highlighter) {
      _highlighter = value;
      notifyListeners();
    }
  }

  SQLEditingController({super.text});

  @override
  TextSpan buildTextSpan({
    required BuildContext context,
    TextStyle? style,
    required bool withComposing,
  }) {
    return _highlighter != null
        ? _highlighter!.highlight(text)
        : TextSpan(text: text, style: style);
  }
}
