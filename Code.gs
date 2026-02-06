function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Créateur d\'affiches A3');
}

function createPoster(payload) {
  var data = JSON.parse(payload);
  var html = buildPosterHtml(data);

  var htmlFile = DriveApp.createFile(
    'affiche-a3-' + new Date().toISOString().replace(/[:.]/g, '-') + '.html',
    html,
    MimeType.HTML
  );

  var pdfBlob = HtmlService.createHtmlOutput(html).getAs(MimeType.PDF);
  pdfBlob.setName(htmlFile.getName().replace('.html', '.pdf'));
  var pdfFile = DriveApp.createFile(pdfBlob);

  return {
    htmlUrl: htmlFile.getUrl(),
    pdfUrl: pdfFile.getUrl()
  };
}

function buildPosterHtml(data) {
  var optionalSubtitle = data.subtitle
    ? '<h2 class="subtitle">' + escapeHtml(data.subtitle) + '</h2>'
    : '';
  var optionalDescription = data.subtitleText
    ? '<p class="description">' + escapeHtml(data.subtitleText).replace(/\n/g, '<br>') + '</p>'
    : '';
  var optionalDateText = data.dateText
    ? '<p class="date-text">' + escapeHtml(data.dateText).replace(/\n/g, '<br>') + '</p>'
    : '';
  var topLogo = data.topLogo || '';
  var bottomLogo = data.bottomLogo || '';
  var mainImage = data.mainImage || '';
  var footerHtml = escapeHtml(data.footer).replace(/\n/g, '<br>');

  return (
    '<!DOCTYPE html>' +
    '<html lang="fr">' +
    '<head>' +
    '<meta charset="utf-8">' +
    '<style>' +
    '@page { size: A3; margin: 0; }' +
    'body { margin: 0; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; -webkit-print-color-adjust: exact; }' +
    '.poster { width: 297mm; height: 420mm; display: flex; flex-direction: column; overflow: hidden; }' +
    '.image-section { position: relative; flex: 0 0 54%; overflow: hidden; }' +
    '.image-section img.main-photo { width: 100%; height: 100%; object-fit: cover; display: block; }' +
    '.top-logo { position: absolute; top: 15mm; left: 15mm; width: 50mm; }' +
    '.content { flex: 1; background: #f2d20a; padding: 18mm 22mm 15mm 22mm; display: flex; flex-direction: column; }' +
    '.title { font-size: 34pt; font-weight: 700; margin: 0 0 5mm 0; line-height: 1.1; color: #000; }' +
    '.subtitle { font-size: 20pt; font-weight: 700; margin: 0 0 4mm 0; line-height: 1.15; color: #000; }' +
    '.description { font-size: 13pt; font-weight: 400; margin: 0 0 6mm 0; line-height: 1.4; color: #000; }' +
    '.date { font-size: 23pt; font-weight: 700; margin: 0; line-height: 1.15; color: #000; }' +
    '.date-text { font-size: 13pt; font-weight: 400; margin: 3mm 0 0 0; line-height: 1.4; color: #000; }' +
    '.footer { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; }' +
    '.footer .info { font-size: 9.5pt; line-height: 1.6; color: #000; }' +
    '.bottom-logo { width: 35mm; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="poster">' +
    '<div class="image-section">' +
    (mainImage ? '<img class="main-photo" src="' + mainImage + '" alt="Photo" />' : '') +
    (topLogo ? '<img class="top-logo" src="' + topLogo + '" alt="Logo" />' : '') +
    '</div>' +
    '<div class="content">' +
    '<h1 class="title">' + escapeHtml(data.title) + '</h1>' +
    optionalSubtitle +
    optionalDescription +
    '<p class="date">' + escapeHtml(data.date) + '</p>' +
    optionalDateText +
    '<div class="footer">' +
    '<div class="info">' + footerHtml + '</div>' +
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
