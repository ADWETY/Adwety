import 'package:flutter/material.dart';

import '../login/start_login.dart';

class Layout extends StatefulWidget {
  const Layout({super.key});

  @override
  _Layout createState() => _Layout();
}

class _Layout extends State<Layout> {
  final PageController controller = PageController();
  int currentPage = 0;

  final List<Map<String, String>> onboardingData = [
    {
      "image": "assets/lay2.jpg",
      "title": "Adwedty",
      "desc": "For better health.",
      "button": "Explore Now"
    },
    {
      "image": "assets/layout20.png",
      "title": "Adwedty",
      "desc": "For a better life.",
      "button": "Next"
    },



    {
      "image": "assets/lay2.jpg",
      "title": "Adwedty",
      "desc": "For better health.",
      "button": "Finish"
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PageView.builder(
        controller: controller,
        onPageChanged: (index) => setState(() => currentPage = index),
        itemCount: onboardingData.length,
        itemBuilder: (context, index) {
          return Stack(
            fit: StackFit.expand,
            children: [
              Image.asset(
                onboardingData[index]["image"]!,
                fit: BoxFit.cover,
              ),

              Padding(
                padding: const EdgeInsets.all(25.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      onboardingData[index]["title"]!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Color(0xff1F1F89),
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 15),
                    Text(
                      onboardingData[index]["desc"]!,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color:Color(0xff1F1F89),
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 40),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        if (index != 0)
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor:Color(0xff1F1F89),
                              side: const BorderSide(color: Color(0xff1F1F89),),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            onPressed: () {
                              controller.previousPage(
                                duration: const Duration(milliseconds: 300),
                                curve: Curves.easeInOut,
                              );
                            },
                            child: const Text("Back",style: TextStyle(color: Colors.white),),
                          )
                        else
                          const SizedBox(width: 80),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor:Color(0xff1F1F89),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          onPressed: () {
                            if (index == onboardingData.length - 1) {
                              Navigator.pushReplacement(
                                context,
                                MaterialPageRoute(
                                    builder: (_) => const StartLogin()),
                              );
                            } else {
                              controller.nextPage(
                                duration: const Duration(milliseconds: 300),
                                curve: Curves.easeInOut,
                              );
                            }
                          },
                          child: Text(onboardingData[index]["button"]!,style: TextStyle(color:Colors.white,),),
                        ),
                      ],
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
