function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Créateur d\'affiches A3');
}

function createPoster(payload) {
  var data = JSON.parse(payload);
  var html = buildPosterHtml(data);

  var pdfBlob = HtmlService.createHtmlOutput(html).getAs(MimeType.PDF);
  pdfBlob.setName('affiche-a3-' + new Date().toISOString().replace(/[:.]/g, '-') + '.pdf');
  var targetFolder = ensureAfficheFolder();
  var pdfFile = targetFolder.createFile(pdfBlob);

  var entryId = data.entryId || '';
  var entryRecord = savePosterEntry(entryId, data, pdfFile.getUrl());

  return {
    entryId: entryRecord.id,
    pdfUrl: pdfFile.getUrl()
  };
}

function listPosterEntries() {
  var sheet = ensureAfficheSheet();
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return [];
  }
  var headers = values[0];
  var rows = values.slice(1);
  return rows.map(function(row) {
    var entry = {};
    headers.forEach(function(header, index) {
      var value = row[index];
      if ((header === 'createdAt' || header === 'updatedAt') && value) {
        entry[header] = Utilities.formatDate(new Date(value), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
      } else {
        entry[header] = value;
      }
    });
    return entry;
  }).filter(function(entry) {
    return entry.id;
  }).reverse();
}

function ensureAfficheSpreadsheet() {
  var sheetName = 'AFFICHE HERMINE A3';
  var propertyKey = 'AFFICHE_HERMINE_A3_SHEET_ID';
  var storedId = PropertiesService.getScriptProperties().getProperty(propertyKey);
  if (storedId) {
    try {
      return SpreadsheetApp.openById(storedId);
    } catch (error) {
      PropertiesService.getScriptProperties().deleteProperty(propertyKey);
    }
  }
  var files = DriveApp.getFilesByName(sheetName);
  if (files.hasNext()) {
    var existing = files.next();
    PropertiesService.getScriptProperties().setProperty(propertyKey, existing.getId());
    return SpreadsheetApp.open(existing);
  }
  var created = SpreadsheetApp.create(sheetName);
  PropertiesService.getScriptProperties().setProperty(propertyKey, created.getId());
  var targetFolder = ensureAfficheFolder();
  var createdFile = DriveApp.getFileById(created.getId());
  targetFolder.addFile(createdFile);
  DriveApp.getRootFolder().removeFile(createdFile);
  return created;
}

function ensureAfficheSheet() {
  var sheetName = 'AFFICHE HERMINE A3';
  var spreadsheet = ensureAfficheSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  ensureSheetHeaders(sheet);
  return sheet;
}

function ensureSheetHeaders(sheet) {
  var headers = [
    'id',
    'createdAt',
    'updatedAt',
    'title',
    'titleLine2',
    'subtitle',
    'subtitleText',
    'dateDay',
    'dateTime',
    'dateText',
    'footer',
    'hermineChoice',
    'pdfUrl'
  ];
  var existing = sheet.getLastColumn() >= headers.length
    ? sheet.getRange(1, 1, 1, headers.length).getValues()[0]
    : [];
  var needsUpdate = existing.length !== headers.length || existing.some(function(value, index) {
    return value !== headers[index];
  });
  if (needsUpdate) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function ensureAfficheFolder() {
  var folderName = 'AFFICHE HERMINE A3';
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

function savePosterEntry(entryId, data, pdfUrl) {
  var sheet = ensureAfficheSheet();
  var now = new Date();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var payload = {
    id: entryId || Utilities.getUuid(),
    createdAt: now,
    updatedAt: now,
    title: data.title || '',
    titleLine2: data.titleLine2 || '',
    subtitle: data.subtitle || '',
    subtitleText: data.subtitleText || '',
    dateDay: data.dateDay || '',
    dateTime: data.dateTime || '',
    dateText: data.dateText || '',
    footer: data.footer || '',
    hermineChoice: data.hermineChoice || '',
    pdfUrl: pdfUrl || ''
  };

  var rowIndex = findEntryRow(sheet, payload.id);
  if (rowIndex) {
    payload.createdAt = sheet.getRange(rowIndex, 2).getValue();
    payload.updatedAt = now;
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([headers.map(function(header) {
      return payload[header] || '';
    })]);
  } else {
    sheet.appendRow(headers.map(function(header) {
      return payload[header] || '';
    }));
  }
  return payload;
}

function findEntryRow(sheet, entryId) {
  if (!entryId) return 0;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return 0;
  }
  var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === entryId) {
      return i + 2;
    }
  }
  return 0;
}

function buildPosterHtml(data) {
  var hasTitleLine2 = !!data.titleLine2;
  var titleFontSize = calculateTitleFontSize(data.title, hasTitleLine2);
  var titleLine2 = data.titleLine2
    ? '<span class="title-line">' + escapeHtml(data.titleLine2) + '</span>'
    : '';
  var titleHtml = '<span class="title-line">' + escapeHtml(data.title) + '</span>' + titleLine2;
  var optionalSubtitle = data.subtitle
    ? '<h2 class="subtitle">' + escapeHtml(data.subtitle) + '</h2>'
    : '';
  var optionalDescription = data.subtitleText
    ? '<p class="description">' + escapeHtml(data.subtitleText).replace(/\n/g, '<br>') + '</p>'
    : '';
  var optionalDateText = data.dateText
    ? '<p class="date-text">' + escapeHtml(data.dateText).replace(/\n/g, '<br>') + '</p>'
    : '';
  var formattedDate = formatLongDate(data.dateDay || '');
  var dateDisplay = escapeHtml(formattedDate);
  if ((data.dateTime || '').trim()) {
    dateDisplay += ' / ' + escapeHtml(data.dateTime.trim());
  }
  var topLogo = data.topLogo || '';
  var bottomLogo = data.bottomLogo || '';
  var mainImage = data.mainImage || '';
  var footerParts = buildFooterHtmlParts(data.footer);
  var footerMain = footerParts.main;
  var footerLink = footerParts.link;
  var fontVagRounded = data.fontVagRounded || '';

  var imageBgStyle = mainImage
    ? ' style="background-image: url(\'' + mainImage + '\');"'
    : '';
  var fontFaceStyle = fontVagRounded
    ? '@font-face { font-family: "VAG Rounded Std"; font-style: normal; font-weight: 700; src: url("' + fontVagRounded + '"); }'
    : '';

  return (
    '<!DOCTYPE html>' +
    '<html lang="fr">' +
    '<head>' +
    '<meta charset="utf-8">' +
    '<style>' +
    fontFaceStyle +
    '@page { size: 297mm 420mm; margin: 0; }' +
    '* { box-sizing: border-box; margin: 0; padding: 0; }' +
    'html, body { width: 297mm; height: 420mm; font-family: "VAG Rounded Std", "Arial Rounded MT Bold", "Helvetica Neue", Helvetica, Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
    '.poster { width: 297mm; height: 420mm; display: flex; flex-direction: column; }' +
    '.image-section { width: 297mm; flex: 1 1 auto; position: relative; overflow: hidden; background-size: cover; background-position: center; }' +
    '.top-logo { position: absolute; top: 15mm; left: 15mm; width: 67mm; }' +
    '.content { width: 297mm; background: #f2d20a; padding: 15mm 20mm; }' +
    '.title { font-size: ' + titleFontSize + 'pt; font-weight: 700; margin: 0 0 3mm 0; line-height: 1.05; width: 70%;' +
    (hasTitleLine2 ? '' : ' white-space: nowrap;') +
    ' }' +
    '.title-line { display: block; }' +
    '.subtitle { font-size: 24pt; font-weight: 700; margin: 0 0 3mm 0; line-height: 1.15; }' +
    '.description { font-size: 18pt; font-weight: 700; margin: 0 0 3mm 0; line-height: 1.3; }' +
    '.date { font-size: 46pt; font-weight: 700; margin: 0; line-height: 1.1; }' +
    '.date-text { font-size: 18pt; font-weight: 400; margin: 3mm 0 0 0; line-height: 1.3; }' +
    '.footer { margin-top: 10mm; display: flex; justify-content: space-between; align-items: flex-end; }' +
    '.footer .info { font-size: 18pt; line-height: 1.5; font-weight: 700; }' +
    '.footer .info .footer-link { display: block; margin-top: 3mm; }' +
    '.bottom-logo { width: 40mm; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="poster">' +
    '<div class="image-section"' + imageBgStyle + '>' +
    (topLogo ? '<img class="top-logo" src="' + topLogo + '" alt="Logo" />' : '') +
    '</div>' +
    '<div class="content">' +
    '<h1 class="title">' + titleHtml + '</h1>' +
    optionalSubtitle +
    optionalDescription +
    '<p class="date">' + dateDisplay + '</p>' +
    optionalDateText +
    '<div class="footer">' +
    '<div class="info">' + footerMain + footerLink + '</div>' +
    (bottomLogo ? '<img class="bottom-logo" src="' + bottomLogo + '" alt="Logo Sarzeau" />' : '') +
    '</div>' +
    '</div>' +
    '</div>' +
    '</body>' +
    '</html>'
  );
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatLongDate(input) {
  var trimmed = (input || '').trim();
  if (!trimmed) return '';
  var match = trimmed.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  if (!match) {
    return trimmed;
  }
  var day = parseInt(match[1], 10);
  var month = parseInt(match[2], 10) - 1;
  var year = parseInt(match[3], 10);
  if (year < 100) {
    year += 2000;
  }
  var date = new Date(year, month, day);
  if (isNaN(date.getTime())) {
    return trimmed;
  }
  var dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var monthNames = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  return dayNames[date.getDay()] + ' ' + day + ' ' + monthNames[date.getMonth()];
}

function calculateTitleFontSize(title, hasTitleLine2) {
  if (hasTitleLine2) {
    return 50;
  }
  var trimmed = (title || '').trim();
  if (!trimmed) {
    return 50;
  }
  var length = trimmed.length;
  if (length <= 20) {
    return 50;
  }
  if (length <= 28) {
    return 48;
  }
  if (length <= 36) {
    return 46;
  }
  if (length <= 44) {
    return 44;
  }
  if (length <= 52) {
    return 42;
  }
  return 40;
}

function buildFooterHtmlParts(footerText) {
  var lines = (footerText || '').split(/\n/).map(function(line) {
    return escapeHtml(line.trim());
  }).filter(function(line) {
    return line.length > 0;
  });
  if (lines.length === 0) {
    return { main: '', link: '' };
  }
  var lastLine = lines[lines.length - 1];
  var mainLines = lines.slice(0, -1);
  var mainHtml = mainLines.length
    ? mainLines.join('<br>')
    : '';
  var linkHtml = lastLine
    ? '<span class="footer-link">' + lastLine + '</span>'
    : '';
  return {
    main: mainHtml ? mainHtml + '<br>' : '',
    link: linkHtml
  };
}
