import 'package:flutter/material.dart';

(String, TextStyle?) formatCellValue(
  dynamic value, {
  required ThemeData theme,
}) {
  if (value is String && value.isNotEmpty) {
    return (value, null);
  } else if (value is String && value.isEmpty) {
    return (
      "Empty text",
      TextStyle(
        color: theme.colorScheme.tertiary,
        fontStyle: FontStyle.italic,
      ),
    );
  } else if (value is int || value is double) {
    return (
      value.toString(),
      TextStyle(color: theme.colorScheme.secondary),
    );
  } else if (value == null) {
    return (
      'null',
      TextStyle(
        fontStyle: FontStyle.italic,
        color: theme.colorScheme.tertiary,
      ),
    );
  } else {
    return (value.toString(), null);
  }
}
