/**
 * Gyógyszerfelíratás - Modern Refactored Application
 * ES6+ Class-based architecture
 */
class GyogyszerfeliratasApp {
  constructor() {
    // State
    this.szemelyNeve = null;
    this.szemelySzuletesiDatum = null;
    this.szemelyTajSzam = null;
    this.gyogyszerObjects = [];
    this.selectedItems = 0;
    this.dragging = 0;
    this.newGyogyszerCount = 1;
    this.validProfileFile = false;
    this.newProfile = {};
    this.newProfileFileContent = [];
    this.printType = 'feliratas';

    // DOM References
    this.elements = {
      gyogyszerlistaContainer: document.getElementById('gyogyszerlistaContainer'),
      previewItems: document.getElementById('preview-items'),
      printSection: document.getElementById('print-section'),
      personalProfileFile: document.getElementById('personal-profile-file'),
      gyogyszerContainer: document.getElementById('gyogyszer-container'),
      medicineList: document.getElementById('medicine-list'),
      profileSelector: document.getElementById('profile-selector'),
      alertDiv: document.getElementById('alert-div'),
      createProfileModal: document.getElementById('create-profile-modal'),
      createProfileButton: document.getElementById('create-profile-button'),
      closeModalBtn: document.getElementById('close-modal-btn'),
      printTypeSection: document.getElementById('print-type-section'),
      titleLink: document.getElementById('title-link'),
      listaTitle: document.getElementById('lista-title'),
      listaSubtitle: document.getElementById('lista-subtitle'),
      addMedicineBtn: document.getElementById('add-medicine-btn'),
      newProfileForm: document.getElementById('new-profile-form'),
      szedettGyogyszerek: document.getElementById('szedett-gyogyszerek'),
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.initLucideIcons();
  }

  initLucideIcons() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // ===== Event Binding =====
  bindEvents() {
    // File input change
    this.elements.personalProfileFile.addEventListener('change', () => this.readProfileFile());

    // Title link - reload
    this.elements.titleLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.titleAction();
    });

    // Create profile modal
    this.elements.createProfileButton.addEventListener('click', () => this.openModal());
    this.elements.closeModalBtn.addEventListener('click', () => this.closeModal());
    this.elements.createProfileModal.addEventListener('click', (e) => {
      if (e.target === this.elements.createProfileModal) {
        this.closeModal();
      }
    });

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.createProfileModal.open) {
        this.closeModal();
      }
    });

    // Drag & drop
    this.elements.profileSelector.addEventListener('dragover', (e) => this.onDragOver(e));
    this.elements.profileSelector.addEventListener('dragleave', () => this.onDragLeave());
    this.elements.profileSelector.addEventListener('drop', (e) => this.onDrop(e));

    // Click on upload area triggers file input
    this.elements.profileSelector.addEventListener('click', (e) => {
      if (e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') {
        this.elements.personalProfileFile.click();
      }
    });

    // Radio buttons for print type
    this.bindRadioButtons();

    // Add medicine button in modal
    this.elements.addMedicineBtn.addEventListener('click', () => this.addMedicineRow());

    // Profile form submit
    this.elements.newProfileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.createProfileAction();
    });
  }

  bindRadioButtons() {
    const toggleOptions = document.querySelectorAll('.toggle-option');
    toggleOptions.forEach((option) => {
      option.addEventListener('click', () => {
        // Remove active from all
        toggleOptions.forEach((opt) => opt.classList.remove('active'));
        // Add active to clicked
        option.classList.add('active');
        // Update hidden radio
        const radio = option.querySelector('input[type="radio"]');
        radio.checked = true;
        // Update print type
        this.printType = option.dataset.value;
        this.setPreviewPrintListHeader();
        // Re-render preview items with new type
        this.refreshPreviewItems();
      });
    });
  }

  // ===== Drag & Drop =====
  onDragOver(e) {
    this.dragging++;
    this.elements.profileSelector.classList.add('dragover');
    e.preventDefault();
  }

  onDragLeave() {
    this.dragging--;
    if (this.dragging === 0) {
      this.elements.profileSelector.classList.remove('dragover');
    }
  }

  onDrop(e) {
    e.preventDefault();
    this.dragging = 0;
    this.elements.profileSelector.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const droppedFile = files[0];
    if (droppedFile.type === 'text/plain' || droppedFile.name.endsWith('.txt')) {
      const dT = new DataTransfer();
      dT.items.add(files[0]);
      this.elements.personalProfileFile.files = dT.files;
      this.readProfileFile();
    } else {
      this.setAlertText('Érvénytelen profilfájl!');
    }
  }

  // ===== Navigation =====
  titleAction() {
    this.elements.personalProfileFile.value = '';
    location.reload();
  }

  // ===== Alerts =====
  setAlertText(text) {
    const alert = this.elements.alertDiv;
    alert.textContent = text;
    alert.className = 'alert alert-danger show';
  }

  hideAlertText() {
    this.elements.alertDiv.className = 'alert';
  }

  // ===== Modal =====
  openModal() {
    this.elements.createProfileModal.showModal();
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      document.getElementById('nev').focus();
    }, 100);
  }

  closeModal() {
    this.elements.createProfileModal.close();
    document.body.style.overflow = '';
    this.clearNewProfileForm();
  }

  // ===== Profile File Reading =====
  readProfileFile() {
    this.hideAlertText();
    const file = this.elements.personalProfileFile.files[0];

    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      this.validProfileFile = false;
      setTimeout(() => this.setAlertText('Érvénytelen profilfájl!'), 50);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const rowCounter = 0;
      const gyogyszerek = [];
      const lines = reader.result.split('\n');

      let currentRowCounter = 0;
      let currentValid = true;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].replace('\r', '').trim();

        if (!line) continue;

        currentRowCounter++;

        if (currentRowCounter === 1) {
          // First line: Name|BirthDate|TAJ
          if ((line.match(/\|/g) || []).length === 2) {
            currentValid = true;
            const parts = line.split('|');
            this.szemelyNeve = parts[0];
            this.szemelySzuletesiDatum = parts[1];
            this.szemelyTajSzam = parts[2];
          } else {
            currentValid = false;
            setTimeout(() => this.setAlertText('Érvénytelen profilfájl!'), 50);
            break;
          }
        } else {
          // Medicine lines: ShortName|LongName
          if ((line.match(/\|/g) || []).length === 1 && currentValid) {
            gyogyszerek.push(line);
          } else {
            currentValid = false;
            setTimeout(() => this.setAlertText('Érvénytelen profilfájl!'), 50);
            break;
          }
        }
      }

      this.validProfileFile = currentValid;

      if (this.validProfileFile) {
        this.elements.createProfileButton.style.display = 'none';
        this.gyogyszerScanner(gyogyszerek);
        this.showMedicineSelection();
      }
    };

    reader.readAsText(file);

    // Show print type section
    this.elements.printTypeSection.hidden = false;
  }

  // ===== Medicine Scanner =====
  gyogyszerScanner(gyogyszerArray) {
    this.gyogyszerObjects = [];
    for (let i = 0; i < gyogyszerArray.length; i++) {
      const parts = gyogyszerArray[i].split('|');
      this.gyogyszerObjects.push({
        gyogyszerId: `gyogyszer_${i}`,
        gyogyszerNameShort: parts[0],
        gyogyszerNameLong: parts[1],
      });
    }
  }

  // ===== Show Medicine Selection =====
  showMedicineSelection() {
    if (!this.validProfileFile) return;

    // Hide profile selector, show medicine container
    this.elements.profileSelector.hidden = true;
    this.elements.gyogyszerContainer.hidden = false;

    this.setPreviewPrintListHeader();

    // Generate medicine checkboxes
    const list = this.elements.medicineList;
    list.innerHTML = '';

    this.gyogyszerObjects.forEach((gyogyszer) => {
      const item = this.createMedicineItem(gyogyszer);
      list.appendChild(item);
    });

    this.initLucideIcons();
  }

  createMedicineItem(gyogyszer) {
    const item = document.createElement('div');
    item.className = 'medicine-item';
    item.dataset.id = gyogyszer.gyogyszerId;

    item.innerHTML = `
      <input type="checkbox" class="medicine-checkbox" id="${gyogyszer.gyogyszerId}" />
      <label class="medicine-label" for="${gyogyszer.gyogyszerId}">${gyogyszer.gyogyszerNameShort}</label>
      <input type="number" class="medicine-qty" id="${gyogyszer.gyogyszerId}-piece" value="1" min="1" max="99" />
      <span class="medicine-qty-label">db</span>
    `;

    // Bind checkbox event
    const checkbox = item.querySelector('.medicine-checkbox');
    checkbox.addEventListener('change', () => {
      this.gyogyszerAction(gyogyszer.gyogyszerId, gyogyszer.gyogyszerNameLong, item);
    });

    // Bind quantity change to refresh preview
    const qtyInput = item.querySelector('.medicine-qty');
    qtyInput.addEventListener('change', () => {
      if (checkbox.checked) {
        this.refreshPreviewItems();
      }
    });

    return item;
  }

  // ===== Medicine Action (Checkbox Toggle) =====
  gyogyszerAction(gyogyszerId, gyogyszerNameLong, itemElement) {
    const checkBox = document.getElementById(gyogyszerId);

    if (checkBox.checked) {
      itemElement.classList.add('selected');
      this.selectedItems++;
    } else {
      itemElement.classList.remove('selected');
      this.selectedItems--;
    }

    this.refreshPreviewItems();
    this.togglePreviewVisibility();
  }

  // ===== Refresh Preview Items =====
  refreshPreviewItems() {
    const container = this.elements.previewItems;
    container.innerHTML = '';

    this.gyogyszerObjects.forEach((gyogyszer) => {
      const checkbox = document.getElementById(gyogyszer.gyogyszerId);
      if (checkbox && checkbox.checked) {
        const piece = document.getElementById(`${gyogyszer.gyogyszerId}-piece`)?.value || 1;
        const li = document.createElement('div');
        li.className = 'preview-item';

        if (this.printType === 'kivaltas') {
          li.textContent = `${gyogyszer.gyogyszerNameLong} — ${piece} doboz`;
        } else {
          li.textContent = gyogyszer.gyogyszerNameLong;
        }

        container.appendChild(li);
      }
    });
  }

  // ===== Toggle Preview & Print Section Visibility =====
  togglePreviewVisibility() {
    const hasSelection = this.selectedItems > 0;
    this.elements.gyogyszerlistaContainer.hidden = !hasSelection;
    this.elements.printSection.hidden = !hasSelection;
  }

  // ===== Print Preview Header =====
  setPreviewPrintListHeader() {
    const title = this.printType === 'feliratas' ? 'Felírandó gyógyszer(ek):' : 'Gyógyszer(ek) kiváltásra:';
    this.elements.listaTitle.textContent = `${this.szemelyNeve} — ${title}`;
    this.elements.listaSubtitle.textContent = `(Szül.: ${this.szemelySzuletesiDatum} — TAJ: ${this.szemelyTajSzam})`;
  }

  // ===== Print =====
  printList() {
    const elem = this.elements.gyogyszerlistaContainer;
    const printWindow = window.open('', 'PRINT', 'height=600,width=1000');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="hu">
      <head>
        <title>${document.title} - Nyomtatás</title>
        <style>
          body {
            font-family: 'Segoe UI', sans-serif;
            margin: 0;
            padding: 40px;
          }
          .preview-container {
            max-width: 600px;
            margin: 0 auto;
            border-bottom: 1px dotted #000;
            padding-bottom: 30px;
          }
          .preview-title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .preview-subtitle {
            text-align: center;
            font-size: 16px;
            margin-bottom: 24px;
            padding-bottom: 24px;
            border-bottom: 1px dotted #ccc;
          }
          .preview-item {
            font-size: 16px;
            padding: 6px 0 6px 20px;
            list-style: none;
            position: relative;
          }
          .preview-item::before {
            content: '';
            display: inline-block;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #000;
            margin-right: 12px;
            vertical-align: middle;
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
          }
        </style>
      </head>
      <body>
        <div class="preview-container">
          <div class="preview-title">${this.elements.listaTitle.textContent}</div>
          <div class="preview-subtitle">${this.elements.listaSubtitle.textContent}</div>
          ${this.elements.previewItems.innerHTML}
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  // ===== Add Medicine Row (in modal) =====
  addMedicineRow() {
    this.newGyogyszerCount++;
    const container = this.elements.szedettGyogyszerek;

    const row = document.createElement('div');
    row.className = 'gyogyszer-row gyogyszer-row-with-remove';
    row.innerHTML = `
      <input type="text" class="form-input" id="gyogyszer-name-short_${this.newGyogyszerCount}" placeholder="Rövid név" title="Például: Algoflex" />
      <input type="text" class="form-input" id="gyogyszer-name-long_${this.newGyogyszerCount}" placeholder="Teljes név" title="Például: Algoflex Ultra Forte 600 mg filmtabletta" />
      <button type="button" class="remove-medicine-btn" title="Gyógyszer eltávolítása">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </button>
    `;

    container.appendChild(row);

    // Bind remove button
    const removeBtn = row.querySelector('.remove-medicine-btn');
    removeBtn.addEventListener('click', () => {
      row.remove();
    });

    // Focus first input
    row.querySelector('input').focus();
  }

  // ===== Create Profile =====
  createProfileAction() {
    const nev = document.getElementById('nev');
    const szulDatum = document.getElementById('szul-datum');
    const tajSzam = document.getElementById('taj-szam');
    const medicineRows = this.elements.szedettGyogyszerek.querySelectorAll('.gyogyszer-row');

    // Validate main fields
    if (this.isEmptyField(nev) || this.isEmptyField(szulDatum) || this.isEmptyField(tajSzam)) {
      return;
    }

    this.newProfile = {
      nev: nev.value,
      szulDatum: szulDatum.value,
      tajSzam: tajSzam.value,
      szedettGyogyszerek: [],
    };

    let hasEmptyMedicine = false;

    for (const row of medicineRows) {
      const nameShort = row.querySelector("[id^='gyogyszer-name-short']");
      const nameLong = row.querySelector("[id^='gyogyszer-name-long']");

      if (!this.isEmptyField(nameShort) && !this.isEmptyField(nameLong)) {
        this.newProfile.szedettGyogyszerek.push({
          gyogyszerNameShort: nameShort.value,
          gyogyszerNameLong: nameLong.value,
        });
      } else {
        hasEmptyMedicine = true;
        break;
      }
    }

    if (hasEmptyMedicine) return;

    // Build file content
    this.newProfileFileContent = [];
    this.newProfileFileContent.push(`${nev.value}|${szulDatum.value}|${tajSzam.value}`);

    this.newProfile.szedettGyogyszerek.forEach((gyogyszer) => {
      this.newProfileFileContent.push(`${gyogyszer.gyogyszerNameShort}|${gyogyszer.gyogyszerNameLong}`);
    });

    this.closeModal();
    this.downloadProfileFile();
    this.clearNewProfileForm();
  }

  // ===== Download Profile File =====
  downloadProfileFile() {
    const text = this.newProfileFileContent.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = this.newProfile.nev;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.titleAction();
  }

  // ===== Clear Form =====
  clearNewProfileForm() {
    this.elements.newProfileForm.reset();

    // Remove extra medicine rows (keep the first one)
    const rows = this.elements.szedettGyogyszerek.querySelectorAll('.gyogyszer-row');
    rows.forEach((row, index) => {
      if (index !== 0) row.remove();
    });

    // Remove with-remove class from first row
    const firstRow = this.elements.szedettGyogyszerek.querySelector('.gyogyszer-row');
    if (firstRow) {
      firstRow.classList.remove('gyogyszer-row-with-remove');
    }

    this.newGyogyszerCount = 1;
  }

  // ===== Utility =====
  isEmptyField(element) {
    if (!element || element.value.trim() === '') {
      alert('Ne hagyd üresen egyik mezőt sem!');
      if (element) element.focus();
      return true;
    }
    return false;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new GyogyszerfeliratasApp();
});
