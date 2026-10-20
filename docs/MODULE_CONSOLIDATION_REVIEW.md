# Handbook-verified module consolidation

Status: the additive migration and **114 approved aliases** were applied to the connected Supabase database on 20 October 2026, after explicit user approval. Affected records were backed up first. A repeat dry run proposed zero further changes within that verified scope. Application changes still require publishing the matching Git revision to Vercel.

The initial code-only candidate list contained 359 entries. Full PDF extraction exposed reused teaching-event numbers, translated titles, and older catalog semesters. Final application requires a matching course number, normalized title, semester, and unique parent. **245 entries from the initial approved list were therefore left unchanged.** Additional eligible entries outside that list were also excluded.

Source: `88-079-H-2023_v1_2026-09-10_de.pdf`, 1189 pages; handbook date 10 September 2026.

SHA-256: `a1b4282708d6e857644ba7466b28e6eb4428341f1e84d07df7ac943e7606650b`.

Relationships come only from the explicit **Bestandteil von** field and **Lehrveranstaltungen** rows. Assessment event numbers and prerequisite references are excluded. Wrapped page headers and wrapped course titles are handled. The extractor records 615 course numbers with their title/semester variants. No title similarity or automatic translation approves a merge.

## Verification results

- Database rows: 5,333 before and after; no modules deleted.
- Aliases set: 114; parent modules remain independent review targets.
- Existing reviews: 2 before and after, already on parent modules; no review IDs or votes discarded.
- Separate alias reviews after application: 0.
- `2400008` and `2400034` resolve to `M-INFO-106959`.
- Existing summer-2026 `2400194` (Sampling Methods) resolves to `M-INFO-107090`. The same number is reused for an unrelated winter-2026/27 seminar on PDF page 1064; its different title prevents an incorrect merge.
- Existing semester links are preserved and unioned onto the parent. No teaching availability is invented.
- Search returns each confirmed parent once and still offers other distinct modules.

## Applied entries

| Course  | Existing course title                                               | Parent            | Evidence pages   |
| ------- | ------------------------------------------------------------------- | ----------------- | ---------------- |
| 0150310 | Tutorial for Combinatorics (0150300)                                | M-MATH-102950     | 780              |
| 0155500 | Übungen zu 0155400 (Optimierungstheorie)                            | M-MATH-103219     | 865              |
| 0161100 | Time Series Analysis                                                | M-MATH-102911     | 1189             |
| 0161110 | Tutorial for 0161100 (Time Series Analysis)                         | M-MATH-102911     | 1189             |
| 0161400 | Generalisierte Regressionsmodelle                                   | M-MATH-102906     | 733              |
| 0161410 | Übungen zu 0161400 (generalisierte Regressionsmodelle)              | M-MATH-102906     | 733              |
| 0161700 | Computational Fluid Dynamics and Simulation Lab                     | M-MATH-106634     | 642              |
| 0163900 | Analysis 4                                                          | M-MATH-103164     | 599              |
| 0164000 | Übungen zu 0163900 (Analysis 4)                                     | M-MATH-103164     | 599              |
| 0164400 | Uncertainty Quantification                                          | M-MATH-104054     | 983              |
| 0164410 | Tutorial for 0164400 (Uncertainty quantification)                   | M-MATH-104054     | 983              |
| 0165000 | Einführung in das Wissenschaftliche Rechnen                         | M-MATH-102889     | 677              |
| 0165010 | Praktikum zu Einführung in das Wissenschaftliche Rechnen (0165000)  | M-MATH-102889     | 677              |
| 2121333 | Robotic Intelligence: Navigation and Mobile Manipulation            | M-MACH-107621     | 1005             |
| 2121334 | Robotic Intelligence: Navigation and Mobile Manipulation (Exercise) | M-MACH-107621     | 1005             |
| 2121343 | Seminar: Bionic Algorithms and Robot Technologies                   | M-MACH-106902     | 1051             |
| 2122330 | Biologically Inspired Robots                                        | M-MACH-106903     | 626              |
| 2122331 | CAD Engineering Project for Intelligent Systems                     | M-MACH-106905     | 633              |
| 2181740 | Particle Dynamics and Atomistic Simulation                          | M-INFO-104200     | 612              |
| 2302134 | Signal Processing Lab                                               | M-ETIT-106633     | 1107             |
| 2303192 | Innovation Lab                                                      | M-ETIT-105073     | 763              |
| 2303320 | Nonlinear Control Systems                                           | M-ETIT-107644     | 857              |
| 2303321 | Exercises to 2303320 Nonlinear Control Systems                      | M-ETIT-107644     | 857              |
| 2305302 | Modeling Physiological Systems                                      | M-ETIT-106782     | 827              |
| 2305303 | Exercise to 2305302 Modeling Physiological Systems                  | M-ETIT-106782     | 828              |
| 2307376 | Electric Power Transmission & Grid Control                          | M-ETIT-105394     | 686              |
| 2307377 | Tutorial for 2307376 Electric Power Transmission & Grid Control     | M-ETIT-105394     | 686              |
| 2309486 | Optoelectronic Components                                           | M-ETIT-100509     | 868              |
| 2309487 | Optoelectronic Components (Tutorial)                                | M-ETIT-100509     | 868              |
| 2310546 | Channel Coding: Algebraic Methods for Communications and Storage    | M-ETIT-105616     | 634              |
| 2311619 | Hardware Synthesis and Optimization                                 | M-ETIT-106963     | 748              |
| 2311621 | Tutorial for 2311619 Hardware Synthesis and Optimization            | M-ETIT-106963     | 748              |
| 2311642 | Systems Engineering for Automotive Electronics                      | M-ETIT-100462     | 1136             |
| 2311644 | Tutorial for 2311642 Systems Engineering for Automotive Electronics | M-ETIT-100462     | 1136             |
| 2312668 | Nano- and Quantum Electronics                                       | M-ETIT-105604     | 848              |
| 2312670 | Tutorial for 2312668 Nano- and Quantum Electronics                  | M-ETIT-105604     | 848              |
| 2312683 | Digital Circuit Design                                              | M-ETIT-107365     | 666              |
| 2312685 | Practical Excercise to 2312683 Digital Circuit Design               | M-ETIT-107365     | 666              |
| 2400003 | Machine Learning in Climate and Environmental Sciences              | M-INFO-106470     | 801, 802         |
| 2400008 | Machine Learning for the Natural Sciences                           | M-INFO-106959     | 799              |
| 2400034 | Exercise for Machine Learning for the Natural Sciences              | M-INFO-106959     | 800              |
| 2400018 | Machine Learning – Foundations and Algorithms                       | M-INFO-107169     | 797              |
| 2400024 | Deep Learning and Neural Networks                                   | M-INFO-107197     | 658              |
| 2400025 | Seminar: Formal Methods in Software Engineering                     | M-INFO-101536     | 1048             |
| 2400030 | Dependable Computing                                                | M-INFO-102662     | 1031             |
| 2400032 | Seminar Speech-to-Speech Translation                                | M-INFO-107179     | 1099             |
| 2400040 | Hot Topics in Networking                                            | M-INFO-100746     | 1035             |
| 2400049 | Research Project: Generative AI for Autonomous Agents               | M-INFO-107163     | 1000             |
| 2400059 | Software Security Engineering                                       | M-INFO-106344     | 1119             |
| 2400062 | Wearable Robotic Technologies                                       | M-INFO-107113     | 1185             |
| 2400063 | Motion in Human and Machine                                         | M-INFO-102555     | 843              |
| 2400069 | Teamarbeit im Bereich Web-Anwendungen                               | M-INFO-102835     | 1139             |
| 2400071 | Teamarbeit im Bereich Serviceorientierte Architekturen              | M-INFO-102835     | 1138             |
| 2400077 | Theory of Satisfiability Algorithms                                 | M-INFO-107639     | 1161             |
| 2400078 | Intelligente Chatbots und Recht                                     | M-INFO-107929     | 1103             |
| 2400084 | Seminar: Robot Reinforcement Learning                               | M-INFO-107926     | 1094             |
| 2400085 | Quantum Information Theory                                          | M-INFO-105408     | 1092             |
| 2400098 | Data science and Artificial Intelligence for Energy Systems         | M-INFO-106655     | 655              |
| 2400106 | FPGA Programming                                                    | M-INFO-102661     | 902              |
| 2400107 | Practical Course: Chip Design II                                    | M-INFO-107266     | 896              |
| 2400111 | Computer Graphics 2                                                 | M-INFO-106685     | 650              |
| 2400117 | Application Security Lab                                            | M-INFO-106996     | 892              |
| 2400128 | Explainable Artificial Intelligence                                 | M-INFO-106302     | 716              |
| 2400131 | Advances in Data Science                                            | M-INFO-107686     | 1076             |
| 2400135 | Humanoid Robots – Locomotion and Whole-Body Control                 | M-INFO-106649     | 756, 757         |
| 2400136 | Seminar on Behavior Foundation Models                               | M-INFO-107729     | 1038             |
| 2400141 | Multimodal Artificial Intelligence                                  | M-INFO-107676     | 845              |
| 2400155 | Graph Drawing                                                       | M-INFO-106961     | 596              |
| 2400159 | HRI and Social Robotics                                             | M-INFO-106650     | 752, 753         |
| 2400172 | Public International Law with an Economic Law Focus                 | M-INFO-106754     | 981              |
| 2400177 | Designing Data Governance of Digital Systems                        | M-INFO-107940     | 1086             |
| 2400190 | EU Digital Regulatory Framework                                     | M-INFO-107940     | 1086             |
| 2400178 | Parameterized Algorithms                                            | M-INFO-107167     | 873, 874         |
| 2400181 | Interpretability and Causality in Machine Learning                  | M-INFO-107217     | 909, 1077        |
| 2400185 | Research Focus Class: Blockchain & Cryptocurrencies                 | M-INFO-106654     | 993, 994         |
| 2400194 | Sampling Methods for Machine Learning                               | M-INFO-107090     | 1011, 1012, 1064 |
| 2400196 | Practical Graph Algorithms                                          | M-INFO-107264     | 1089             |
| 2400205 | Neural Network Acceleration on FPGAs                                | M-INFO-106503     | 913              |
| 2400295 | Embedded Machine Learning Lab                                       | M-INFO-105775     | 687              |
| 2424304 | Internet of Things (IoT) Lab                                        | M-INFO-103706     | 906              |
| 2424638 | Algorithmen für Routenplanung (mit Übungen)                         | M-INFO-100031     | 592              |
| 2424672 | Low Power Design                                                    | M-INFO-100807     | 796              |
| 2424811 | Low Power Design and Embedded Systems                               | M-INFO-104031     | 907              |
| 2424902 | Practical course GPU-Computing                                      | M-INFO-101567     | 922              |
| 2500014 | Predictive Mechanism and Market Design                              | M-WIWI-101453     | 971              |
| 2500016 | Advanced Machine Learning and Data Science                          | M-WIWI-105659     | 583              |
| 2500073 | Practical Seminar: AI-based Mental Healthcare                       | M-WIWI-106292     | 928              |
| 2540554 | Practical Seminar: Human-Centered Systems                           | M-WIWI-106292     | 928              |
| 2540558 | Designing Interactive Systems: Human-AI Interaction                 | M-WIWI-106292     | 664              |
| 2540553 | Biosignal-Adaptive Systems Seminar                                  | M-INFO-105898     | 1085             |
| 2545004 | Startup Experience                                                  | M-WIWI-101488     | 1126             |
| 2545021 | Joint Entrepreneurship School China                                 | M-WIWI-101488     | 776              |
| 2545109 | Business Planning for Founders - Startup CFO                        | M-WIWI-101488     | 632              |
| 2550488 | Ereignisdiskrete Simulation in Produktion und Logistik              | M-WIWI-102832     | 706              |
| 2571185 | Digital Marketing                                                   | M-WIWI-106258     | 668              |
| 2571186 | Digital Marketing Exercise                                          | M-WIWI-106258     | 668              |
| 2581006 | Efficient Energy Systems and Electric Mobility                      | M-WIWI-101452     | 674              |
| 2581020 | Energy Trading and Risk Management                                  | M-WIWI-101451     | 699              |
| 2595600 | Service Design Thinking                                             | M-WIWI-101503     | 1104             |
| 4011213 | Praktikum Klassische Physik II (Kurs 1)                             | M-PHYS-101354     | 939              |
| 4011223 | Praktikum Klassische Physik II (Kurs 2)                             | M-PHYS-101354     | 939              |
| 4011233 | Praktikum Klassische Physik II (Kurs 3)                             | M-PHYS-101354     | 939              |
| 4023111 | Theoretical Optics                                                  | M-PHYS-102277     | 1149             |
| 4023112 | Exercises to Theoretical Optics                                     | M-PHYS-102277     | 1149             |
| 4052051 | Advanced Numerical Weather Prediction                               | M-PHYS-104577     | 584              |
| 4052052 | Exercises to Advanced Numerical Weather Prediction                  | M-PHYS-104577     | 584              |
| 4052081 | Turbulent Diffusion                                                 | M-PHYS-104577     | 638, 1167        |
| 4052082 | Exercises to Turbulent Diffusion                                    | M-PHYS-104577     | 638, 1167        |
| 4052151 | Remote Sensing of Atmosphere and Ocean                              | M-PHYS-104577     | 637, 991         |
| 4052152 | Exercises to Remote Sensing of Atmosphere and Ocean                 | M-PHYS-104577     | 637, 991         |
| 4052171 | Methods of Data Analysis                                            | M-PHYS-104577     | 819              |
| 4052172 | Exercises to Methods of Data Analysis                               | M-PHYS-104577     | 819              |
| 4052191 | Energy Meteorology                                                  | M-PHYS-104577     | 697              |
| 5012001 | Ars Rationalis II                                                   | M-GEISTSOZ-100614 | 604, 605         |

## Approved candidates left unchanged

These did not pass all final number/title/semester/unique-parent checks. Some are translated or older records; others are genuinely shared or reused identifiers. They need additional official evidence before being linked. Their records and reviews have not been removed.

| Course  | Existing title                                                                                    | Initially proposed parent |
| ------- | ------------------------------------------------------------------------------------------------- | ------------------------- |
| 0102200 | Algebra                                                                                           | M-MATH-101315             |
| 0102210 | Tutorial for 0102200 (Algebra)                                                                    | M-MATH-101315             |
| 0104500 | Graph Theory                                                                                      | M-MATH-101336             |
| 0104510 | Tutorial for 0104500 (Graph Theory)                                                               | M-MATH-101336             |
| 0109400 | Mathematical Modelling and Simulation                                                             | M-MATH-102929             |
| 0155450 | Introduction to Kinetic Theory                                                                    | M-MATH-103919             |
| 2113820 | Practical Course: Autonomous Driving                                                              | M-MACH-107806             |
| 2117054 | Applied material flow simulation                                                                  | M-WIWI-102832             |
| 2121331 | Robotic Intelligence: Perception and Scene Understanding                                          | M-MACH-107558             |
| 2121332 | Robotic Intelligence: Perception and Scene Understanding (Exercise)                               | M-MACH-107558             |
| 2137301 | Measurement and Control Systems                                                                   | M-MACH-102564             |
| 2137302 | Measurement and Control Systems (Tutorial)                                                        | M-MACH-102564             |
| 2145182 | Produktentwicklung (ipek)                                                                         | M-WIWI-101488             |
| 2162257 | Tutorial Introduction to the Finite Element Method                                                | M-INFO-104200             |
| 2162282 | Introduction to the Finite Element Method                                                         | M-INFO-104200             |
| 2182740 | Materials modelling: dislocation based plasticity                                                 | M-INFO-104200             |
| 2183702 | Modelling of Microstructures                                                                      | M-INFO-104200             |
| 2183717 | Seminar Materials Modeling                                                                        | M-INFO-104200             |
| 2302106 | Distributed Discrete Event Systems                                                                | M-ETIT-100361             |
| 2302108 | Practice to Distributed Discrete Event Systems                                                    | M-ETIT-100361             |
| 2302113 | Signal Processing Methods                                                                         | M-ETIT-106899             |
| 2302115 | Tutorial to 2302113 Signal Processing Methods                                                     | M-ETIT-106899             |
| 2302150 | Optical Engineering and Machine Vision                                                            | M-ETIT-106974             |
| 2302151 | Tutorial to 2302150 Optical Engineering and Machine Vision                                        | M-ETIT-106974             |
| 2302300 | Measurement and Control Technology                                                                | M-ETIT-106339             |
| 2302301 | Practice to 2302300 Measurement and Control Technology                                            | M-ETIT-106339             |
| 2303183 | Optimal Control                                                                                   | M-ETIT-107497             |
| 2303185 | Information and Automation Technology                                                             | M-ETIT-107497             |
| 2303851 | 🧩 Blended (On-Site/Online)                                                                       | M-ETIT-107497             |
| 2305256 | Linear Electric Circuits                                                                          | M-ETIT-101845             |
| 2305258 | Linear Electric Circuits (Tutorial to 2305256)                                                    | M-ETIT-101845             |
| 2305281 | Physiology and Anatomy for Engineers I                                                            | M-ETIT-105874             |
| 2305282 | Physiology and Anatomy for Engineers II                                                           | M-ETIT-105874             |
| 2305581 | Accompanying group tutorial to 2305256 Linear Electric Circuits                                   | M-ETIT-101845             |
| 2305742 | Business Innovation in Optics and Photonics                                                       | M-ETIT-101834             |
| 2305743 | Erxercise for 2305742 Business Innovation in Optics and Photonics                                 | M-ETIT-101834             |
| 2310520 | Channel Coding: Graph-Based Codes                                                                 | M-ETIT-105617             |
| 2310521 | Exercise for 2310520 Channel Coding: Graph-Based Codes                                            | M-ETIT-105617             |
| 2310523 | Mobile Communications                                                                             | M-ETIT-105971             |
| 2310524 | Exercises for 2310523 Mobile Communications                                                       | M-ETIT-105971             |
| 2310537 | Applied Information Theory                                                                        | M-ETIT-107333             |
| 2310539 | Exercises for 2310537 Applied Information Theory                                                  | M-ETIT-107333             |
| 2310540 | Advanced Communications Engineering                                                               | M-ETIT-106815             |
| 2310541 | Tutorial to 2310540 Advanced Communications Engineering                                           | M-ETIT-106815             |
| 2311605 | Systems and Software Engineering                                                                  | M-ETIT-100537             |
| 2311607 | Tutoral for 2311605 Systems and Software Engineering                                              | M-ETIT-100537             |
| 2311608 | Hardware Modeling and Simulation                                                                  | M-ETIT-100449             |
| 2311610 | Tutorial for 2311608 Hardware Modeling and Simulation                                             | M-ETIT-100449             |
| 2311612 | Laboratory System-on-Chip                                                                         | M-ETIT-107763             |
| 2311620 | Hardware/Software Co-Design                                                                       | M-ETIT-107444             |
| 2311623 | Tutorial for 2311620 Hardware/Software Co-Design                                                  | M-ETIT-107444             |
| 2311625 | Microsystem Technology                                                                            | M-ETIT-100454             |
| 2311630 | Integrated Intelligent Sensors                                                                    | M-ETIT-100457             |
| 2311640 | Laboratory in Software Engineering                                                                | M-ETIT-100460             |
| 2311641 | Project Management in the Development of Products for Safety-Critical Applications Nolle, Manfred | M-ETIT-104475             |
| 2311643 | Tutorial for 2311641 Project Management in the Development of Products for Safety- Practice (Ü)   | M-ETIT-104475             |
| 2311648 | Test of Embedded Systems in Industrial Contexts                                                   | M-ETIT-100546             |
| 2311649 | Test of Embedded Systems in Industrial Contexts (Tutorial to 2311649)                             | M-ETIT-100546             |
| 2312664 | Analog Circuit Design                                                                             | M-ETIT-107364             |
| 2312666 | Practical Exercise for 2312664 Analog Circuit Design                                              | M-ETIT-107364             |
| 2312669 | Laboratory Nanoelectronics                                                                        | M-ETIT-100468             |
| 2400002 | Teamwork and Presentation in Software Development                                                 | M-INFO-105585             |
| 2400007 | Deep Learning for Computer Vision I: Basics                                                       | M-INFO-107243             |
| 2400010 | Proseminar: Mobile Computing                                                                      | M-INFO-106998             |
| 2400012 | Übung zu Visualisierung                                                                           | M-INFO-102998             |
| 2400013 | Übung BGB zur juristischen Falllösungstechnik II                                                  | M-INFO-103153             |
| 2400015 | Mobile Communication                                                                              | M-INFO-107245             |
| 2400016 | Übung Interaktive Computergrafik                                                                  | M-INFO-107597             |
| 2400020 | Windows Internals (Proseminar Operating System Internals)                                         | M-INFO-107209             |
| 2400021 | Teaching Computer Science I                                                                       | M-INFO-100795             |
| 2400023 | Designing and Evaluating Interactive Systems (Internship)                                         | M-INFO-106290             |
| 2400035 | Seminar Image Analysis and Fusion                                                                 | M-INFO-102375             |
| 2400036 | Proseminar: Fault-Tolerant Services Using the State Machine Approach                              | M-INFO-100804             |
| 2400041 | Rendering in CGI                                                                                  | M-INFO-106687             |
| 2400045 | Authentication and Encryption                                                                     | M-INFO-105338             |
| 2400047 | Research Project (Project                                                                         | M-INFO-102550             |
| 2400053 | Research Project (Project                                                                         | M-INFO-107199             |
| 2400056 | Research Project (Methods                                                                         | M-INFO-107412             |
| 2400064 | Information Event “Research Project”                                                              | M-INFO-106800             |
| 2400072 | Seminar: Service-oriented Architectures                                                           | M-INFO-102372             |
| 2400076 | Research Project (Methods, first semester)                                                        | M-INFO-107642             |
| 2400079 | Proseminar: Designing and Conducting Experimental Studies                                         | M-INFO-106655             |
| 2400080 | Research Trends in Human-Computer Interaction (Seminar)                                           | M-INFO-106594             |
| 2400089 | Decentralized Systems: Fundamentals                                                               | M-INFO-105334             |
| 2400101 | Current Trends in Theoretical Computer Science                                                    | M-INFO-107027             |
| 2400105 | Proseminar Software Engineering: Outstanding Minds in Computer Science                            | M-INFO-107677             |
| 2400113 | Introduction to Efficient Programming with C                                                      | M-INFO-107239             |
| 2400114 | Application Security Lab                                                                          | M-INFO-106996             |
| 2400115 | SDQ Proposal Seminar Others (sonst.)                                                              | M-INFO-104895             |
| 2400118 | Seminar Privacy and Security                                                                      | M-INFO-107216             |
| 2400120 | Advanced Bayesian Data Analysis                                                                   | M-INFO-106812             |
| 2400121 | Beating the Worst Case in Practice: Surprisingly Efficient Algorithms                             | M-INFO-107599             |
| 2400123 | Practical Course Computer Vision for Human-Computer Interaction                                   | M-INFO-102966             |
| 2400125 | Basispraktikum: Robot Learning                                                                    | M-INFO-107933             |
| 2400126 | Praktikum: Advanced Software Development Tools                                                    | M-INFO-105585             |
| 2400142 | Proseminar: Humanoid Robots                                                                       | M-INFO-106495             |
| 2400143 | Social Autonomous Agents                                                                          | M-INFO-106497             |
| 2400145 | Do LLMs understand cause and effect?                                                              | M-INFO-107863             |
| 2400146 | Practical course Scientific Visualisation                                                         | M-INFO-106686             |
| 2400149 | Practical course: Human-Centred Robotics                                                          | M-INFO-106646             |
| 2400150 | Software Engineering                                                                              | M-INFO-107176             |
| 2400154 | Cryptographic Protocols                                                                           | M-INFO-105631             |
| 2400156 | Interdisciplinary group seminar AI-Climate                                                        | M-INFO-107228             |
| 2400161 | Logical Foundations of Cyber-Physical Systems                                                     | M-INFO-106102             |
| 2400162 | Digital Games                                                                                     | M-INFO-102835             |
| 2400166 | Seminar Continuous Software Engineering Seminar (S)                                               | M-INFO-105309             |
| 2400170 | Laboratory: Smart Energy System Lab                                                               | M-INFO-105955             |
| 2400179 | Interpretierbarkeit und Kausalität im Maschinellen Lernen                                         | M-INFO-106237             |
| 2400180 | Proseminar: Robot Learning                                                                        | M-INFO-107817             |
| 2400186 | Virtuelle Realität und Barrierefreiheit (Proseminar)                                              | M-INFO-106626             |
| 2400189 | Proseminar Moderne Kommunikationssysteme                                                          | M-INFO-107170             |
| 2400193 | Practical Course: Human-Centred Robotics Projects                                                 | M-INFO-106646             |
| 2400195 | IAI Advanced Seminar                                                                              | M-INFO-107906             |
| 2400199 | Research Trends in Human-Computer Interaction                                                     | M-INFO-106594             |
| 2400204 | Kolloquium Markenrecht                                                                            | M-INFO-107865             |
| 2400208 | Designing and Evaluating Interactive Systems                                                      | M-INFO-106290             |
| 2400213 | Autonomous Learning for Intelligent Robot Perception                                              | M-INFO-106608             |
| 2400221 | Environmental Legal Considerations regarding Artificial Intelligence                              | M-INFO-107940             |
| 2400231 | Seminar: Critical topics in AI                                                                    | M-INFO-106958             |
| 2400232 | Hardware-efficient Artificial Intelligence                                                        | M-INFO-107448             |
| 2400236 | Safe Human-Robot-Collaboration                                                                    | M-INFO-104877             |
| 2400280 | Optimization Methods for Machine Learning and Engineering                                         | M-INFO-105329             |
| 2400281 | 🧩 Blended (On-Site/Online)                                                                       | M-INFO-105329             |
| 2411604 | Computer Contract Law                                                                             | M-INFO-101216             |
| 2424079 | 1. Informatik Lehrveranstaltungen                                                                 | M-INFO-107201             |
| 2424081 | Computergraphics                                                                                  | M-INFO-100856             |
| 2424086 | Formale Systeme                                                                                   | M-INFO-100799             |
| 2424100 | Human-Machine-Interaction in Anthropomatics: Basics                                               | M-INFO-100824             |
| 2424104 | Internet of Everything                                                                            | M-INFO-100800             |
| 2424106 | Design and architectures of embedded systems (ES2)                                                | M-INFO-107230             |
| 2424113 | Course Catalog                                                                                    | M-INFO-107847             |
| 2424117 | Heterogene parallele Rechensysteme                                                                | M-INFO-100822             |
| 2424136 | Trademark and Unfair Competition Law                                                              | M-INFO-101215             |
| 2424146 | Ubiquitäre Informationstechnologien                                                               | M-INFO-107161             |
| 2424152 | Robotics I - Introduction to Robotics                                                             | M-INFO-107162             |
| 2424164 | Software Evolution                                                                                | M-INFO-100719             |
| 2424169 | Automated Visual Inspection and Image Processing                                                  | M-INFO-100826             |
| 2424179 | Innovative Concepts for Programming Industrial Robots                                             | M-INFO-100791             |
| 2424186 | Seminar Patent Law                                                                                | M-INFO-107929             |
| 2424187 | Natural Language Processing and Software Engineering                                              | M-INFO-107233             |
| 2424281 | Practical Course Machine Learning and Intelligent Systems                                         | M-INFO-107845             |
| 2424283 | Practical course GPU-Computing                                                                    | M-INFO-101567             |
| 2424286 | Datenbankpraktikum                                                                                | M-INFO-101662             |
| 2424287 | Practical course Realtime Computer Graphics                                                       | M-INFO-106851             |
| 2424299 | Project Lab: Image Analysis and Fusion                                                            | M-INFO-102383             |
| 2424305 | Practical Course in Algorithm Design                                                              | M-INFO-107600             |
| 2424344 | Advanced Methods of Information Fusion                                                            | M-INFO-102305             |
| 2424354 | Internet Law                                                                                      | M-INFO-101215             |
| 2424358 | Seminar Computer Vision for Human-Computer Interaction                                            | M-INFO-102373             |
| 2424362 | Selected Chapters on Computer Architecture                                                        | M-INFO-103062             |
| 2424570 | Computer Architecture                                                                             | M-INFO-100818             |
| 2424657 | Model-Driven Software Development                                                                 | M-INFO-106931             |
| 2424667 | Software Architecture and Quality                                                                 | M-INFO-107237             |
| 2424844 | Seminar: Ubiquitous Systems                                                                       | M-INFO-101880             |
| 2424890 | Humanoid Robotics Laboratory                                                                      | M-INFO-105792             |
| 2500018 | Successful transformation through innovation                                                      | M-WIWI-101507             |
| 2500053 | Bachelor- und Masterkolloquium                                                                    | M-WIWI-101507             |
| 2500059 | Economic Decision Making                                                                          | M-WIWI-106258             |
| 2512554 | Practical Course: Security                                                                        | M-INFO-105453             |
| 2512555 | Praktikum Security                                                                                | M-INFO-105453             |
| 2513214 | Seminar Information security and Data protection (Bachelor)                                       | M-INFO-107929             |
| 2530560 | Bond Markets                                                                                      | M-WIWI-101483             |
| 2530562 | Bond Markets - Tools & Applications                                                               | M-WIWI-101483             |
| 2530565 | Bond Markets - Models & Derivatives                                                               | M-WIWI-101483             |
| 2530570 | International Finance                                                                             | M-WIWI-101483             |
| 2540420 | Engineering Interactive Systems: AI & Wearables                                                   | M-WIWI-106292             |
| 2540494 | Energy Networks and Regulation                                                                    | M-WIWI-101446             |
| 2540495 | Übung zu Energy Networks and Regulation                                                           | M-WIWI-101446             |
| 2545002 | Entrepreneurship Research                                                                         | M-WIWI-101488             |
| 2550111 | Nonlinear Optimization I                                                                          | M-WIWI-101473             |
| 2550112 | Exercises Nonlinear Optimization I                                                                | M-WIWI-101473             |
| 2550113 | Nonlinear Optimization II                                                                         | M-WIWI-101473             |
| 2550114 | Exercise to Nonlinear Optimization II                                                             | M-WIWI-101473             |
| 2550134 | Global Optimization I                                                                             | M-WIWI-101473             |
| 2550135 | Exercise to Global Optimization I                                                                 | M-WIWI-101473             |
| 2550136 | Global Optimization II                                                                            | M-WIWI-101473             |
| 2550137 | Exercise to Global Optimization II                                                                | M-WIWI-101473             |
| 2550464 | Optimization Under Uncertainty                                                                    | M-WIWI-103289             |
| 2550465 | Übungen zu Optimierungsansätze unter Unsicherheit                                                 | M-WIWI-103289             |
| 2550490 | Modellieren und OR-Software: Einführung                                                           | M-WIWI-102832             |
| 2550552 | Advanced Statistical Techniques, Including Multivariate and Simulation Methods Lecture (V)        | M-INFO-104199             |
| 2550553 | Exercises and Computer Labs in Advanced Statistical Techniques                                    | M-INFO-104199             |
| 2561127 | Public Management                                                                                 | M-WIWI-101504             |
| 2571184 | Online concepts for Karlsruhe city retailers                                                      | M-WIWI-106258             |
| 2572170 | Marketing Analytics                                                                               | M-INFO-104199             |
| 2572171 | Practice (Ü)                                                                                      | M-INFO-104199             |
| 2581001 | Heat Economy                                                                                      | M-WIWI-101452             |
| 2581003 | Energy and Environment                                                                            | M-WIWI-101452             |
| 2581007 | Quantitative Methods in Energy Economics                                                          | M-WIWI-101451             |
| 2581008 | Übungen zu Quantitative Methods in Energy Economics                                               | M-WIWI-101451             |
| 2581023 | (Smart) Energy Infrastructure                                                                     | M-WIWI-101452             |
| 2581025 | Simulation Game in Energy Economics                                                               | M-WIWI-101451             |
| 2581954 | Production and Logistics Management                                                               | M-WIWI-101412             |
| 2581955 | Production and Logistics Managment                                                                | M-WIWI-101412             |
| 2581998 | Liberalised Power Markets                                                                         | M-WIWI-101451             |
| 3137020 | Measurement and Control Systems                                                                   | M-MACH-102564             |
| 3137021 | Measurement and Control Systems (Tutorial)                                                        | M-MACH-102564             |
| 4010051 | Moderne Experimentalphysik II (Struktur der Materie)                                              | M-PHYS-106332             |
| 4010052 | Übungen zu Moderne Experimentalphysik II                                                          | M-PHYS-106332             |
| 4010151 | Moderne Theoretische Physik II (Quantenmechanik II und Statistik)                                 | M-PHYS-106335             |
| 4010152 | Übungen zu Moderne Theoretische Physik II                                                         | M-PHYS-106335             |
| 4011113 | lab course physics P1 (monday) WS25/26                                                            | M-PHYS-101353             |
| 4011123 | Praktikum Klassische Physik P1 (donnerstags) WS25/26                                              | M-PHYS-101353             |
| 4012131 | Moderne Theoretische Physik für Lehramtskandidaten                                                | M-PHYS-101664             |
| 4012132 | Übungen zu Moderne Theoretische Physik für Lehramtskandidaten                                     | M-PHYS-101664             |
| 4022031 | Particle Physics I                                                                                | M-PHYS-102114             |
| 4022032 | Exercises to Particle Physics I                                                                   | M-PHYS-102114             |
| 4044021 | KSOP - Fundamentals of Optics & Photonics                                                         | M-PHYS-101927             |
| 4044022 | KSOP - Exercises to Fundamentals of Optics & Photonics                                            | M-PHYS-101927             |
| 4052061 | Middle Atmosphere in the Climate System                                                           | M-PHYS-104577             |
| 4052071 | Atmospheric Radiation                                                                             | M-PHYS-104577             |
| 4052101 | Arctic Climate System                                                                             | M-PHYS-104577             |
| 4052111 | Tropical Meteorology                                                                              | M-PHYS-104577             |
| 4052112 | Exercises to Tropical Meteorology                                                                 | M-PHYS-104577             |
| 4052121 | Ocean-Atmosphere Interactions                                                                     | M-PHYS-104577             |
| 4052131 | Energetics                                                                                        | M-PHYS-104577             |
| 4052194 | Seminar on IPCC Assessment Report                                                                 | M-PHYS-104577             |
| 5000048 | Socio-scientific Theories of Technology Assessment                                                | M-GEISTSOZ-103737         |
| 5011004 | Analysis of Social Structures                                                                     | M-GEISTSOZ-103737         |
| 5011006 | Gender Pay Gap                                                                                    | M-GEISTSOZ-103736         |
| 5011007 | Data Analysis                                                                                     | M-GEISTSOZ-103737         |
| 5011008 | Decomposition and Regression Analysis                                                             | M-GEISTSOZ-103736         |
| 5011011 | Artificial intelligence in the research process                                                   | M-GEISTSOZ-103737         |
| 5011013 | Digital democracy: worries                                                                        | M-GEISTSOZ-103737         |
| 5011018 | Computational Social Science: Topics and positions in the German Parliament (Part                 | M-GEISTSOZ-103736         |
| 5011019 | How to control algorithms?                                                                        | M-GEISTSOZ-103737         |
| 5012002 | Introduction to Philosophy IV - Group A                                                           | M-GEISTSOZ-107546         |
| 5012007 | Introduction to Philosophy IV - Group B                                                           | M-GEISTSOZ-107546         |
| 5012016 | Cultural History of Mobility. From Antiquity to the Present                                       | M-INFO-104941             |
| 5012017 | Introduction to Philosophy II                                                                     | M-GEISTSOZ-107546         |
| 5012019 | The Humanities in the Nazi-period                                                                 | M-GEISTSOZ-107546         |
| 5012022 | Introduction to Philosophy IV - Group C                                                           | M-GEISTSOZ-107546         |
| 5012046 | The History of Scientific Expeditions in its Colonial Contexts                                    | M-GEISTSOZ-107546         |
| 5012052 | Forum for Critical Interdisciplinarity                                                            | M-GEISTSOZ-104510         |
| 5012070 | Advanced Graduate                                                                                 | M-GEISTSOZ-104510         |
| 6232701 | Calculation Methods and Models in Traffic Planning                                                | M-BGU-102963              |
| 6232703 | Road Traffic Engineering                                                                          | M-BGU-102963              |
| 6232802 | Traffic Management and Telematics                                                                 | M-BGU-106811              |
| 6232804 | Traffic Simulation                                                                                | M-BGU-102963              |
| 6232809 | Freight Transport                                                                                 | M-BGU-106811              |
| 6232901 | Empirical Data in Transportation                                                                  | M-BGU-106811              |
| 6232903 | Seminar on Transportation Systems                                                                 | M-BGU-106811              |
| 6232904 | Long-distance and Air Transportation                                                              | M-BGU-106811              |
| 6232905 | Information Management for Public Mobility Services                                               | M-BGU-106811              |
| 6232907 | Seminar Modeling and Simulation in Transportation                                                 | M-BGU-106811              |

## Other catalog entries

The full mapping also flags shared courses and unmatched records outside the approved set. They remain unchanged. The private `.work/catalog-consolidation-report.json` contains the final skipped identifiers and reasons; the timestamped backup contains pre-change records and links. Do not commit private backups. The approved 359-pair scope is preserved in `data/module-consolidation-approved-2026-10-20.json`.

See [the consolidation runbook](MODULE_CONSOLIDATION.md) for reproducible commands, tests and recovery. Never expand the approved set by silently choosing a parent or translating a title heuristically.
