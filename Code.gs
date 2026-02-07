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

  var imageBgStyle = mainImage
    ? ' style="background-image: url(\'' + mainImage + '\');"'
    : '';

  return (
    '<!DOCTYPE html>' +
    '<html lang="fr">' +
    '<head>' +
    '<meta charset="utf-8">' +
    '<style>' +
    '@page { size: 297mm 420mm; margin: 0; }' +
    '* { box-sizing: border-box; margin: 0; padding: 0; }' +
    'html, body { width: 297mm; height: 420mm; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
    '.poster { width: 297mm; height: 420mm; }' +
    '.image-section { width: 297mm; height: 230mm; position: relative; overflow: hidden; background-size: cover; background-position: center; }' +
    '.top-logo { position: absolute; top: 15mm; left: 15mm; width: 50mm; }' +
    '.content { width: 297mm; height: 190mm; background: #f2d20a; padding: 15mm 20mm; position: relative; }' +
    '.title { font-size: 45pt; font-weight: 700; margin: 0 0 3mm 0; line-height: 1.05; }' +
    '.subtitle { font-size: 22pt; font-weight: 700; margin: 0 0 3mm 0; line-height: 1.15; }' +
    '.description { font-size: 16pt; font-weight: 700; margin: 0 0 3mm 0; line-height: 1.3; }' +
    '.date { font-size: 34pt; font-weight: 700; margin: 0; line-height: 1.1; }' +
    '.date-text { font-size: 14pt; font-weight: 400; margin: 3mm 0 0 0; line-height: 1.3; }' +
    '.footer { position: absolute; bottom: 12mm; left: 20mm; right: 20mm; display: flex; justify-content: space-between; align-items: flex-end; }' +
    '.footer .info { font-size: 11pt; line-height: 1.5; font-weight: 700; }' +
    '.bottom-logo { width: 40mm; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="poster">' +
    '<div class="image-section"' + imageBgStyle + '>' +
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
