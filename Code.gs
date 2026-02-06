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
  var optionalSubtitleText = data.subtitleText ? '<p class="subtitle-text">' + escapeHtml(data.subtitleText) + '</p>' : '';
  var optionalDateText = data.dateText ? '<p class="date-text">' + escapeHtml(data.dateText) + '</p>' : '';
  var bottomLogo = data.bottomLogo || '';
  var topLogo = '';
  if (data.topLogoChoice === 'white') {
    topLogo = data.topLogoWhite || '';
  } else if (data.topLogoChoice === 'black') {
    topLogo = data.topLogoBlack || '';
  }
  var mainImage = data.mainImage || '';

  return (
    '<!DOCTYPE html>' +
    '<html lang="fr">' +
    '<head>' +
    '<meta charset="utf-8">' +
    '<style>' +
    '@page { size: A3; margin: 0; }' +
    'body { margin: 0; font-family: "Helvetica Neue", Arial, sans-serif; }' +
    '.poster { width: 297mm; height: 420mm; display: flex; flex-direction: column; }' +
    '.image-section { position: relative; flex: 1 1 60%; background: #eee; overflow: hidden; }' +
    '.image-section img { width: 100%; height: 100%; object-fit: cover; }' +
    '.top-logo { position: absolute; top: 20mm; left: 20mm; width: 50mm; }' +
    '.content { flex: 1 1 40%; background: #f2d20a; padding: 24mm; display: flex; flex-direction: column; gap: 10mm; }' +
    '.title { font-size: 40pt; font-weight: 700; margin: 0; }' +
    '.subtitle { font-size: 22pt; font-weight: 600; margin: 0; }' +
    '.subtitle-text, .date-text { font-size: 16pt; margin: 0; }' +
    '.date { font-size: 26pt; font-weight: 700; margin: 0; }' +
    '.footer { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12pt; }' +
    '.footer .info { max-width: 60%; }' +
    '.bottom-logo { width: 40mm; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="poster">' +
    '<div class="image-section">' +
    (mainImage ? '<img src="' + mainImage + '" alt="Photo" />' : '') +
    (topLogo ? '<img class="top-logo" src="' + topLogo + '" alt="Logo" />' : '') +
    '</div>' +
    '<div class="content">' +
    '<h1 class="title">' + escapeHtml(data.title) + '</h1>' +
    '<h2 class="subtitle">' + escapeHtml(data.subtitle) + '</h2>' +
    optionalSubtitleText +
    '<p class="date">' + escapeHtml(data.date) + '</p>' +
    optionalDateText +
    '<div class="footer">' +
    '<div class="info">' + escapeHtml(data.footer) + '</div>' +
    (bottomLogo ? '<img class="bottom-logo" src="' + bottomLogo + '" alt="Logo bas" />' : '') +
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
