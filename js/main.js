let gyogyszerlista = document.querySelector("#gyogyszerlistaContainer");
let printsection = document.querySelector("#print-section");
let personalProfileFile = document.querySelector("#personal-profile-file");
let gyogyszerContainer = document.querySelector("#gyogyszer-container");
let profileSelector = document.querySelector("#profile-selector");
let alertDiv = document.querySelector("#alert-div");

let headerLine = null;
let szemelyNeve = null;
let szemelySzuletesiDatum = null;
let szemelyTajSzam = null;
let gyogyszerId = null;
let gyogyszerObjects = [];
let selectedItems = 0;
let dragging = 0;
let validProfileFile = false;

personalProfileFile.addEventListener("change", readProfileFile);

profileSelector.ondragover = function (evt) {
    dragging++;
    profileSelector.classList.add("dragover");
    profileSelector.style.background = "yellow";
    profileSelector.style.border = "1px dashed black";
    evt.preventDefault();
};

profileSelector.ondragleave = function () {
    dragging--;
    if (dragging == 0) {
        profileSelector.classList.remove("dragover");
    }
    profileSelector.style.background = "white";
    profileSelector.style.border = "1px dotted black";
};

profileSelector.ondrop = function (evt) {
    profileSelector.classList.remove("dragover");
    personalProfileFile.files = evt.dataTransfer.files;
    let droppedFile = personalProfileFile.files[0];

    if (droppedFile.type == "text/plain") {
        validProfileFile = true;
        const dT = new DataTransfer();
        dT.items.add(evt.dataTransfer.files[0]);
        personalProfileFile.files = dT.files;

        readProfileFile();
        evt.preventDefault();
    } else {
        setAlertText("Érvénytelen profilfájl!");
        profileSelector.style.background = "white";
        profileSelector.style.border = "1px dotted black";
        evt.preventDefault();
    }
};

function titleAction() {
    personalProfileFile.value = "";
    location.reload();
}

function setAlertText(text) {
    alertDiv.innerHTML = text;
    alertDiv.style.display = "block";
}

function hideAlertText() {
    alertDiv.style.display = "none";
}

function readProfileFile() {
    hideAlertText();
    let file = personalProfileFile.files[0];
    let reader = new FileReader();

    reader.onload = function () {
        let rowCounter = 0;
        let gyogyszerek = []
        for (let i = 0; i < this.result.split("\n").length; i++) {
            let line = String(this.result.split("\n")[i]).replace("\r", "").trim();

            if (line) {
                rowCounter++;
                if (rowCounter === 1) {
                    // Check first line
                    if ((line.match(/\|/g) || []).length === 2) {
                        validProfileFile = true;
                        szemelyNeve = line.split("|")[0];
                        szemelySzuletesiDatum = line.split("|")[1];
                        szemelyTajSzam = line.split("|")[2];
                    } else {
                        setAlertText("Érvénytelen profilfájl!");
                        setTimeout(function () {
                        }, 50);
                    }
                } else {
                    // Check lines from second line
                    if ((line.match(/\|/g) || []).length === 1 && validProfileFile) {
                        gyogyszerek.push(line);
                    } else {
                        validProfileFile = false;
                        setTimeout(function () {
                            setAlertText("Érvénytelen profilfájl!");
                        }, 50);
                    }
                }
            }
        }

        gyogyszerScanner(gyogyszerek);
    };

    if (file) {
        reader.readAsText(file);
        setTimeout(function () {
            szuksegesGyogyszerekAction(gyogyszerObjects);
        }, 50);
    }
}

function gyogyszerScanner(gyogyszerArray) {
    for (let i = 0; i < gyogyszerArray.length; i++) {
        gyogyszerNameShort = gyogyszerArray[i].split("|")[0];
        gyogyszerNameLong = gyogyszerArray[i].split("|")[1];
        gyogyszerObjects.push(gyogyszerObject = {
            gyogyszerId: `gyogyszer_${i}`,
            gyogyszerNameShort: gyogyszerNameShort,
            gyogyszerNameLong: gyogyszerNameLong
        });
    }
}

function setPreviewPrintListHeader() {
    let listaTitle = document.querySelector("#lista-title");
    let listaSubTitle = document.querySelector("#lista-subtitle");
    listaTitle.innerHTML = `${szemelyNeve} - Felírandó gyógyszer(ek):`;
    listaSubTitle.innerHTML = `(Szül.: ${szemelySzuletesiDatum} - TAJ: ${szemelyTajSzam})`;
}

function generateCheckbox(gyogyszerId, gyogyszerNameShort, gyogyszerNameLong) {
    let label = document.createElement("label");
    let checkBox = document.createElement("input");
    let br = document.createElement("br");

    label.setAttribute("for", gyogyszerId);
    label.innerHTML = gyogyszerNameShort;
    checkBox.setAttribute("type", "checkbox");
    checkBox.setAttribute("id", gyogyszerId);
    checkBox.addEventListener("click", gyogyszerAction.bind(event, gyogyszerId, gyogyszerNameLong));
    gyogyszerContainer.appendChild(label);
    gyogyszerContainer.appendChild(checkBox);
    gyogyszerContainer.appendChild(br);
    gyogyszerContainer.appendChild(br);
}

function szuksegesGyogyszerekAction(gyogyszerobjects) {
    if (validProfileFile) {
        gyogyszerContainer.style.display = "block";
        setTimeout(function () {
            document.querySelector("#profile-selector").style.display = "none";
            setPreviewPrintListHeader();
            for (let i = 0; i < gyogyszerobjects.length; i++) {
                let gyogyszerId = gyogyszerobjects[i].gyogyszerId;
                let gyogyszerNameShort = gyogyszerobjects[i].gyogyszerNameShort;
                let gyogyszerNameLong = gyogyszerobjects[i].gyogyszerNameLong;
                generateCheckbox(gyogyszerId, gyogyszerNameShort, gyogyszerNameLong);
            }
        }, 50);
    } else {
        profileSelector.style.background = "white";
        profileSelector.style.border = "1px dotted black";
    }
}

function gyogyszerAction(gyogyszerId, gyogyszerNameLong) {
    let checkBox = document.querySelector(`#${gyogyszerId}`);
    if (checkBox.checked == true) {
        showGyogyszer(gyogyszerId, gyogyszerNameLong)
        selectedItems++;
        hideUnnecessaryItems();
    } else {
        hideGyogyszer(gyogyszerId);
        selectedItems--;
        hideUnnecessaryItems();
    }
}

function showGyogyszer(gyogyszerId, gyogyszerNameLong) {
    let gyogyszerlistaContainer = document.querySelector("#gyogyszerlistaContainer");
    let par = document.createElement("p");
    par.setAttribute("id", (`${gyogyszerId}-list-item`));
    par.setAttribute("class", "list-item");
    par.setAttribute("style", "display:block");
    par.innerHTML = "<li>" + gyogyszerNameLong + "</li>";
    gyogyszerlistaContainer.appendChild(par);
}

function hideGyogyszer(gyogyszerId) {
    let par = document.querySelector(`#${gyogyszerId}-list-item`);
    let gyogyszerlistaContainer = document.querySelector("#gyogyszerlistaContainer");
    par.style.display = "none";
    gyogyszerlistaContainer.removeChild(par);
}

function PrintElem() {
    let elem = document.querySelector("#gyogyszerlistaContainer");
    let mywindow = window.open('', 'PRINT', 'height=600,width=1000');

    mywindow.document.write('<html><head><title>' + document.title + '</title>');
    mywindow.document.write('</head><body>');

    mywindow.document.write('<div id="gyogyszerlistaContainer">');
    mywindow.document.write(elem.innerHTML);
    mywindow.document.write('</div>');

    let gyogyszerlistaContainer = mywindow.document.body.querySelector("#gyogyszerlistaContainer");
    let listaTitle = gyogyszerlistaContainer.querySelector("#lista-title");
    let listaSubtitle = gyogyszerlistaContainer.querySelector("#lista-subtitle");
    let listaItems = gyogyszerlistaContainer.querySelectorAll(".list-item");

    gyogyszerlistaContainer.style.marginTop = "0px";
    gyogyszerlistaContainer.style.width = "auto";
    gyogyszerlistaContainer.style.height = "auto";
    gyogyszerlistaContainer.style.backgroundColor = "white";
    gyogyszerlistaContainer.style.margin = "auto";
    gyogyszerlistaContainer.style.borderBottom = "1px dotted black";
    gyogyszerlistaContainer.style.padding = "30px";
    listaTitle.style.textAlign = "center";
    listaTitle.style.fontSize = "30px"
    listaSubtitle.style.textAlign = "center";
    listaSubtitle.style.fontSize = "20px";
    listaSubtitle.style.paddingBottom = "30px";

    for (let i = 0; i < listaItems.length; i++) {
        listaItems[i].style.fontSize = "20px";
    }

    mywindow.document.write('</body></html>');
    mywindow.document.close();

    mywindow.focus();
    mywindow.print();
    mywindow.close();

    return true;
}

function hideUnnecessaryItems() {
    if (selectedItems != 0) {
        gyogyszerlista.style.display = "block";
        printsection.style.display = "block";
    } else {
        gyogyszerlista.style.display = "none";
        printsection.style.display = "none";
    }
}
