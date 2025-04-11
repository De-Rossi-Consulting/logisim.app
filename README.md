# <img src="./public/favicon.ico" style="width:50px; position: relative; top: 15px;"/> Logisim Online

[Logisim](https://www.cburch.com/logisim/) is a globally-used educational tool for desiging and simulating digital logic circuits. Originally written in Java, we used [CheerpJ](https://cheerpj.com/) to compile it into [WebAssembly](https://webassembly.org/) and added a few modifications to allow the use of files directly from local storage. 

This allows Logisim Online to be used in all modern browsers and devices (including mobile!) without the need for installation or a Java runtime environment. 

👉 Try it out [here](https://logisim.app/)!

> [!NOTE]
> - See our [announcement](https://drs.software/blog/announcing-logisim)  
> - See our [technical breakdown](#)
>

---

![Screenshot of Logisim Online]()

## Host Logisim Online Yourself

### Compile the Jar file
To compile the jar file use python version 3+ to run the following file
```
logisim/scripts/create-jar.py
```