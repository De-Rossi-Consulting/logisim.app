# <img src="./public/favicon.ico" style="width:50px; position: relative; top: 15px;"/> Logisim Online

[Logisim](https://www.cburch.com/logisim/) is a globally-used educational tool for desiging and simulating digital logic circuits. Originally written in Java, we used [CheerpJ](https://cheerpj.com/) to compile it into [WebAssembly](https://webassembly.org/) and added a few modifications to allow the use of files directly from local storage. 

This allows Logisim Online to be used in all modern browsers and devices (including mobile!) without the need for installation or a Java runtime environment. 

👉 Try it out [here](https://logisim.app/)!

> [!IMPORTANT]
> Want to find out more?
> - See our [announcement](https://drs.software/blog/announcing-logisim)  
> - See our [technical breakdown](#)

---

![Screenshot of Logisim Online]()

This project was made by [DRS Software](https://drs.software/)

---

## <img src="./misc/github-images/wasm.ico" style="width:20px; position: relative; top: 2px;"/> How to compile Logisim Online
The main bulk of the project comes a the compiled `.jar` file of the minimally modified original [Logisim source code](https://sourceforge.net/projects/circuit/). This `.jar` is then executed directly in the browser using [CheerpJ](https://cheerpj.com/), wrapped with a lightweight HTML/CSS/JS frontend for interaction and file handling.

### 🔧 Dependencies

To run this project, you'll need:

- 🐍 [Python 3+](https://www.python.org/downloads/)
- ☕ Java 8 (We recommend [OpenJDK 8](https://openjdk.org/projects/jdk8/))
- [Nodejs](https://nodejs.org/en/download/)

> [!NOTE]
> Logisim can be compiled with an earlier version of Java however we use Java 8 as its the closest version CheerpJ supports

### ⬇️ Run the Repo
To run the repo locally clone it and use npm to run a dev local server:

```sh
git clone https://github.com/De-Rossi-Consulting/logisim-legacy-wasm.git
cd logisim-legacy-wasm
npm install
npm run dev
```

If all is working, you should see something like the following:
```
> logisim-legacy-wasm@0.0.0 dev
> vite


  VITE v6.2.5  ready in 671 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```
If you want to edit the java files you will need to **build the `.jar` file**.

### 📦 Building the `.jar`
To build the `.jar` file we can use the `create-jar.py` file included in the original source code. 

To run the script you can do the following:
```sh
python3 ~/PATH TO LOGISIM REPO/logisim-legacy-wasm/logisim/scripts/create-jar.py -d ~/PATH TO LOGISIM REPO/logisim-legacy-wasm/public
```
(Make sure to replace `PATH TO LOGISIM REPO` with the absolute path to the repositry directory)

This will automatically build the `.jar` file and plac eit in the right directory. If you **reload the Logisim Online Page** you should see your changes!