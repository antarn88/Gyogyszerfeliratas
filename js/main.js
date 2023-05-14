let gyogyszerlista = document.querySelector('#gyogyszerlistaContainer');
let printsection = document.querySelector('#print-section');
let personalProfileFile = document.querySelector('#personal-profile-file');
let gyogyszerContainer = document.querySelector('#gyogyszer-container');
let profileSelector = document.querySelector('#profile-selector');
let alertDiv = document.querySelector('#alert-div');
let createProfileModal = document.querySelector('#create-profile-modal');
let createProfileButton = document.querySelector('#create-profile-button');
let closeButton = document.querySelectorAll('.close')[0];
let printTypeSection = document.getElementById('print-type-section');

let szemelyNeve = null;
let szemelySzuletesiDatum = null;
let szemelyTajSzam = null;
let gyogyszerId = null;
let gyogyszerObjects = [];
let selectedItems = 0;
let dragging = 0;
let newGyogyszerCount = 1;
let validProfileFile = false;
let newProfile = {};
let newProfileFileContent = [];
let printType = 'feliratas';

personalProfileFile.addEventListener('change', readProfileFile);

// Create profile modal stuffs
createProfileButton.onclick = function () {
  document.body.style.overflowY = 'unset';
  createProfileModal.style.display = 'block';
  document.querySelector('#nev').focus();
};

closeButton.onclick = function () {
  createProfileModal.style.display = 'none';
  document.body.style.overflowY = 'scroll';
};

profileSelector.ondragover = function (evt) {
  dragging++;
  profileSelector.classList.add('dragover');
  profileSelector.style.background = 'yellow';
  profileSelector.style.border = '1px dashed black';
  evt.preventDefault();
};

profileSelector.ondragleave = function () {
  dragging--;
  if (dragging === 0) {
    profileSelector.classList.remove('dragover');
  }
  profileSelector.style.background = 'white';
  profileSelector.style.border = '1px dotted black';
};

profileSelector.ondrop = function (evt) {
  profileSelector.classList.remove('dragover');
  personalProfileFile.files = evt.dataTransfer.files;
  let droppedFile = personalProfileFile.files[0];

  if (droppedFile.type === 'text/plain' && String(droppedFile.name).endsWith('.txt')) {
    validProfileFile = true;
    const dT = new DataTransfer();
    dT.items.add(evt.dataTransfer.files[0]);
    personalProfileFile.files = dT.files;

    readProfileFile();
    evt.preventDefault();
  } else {
    setAlertText('Érvénytelen profilfájl!');
    profileSelector.style.background = 'white';
    profileSelector.style.border = '1px dotted black';
    evt.preventDefault();
  }
};

if (printTypeSection) {
  printTypeSection.style.display = 'none';
}

function titleAction() {
  personalProfileFile.value = '';
  location.reload();
}

function setAlertText(text) {
  alertDiv.innerHTML = text;
  alertDiv.style.display = 'block';
}

function hideAlertText() {
  alertDiv.style.display = 'none';
}

function hideNewProfileBtn() {
  createProfileButton.style.display = 'none';
}

const setRadioButtonsEvents = () => {
  const printTypes = document.querySelectorAll('input[name="printType"]');
  printTypes.forEach((printType) => {
    printType.addEventListener('change', (event) => {
      if (event.target) {
        printType = event.target.value;
        setPreviewPrintListHeader(printType);
      }
    });
  });
};

function readProfileFile() {
  hideAlertText();
  let file = personalProfileFile.files[0];

  if (String(file.name).endsWith('.txt')) {
    let reader = new FileReader();

    reader.onload = function () {
      let rowCounter = 0;
      let gyogyszerek = [];
      for (let i = 0; i < this.result.split('\n').length; i++) {
        let line = String(this.result.split('\n')[i]).replace('\r', '').trim();

        if (line) {
          rowCounter++;
          if (rowCounter === 1) {
            // Check first line
            if ((line.match(/\|/g) || []).length === 2) {
              validProfileFile = true;
              szemelyNeve = line.split('|')[0];
              szemelySzuletesiDatum = line.split('|')[1];
              szemelyTajSzam = line.split('|')[2];
            } else {
              setTimeout(function () {
                setAlertText('Érvénytelen profilfájl!');
              }, 50);
            }
          } else {
            // Check lines from second line
            if ((line.match(/\|/g) || []).length === 1 && validProfileFile) {
              gyogyszerek.push(line);
            } else {
              validProfileFile = false;
              setTimeout(function () {
                setAlertText('Érvénytelen profilfájl!');
              }, 50);
            }
          }
        }
      }

      if (validProfileFile) hideNewProfileBtn();
      gyogyszerScanner(gyogyszerek);
    };

    if (file) {
      reader.readAsText(file);
      setTimeout(function () {
        szuksegesGyogyszerekAction(gyogyszerObjects);
      }, 100);
    }

    setRadioButtonsEvents();
    if (printTypeSection) {
      printTypeSection.style.display = 'block';
    }
  } else {
    validProfileFile = false;
    setTimeout(function () {
      setAlertText('Érvénytelen profilfájl!');
    }, 50);
  }
}

function gyogyszerScanner(gyogyszerArray) {
  let gyogyszerNameShort;
  let gyogyszerNameLong;
  for (let i = 0; i < gyogyszerArray.length; i++) {
    gyogyszerNameShort = gyogyszerArray[i].split('|')[0];
    gyogyszerNameLong = gyogyszerArray[i].split('|')[1];
    gyogyszerObjects.push({
      gyogyszerId: `gyogyszer_${i}`,
      gyogyszerNameShort: gyogyszerNameShort,
      gyogyszerNameLong: gyogyszerNameLong,
    });
  }
}

function setPreviewPrintListHeader(printType = 'feliratas') {
  let listaTitle = document.querySelector('#lista-title');
  let listaSubTitle = document.querySelector('#lista-subtitle');
  listaTitle.innerHTML = `${szemelyNeve} - ${
    printType === 'feliratas' ? 'Felírandó gyógyszer(ek):' : 'GYÓGYSZERTÁRBÓL KI KELL VÁLTANI:'
  } `;
  listaSubTitle.innerHTML = `(Szül.: ${szemelySzuletesiDatum} - TAJ: ${szemelyTajSzam})`;
}

function generateCheckbox(gyogyszerId, gyogyszerNameShort, gyogyszerNameLong) {
  let label = document.createElement('label');
  let checkBox = document.createElement('input');
  let br = document.createElement('br');

  label.setAttribute('for', gyogyszerId);
  label.innerHTML = gyogyszerNameShort;
  checkBox.setAttribute('type', 'checkbox');
  checkBox.setAttribute('id', gyogyszerId);
  checkBox.addEventListener('click', gyogyszerAction.bind(null, gyogyszerId, gyogyszerNameLong));
  gyogyszerContainer.appendChild(label);
  gyogyszerContainer.appendChild(checkBox);
  gyogyszerContainer.appendChild(br);
  gyogyszerContainer.appendChild(br);
}

function szuksegesGyogyszerekAction(gyogyszerobjects) {
  if (validProfileFile) {
    gyogyszerContainer.style.display = 'block';
    setTimeout(function () {
      document.querySelector('#profile-selector').style.display = 'none';
      setPreviewPrintListHeader();
      for (let i = 0; i < gyogyszerobjects.length; i++) {
        let gyogyszerId = gyogyszerobjects[i].gyogyszerId;
        let gyogyszerNameShort = gyogyszerobjects[i].gyogyszerNameShort;
        let gyogyszerNameLong = gyogyszerobjects[i].gyogyszerNameLong;
        generateCheckbox(gyogyszerId, gyogyszerNameShort, gyogyszerNameLong);
      }
    }, 50);
  } else {
    profileSelector.style.background = 'white';
    profileSelector.style.border = '1px dotted black';
  }
}

function gyogyszerAction(gyogyszerId, gyogyszerNameLong) {
  let checkBox = document.querySelector(`#${gyogyszerId}`);
  if (checkBox.checked === true) {
    showGyogyszer(gyogyszerId, gyogyszerNameLong);
    selectedItems++;
    hideUnnecessaryItems();
  } else {
    hideGyogyszer(gyogyszerId);
    selectedItems--;
    hideUnnecessaryItems();
  }
}

function showGyogyszer(gyogyszerId, gyogyszerNameLong) {
  let gyogyszerlistaContainer = document.querySelector('#gyogyszerlistaContainer');
  let par = document.createElement('p');
  par.setAttribute('id', `${gyogyszerId}-list-item`);
  par.setAttribute('class', 'list-item');
  par.setAttribute('style', 'display:block');
  par.innerHTML = '<li>' + gyogyszerNameLong + '</li>';
  gyogyszerlistaContainer.appendChild(par);
}

function hideGyogyszer(gyogyszerId) {
  let par = document.querySelector(`#${gyogyszerId}-list-item`);
  let gyogyszerlistaContainer = document.querySelector('#gyogyszerlistaContainer');
  par.style.display = 'none';
  gyogyszerlistaContainer.removeChild(par);
}

function PrintElem() {
  let elem = document.querySelector('#gyogyszerlistaContainer');
  let mywindow = window.open('', 'PRINT', 'height=600,width=1000');

  mywindow.document.write('<html lang="hu"><head><title>' + document.title + '</title>');
  mywindow.document.write('</head><body>');

  mywindow.document.write('<div id="gyogyszerlistaContainer">');
  mywindow.document.write(elem.innerHTML);
  mywindow.document.write('</div>');

  let gyogyszerlistaContainer = mywindow.document.body.querySelector('#gyogyszerlistaContainer');
  let listaTitle = gyogyszerlistaContainer.querySelector('#lista-title');
  let listaSubtitle = gyogyszerlistaContainer.querySelector('#lista-subtitle');
  let listaItems = gyogyszerlistaContainer.querySelectorAll('.list-item');

  gyogyszerlistaContainer.style.marginTop = '0px';
  gyogyszerlistaContainer.style.width = 'auto';
  gyogyszerlistaContainer.style.height = 'auto';
  gyogyszerlistaContainer.style.backgroundColor = 'white';
  gyogyszerlistaContainer.style.margin = 'auto';
  gyogyszerlistaContainer.style.borderBottom = '1px dotted black';
  gyogyszerlistaContainer.style.padding = '30px';
  listaTitle.style.textAlign = 'center';
  listaTitle.style.fontSize = '30px';
  listaSubtitle.style.textAlign = 'center';
  listaSubtitle.style.fontSize = '20px';
  listaSubtitle.style.paddingBottom = '30px';

  for (let i = 0; i < listaItems.length; i++) {
    listaItems[i].style.fontSize = '20px';
  }

  mywindow.document.write('</body></html>');
  mywindow.document.close();

  mywindow.focus();
  mywindow.print();
  mywindow.close();

  return true;
}

function hideUnnecessaryItems() {
  if (selectedItems !== 0) {
    gyogyszerlista.style.display = 'block';
    printsection.style.display = 'block';
  } else {
    gyogyszerlista.style.display = 'none';
    printsection.style.display = 'none';
  }
}

function gyogyszerPlus() {
  newGyogyszerCount++;
  let szedettGyogyszerek = document.querySelector('#szedett-gyogyszerek');
  let row = document.createElement('div');
  let gyogyszerNameShortDiv = document.createElement('div');
  let gyogyszerNameShortInput = document.createElement('input');
  let gyogyszerNameLongDiv = document.createElement('div');
  let gyogyszerNameLongInput = document.createElement('input');

  row.setAttribute('class', 'form-group row gyogyszer-row');
  szedettGyogyszerek.appendChild(row);

  gyogyszerNameShortDiv.setAttribute('class', 'col-sm-5');
  gyogyszerNameShortInput.setAttribute('type', 'text');
  gyogyszerNameShortInput.setAttribute('class', 'form-control');
  gyogyszerNameShortInput.setAttribute('id', `gyogyszer-name-short_${newGyogyszerCount}`);
  gyogyszerNameShortInput.setAttribute('placeholder', 'Gyógyszer neve');
  gyogyszerNameShortInput.setAttribute('title', 'Például: Algoflex');
  gyogyszerNameShortDiv.appendChild(gyogyszerNameShortInput);

  gyogyszerNameLongDiv.setAttribute('class', 'col-sm-7');
  gyogyszerNameLongInput.setAttribute('type', 'text');
  gyogyszerNameLongInput.setAttribute('class', 'form-control');
  gyogyszerNameLongInput.setAttribute('id', `gyogyszer-name-long_${newGyogyszerCount}`);
  gyogyszerNameLongInput.setAttribute('placeholder', 'Gyógyszer neve hosszan');
  gyogyszerNameLongInput.setAttribute('title', 'Például: Algoflex Ultra Forte 600 mg filmtabletta');
  gyogyszerNameLongDiv.appendChild(gyogyszerNameLongInput);

  row.appendChild(gyogyszerNameShortDiv);
  row.appendChild(gyogyszerNameLongDiv);
  gyogyszerNameShortInput.focus();
}

function createProfileAction() {
  let nev = document.querySelector('#nev');
  let szulDatum = document.querySelector('#szul-datum');
  let tajSzam = document.querySelector('#taj-szam');
  let szedettGyogyszerek = document.querySelectorAll('#szedett-gyogyszerek .gyogyszer-row');
  let isEmptyAnyGyogyszerField = false;

  if (!(isEmptyField(nev) || isEmptyField(szulDatum) || isEmptyField(tajSzam))) {
    newProfile.nev = nev.value;
    newProfile.szulDatum = szulDatum.value;
    newProfile.tajSzam = tajSzam.value;
    newProfile.szedettGyogyszerek = [];

    for (let i = 0; i < szedettGyogyszerek.length; i++) {
      let gyogyszerNameShort = szedettGyogyszerek[i].querySelector("[id^='gyogyszer-name-short']");
      let gyogyszerNameLong = szedettGyogyszerek[i].querySelector("[id^='gyogyszer-name-long']");

      if (!(isEmptyField(gyogyszerNameShort) || isEmptyField(gyogyszerNameLong))) {
        newProfile.szedettGyogyszerek.push({
          gyogyszerNameShort: gyogyszerNameShort.value,
          gyogyszerNameLong: gyogyszerNameLong.value,
        });
      } else {
        isEmptyAnyGyogyszerField = true;
        break;
      }
    }

    if (!isEmptyAnyGyogyszerField) {
      // Print file format output
      newProfileFileContent.push(nev.value + '|' + szulDatum.value + '|' + tajSzam.value);

      for (let i = 0; i < newProfile.szedettGyogyszerek.length; i++) {
        newProfileFileContent.push(
          newProfile.szedettGyogyszerek[i].gyogyszerNameShort + '|' + newProfile.szedettGyogyszerek[i].gyogyszerNameLong
        );
      }

      createProfileModal.style.display = 'none';
      newProfileFileWriter();
      clearNewProfileForm();
    }
  }
}

function clearNewProfileForm() {
  document.querySelector('#new-profile-form').reset();

  // Restore one line medicine row
  let rows = document.querySelectorAll('.gyogyszer-row');
  for (let i = 0; i < rows.length; i++) {
    if (i !== 0) {
      rows[i].parentNode.removeChild(rows[i]);
    }
  }
  newGyogyszerCount = 1;
}

function newProfileFileWriter() {
  let filename = newProfile.nev;
  let text = '';

  for (let i = 0; i < newProfileFileContent.length; i++) {
    let line = newProfileFileContent[i];
    text += line + '\n';
  }

  text = text.substring(0, text.length - 1);
  let blob = new Blob([text], { type: 'text/plain' });

  let a = document.createElement('a');
  a.setAttribute('download', filename);
  a.setAttribute('href', window.URL.createObjectURL(blob));
  a.click();
  titleAction();
}

function isEmptyField(element) {
  if (element.value === '') {
    alert('Ne hagyd üresen egyik mezőt sem!');
    element.focus();
    return true;
  }
  return false;
}
