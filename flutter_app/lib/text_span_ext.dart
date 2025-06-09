
import 'package:flutter/widgets.dart';

extension TextSpanExt on TextSpan {
  /// Returns the text content of the TextSpan, including all children.
  int get textLength {
    return (children ?? [])
        .fold<int>(text?.length ?? 0, (acc, child) => acc + child.textLength);
  }
}

extension InlineSpanExt on InlineSpan {
  int get textLength {
    switch (this) {
      case TextSpan(textLength: final length):
        return length;
      default:
        return 0;
    }
  }
}