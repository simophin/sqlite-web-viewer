import 'dart:convert';

import 'package:flutter/cupertino.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'shared_prefs.freezed.dart';

@freezed
abstract class _PreferenceState<T> with _$PreferenceState<T> {
  const factory _PreferenceState.loading() = _LoadingState<T>;
  const factory _PreferenceState.initialLoaded({required T value}) =
      _LoadedState<T>;
  const factory _PreferenceState.updated({required T value}) = _UpdatedState<T>;
}

ValueNotifier<T> usePreference<T>(
  String key,
  T initialValue, {
  (T Function(dynamic), dynamic Function(T))? jsonCodec,
}) {
  final v = useState<_PreferenceState<T>>(_PreferenceState.loading());
  final userValue = useValueNotifier(initialValue);
  final prefs = useMemoized(() => SharedPreferencesAsync(), []);

  final debouncedValue = useDebounced(v.value, const Duration(seconds: 1));

  useEffect(() {
    callback() => v.value = _PreferenceState.updated(value: userValue.value);

    userValue.addListener(callback);
    return () {
      userValue.removeListener(callback);
    };
  }, [userValue]);

  // Load initial value from SharedPreferences
  useEffect(() {
    Future.microtask(() async {
      T? value;
      if (jsonCodec != null) {
        final stringValue = await prefs.getString(key);
        if (stringValue != null) {
          value = jsonCodec.$1(jsonDecode(stringValue));
        }
      } else if (T == int) {
        value = (await prefs.getInt(key)) as T?;
      } else if (T == double) {
        value = ((await prefs.getDouble(key)) as T?);
      } else if (T == bool) {
        value = ((await prefs.getBool(key)) as T?);
      } else if (T == String) {
        value = ((await prefs.getString(key)) as T?);
      } else if (T == List<String>) {
        value = ((await prefs.getStringList(key)) as T?);
      } else {
        throw ArgumentError('Unsupported type for SharedPreferences: $T');
      }

      if (value != null && v.value is _LoadingState<T>) {
        v.value = _PreferenceState.initialLoaded(value: value);
        userValue.value = value;
      }
    });

    return null;
  }, []);

  useEffect(() {
    // The only update that will trigger saving to SharedPreferences is
    // when it's updated by the user
    final updatedValue = (debouncedValue is _UpdatedState<T>)
        ? debouncedValue.value
        : null;
    if (updatedValue == null) {
      return null;
    }

    Future.microtask(() async {
      if (jsonCodec != null) {
        print('Saving debounced value for $key: $updatedValue');
        final value = jsonEncode(jsonCodec.$2(updatedValue));
        prefs.setString(key, value);
        return;
      }

      if (updatedValue is int) {
        prefs.setInt(key, updatedValue);
      } else if (updatedValue is double) {
        prefs.setDouble(key, updatedValue);
      } else if (updatedValue is bool) {
        prefs.setBool(key, updatedValue);
      } else if (updatedValue is String) {
        prefs.setString(key, updatedValue);
      } else if (updatedValue is List<String>) {
        prefs.setStringList(key, updatedValue);
      } else {
        throw ArgumentError('Unsupported type for SharedPreferences: $T');
      }
    });

    return null;
  }, [debouncedValue]);

  return userValue;
}
