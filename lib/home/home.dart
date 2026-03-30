import 'package:adwedty/home/adwaty2.dart';
import 'package:adwedty/home/adwaty3.dart';
import 'package:adwedty/home/adwaty4.dart';
import 'package:flutter/material.dart';
import 'adwaty1.dart';
class Home extends StatefulWidget {
  const Home({super.key});
  @override
  State<Home> createState() => _HomeState();
}
class _HomeState extends State<Home> {
  int selctedIndex=0;
  List<Widget>Screens=[
    Adwaty1(),
    Adwaty2(),
    Adwaty3(),
    Adwaty4(),
  ];



  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xffF1F5F9),
      bottomNavigationBar: BottomNavigationBar(
          currentIndex: selctedIndex,
          onTap: (value) {
            selctedIndex=value;
            setState(() {

            });
          },
          type:  BottomNavigationBarType.fixed,
          backgroundColor:Colors.white,
          selectedItemColor:Colors.blueAccent,
          items: [

            BottomNavigationBarItem(icon: ImageIcon(AssetImage("assets/icons1.png")),label: ""),
            BottomNavigationBarItem(icon: ImageIcon(AssetImage("assets/iconascan.png")),label: ""),
            BottomNavigationBarItem(icon: ImageIcon(AssetImage("assets/icons2.png")),label: ""),
            BottomNavigationBarItem(icon: ImageIcon(AssetImage("assets/icons5.png")),label: ""),


          ]),
      body: Screens[selctedIndex],
    );
  }
}
