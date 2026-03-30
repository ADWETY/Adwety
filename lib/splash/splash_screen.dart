import 'package:animate_do/animate_do.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../Layout/layout.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    Future.delayed(Duration(seconds: 5),() {
      Navigator.push(context, MaterialPageRoute(builder: (context) {
        return Layout();
      },));
    },);
    super.initState();
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xff1F1F89),
      body: Center(
        child: FadeInUp(
          child: Container(
            child: Image(image: AssetImage("assets/Logo start  .png")),
          ),
        ),
      ),
    );
  }
}
