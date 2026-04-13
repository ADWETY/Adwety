import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:adweth_ui/main.dart';

void main() {
  testWidgets('App builds successfully', (WidgetTester tester) async {
    await tester.pumpWidget(const AdwethApp());
    await tester.pump(const Duration(seconds: 3));

    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
