import 'dart:convert';

import 'package:flutter/cupertino.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:shared_preferences/shared_preferences.dart';

ValueNotifier<T> usePreference<T>(String key, T initialValue) {
  final v = useState<T>(initialValue);

  final debouncedValue = useDebounced(v.value, const Duration(seconds: 1));

  // Load initial value from SharedPreferences
  useEffect(() {
    SharedPreferences.getInstance().then((prefs) {
      final value = prefs.get(key);
      if (value is T) {
        v.value = value;
      }
    });

    return null;
  }, []);

  useEffect(() {
    SharedPreferences.getInstance().then((prefs) {
      if (debouncedValue is int) {
        prefs.setInt(key, debouncedValue);
      } else if (debouncedValue is double) {
        prefs.setDouble(key, debouncedValue);
      } else if (debouncedValue is bool) {
        prefs.setBool(key, debouncedValue);
      } else if (debouncedValue is String) {
        prefs.setString(key, debouncedValue);
      } else if (debouncedValue is List<String>) {
        prefs.setStringList(key, debouncedValue);
      } else if (debouncedValue != null) {
        throw ArgumentError('Unsupported type for SharedPreferences: $T');
      }
    });

    return null;
  }, [debouncedValue]);

  return v;
}

(T, void Function(T Function(T))) useJsonPreference<T>(
  String key,
  T initialValue, {
  required T Function(Object?) fromJson,
  required String Function(T) toJson,
}) {
 final stringValue = usePreference<String>(key, toJson(initialValue));

 final value = useMemoized(() => fromJson(jsonDecode(stringValue.value)), [stringValue.value]);

  final setValue = useCallback((T Function(T) updater) {
    stringValue.value = toJson(updater(value));
  }, [stringValue, value]);

  return (value, setValue);
}