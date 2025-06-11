import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/src/widgets/framework.dart';
import 'package:flutter_app/cell_value.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:json_view/json_view.dart';

class ValueDisplay extends HookWidget {
  final dynamic value;

  const ValueDisplay(this.value, {super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final (jsonDoc, text, style) = useMemoized(() {
      var (t, s) = formatCellValue(value, theme: theme);
      t = t.trim();
      Object? jsonDoc;
      try {
        if (t.startsWith('[') && t.endsWith(']')) {
          jsonDoc = jsonDecode(t) as List<dynamic>;
        } else if (t.startsWith('{') && t.endsWith('}')) {
          jsonDoc = jsonDecode(t) as Map<String, dynamic>;
        }
      } catch (e) {
        // Not a valid JSON, keep the original text
      }

      return (jsonDoc, t, s);
    }, [value, theme]);

    return jsonDoc != null
        ? JsonView(json: jsonDoc)
        : SingleChildScrollView(
            child: SelectableText(
              text,
              style: style?.merge(
                TextStyle(
                  color: theme.colorScheme.onSurface,
                  fontFamily: 'monospace',
                ),
              ),
            ),
          );
  }
}
