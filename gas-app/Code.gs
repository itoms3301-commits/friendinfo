/**
 * 友達管理アプリ（Google スプレッドシート連携版）
 *
 * データは、このスクリプトが紐づくスプレッドシートの SHEET_NAME シートに
 * 1行1人で保存される。列構成は ALL_COLUMNS の順番に固定。
 */

var SHEET_NAME = '友達データ';

// 進捗管理系のプルダウン選択肢（登録フォームと同じ並び順で管理する）
var BOOK_STATUS_OPTIONS = ['未', '金父', 'CFQ', 'その他'];
var CIRCLE_STATUS_OPTIONS = ['未', 'びすとろ', 'Change', 'その他'];
var CURRENT_STAGE_OPTIONS = [
  '情報提供',
  '可能性を感じる',
  '求めているものを明確にする',
  '学ぶ人を決める',
  '具体的なリスクを取る',
];

// フォーム項目の定義（スプレッドシートのヘッダー行にもそのまま使う）
var FIELDS = [
  { key: 'name', label: '名前' },
  { key: 'relationship', label: '関係' },
  { key: 'birthday', label: '誕生日' },
  { key: 'moveOutMonth', label: '家の退去月' },
  { key: 'hometown', label: '出身' },
  { key: 'currentLocation', label: '現在' },
  { key: 'fatherJob', label: '仕事：父' },
  { key: 'motherJob', label: '仕事：母' },
  { key: 'siblings', label: '兄弟' },
  { key: 'education', label: '最終学歴' },
  { key: 'educationReason', label: 'なぜその選択をしたのか？' },
  { key: 'rWhyLike', label: 'なぜ好きなのか？' },
  { key: 'rHowStarted', label: '始めたきっかけは？' },
  { key: 'rClubs', label: '小中高大学の部活' },
  { key: 'rWhyClub', label: 'なぜその部活を選んだのか？' },
  { key: 'mExcitement', label: 'どんなことにワクワクするのか？' },
  { key: 'mWhySpend', label: 'なぜそこにお金を使うのか？' },
  { key: 'dWhyVision', label: 'なぜそのビジョンがあるのか？' },
  { key: 'dWork', label: '仕事' },
  { key: 'dPrivate', label: 'プライベート' },
  { key: 'dFamily', label: '家族' },
  { key: 'dFutureFamily', label: 'これからの家族' },
  { key: 'bookStatus', label: '本' },
  { key: 'bookStatusNote', label: '本（その他の場合の詳細）' },
  { key: 'circleStatus', label: 'サークル' },
  { key: 'circleStatusNote', label: 'サークル（その他の場合の詳細）' },
  { key: 'introStatus', label: '紹介' },
  { key: 'currentStage', label: '現在の状態' },
  { key: 'memo', label: 'メモ' },
];

var META_COLUMNS = ['id', 'createdAt', 'updatedAt'];
var ALL_COLUMNS = META_COLUMNS.concat(FIELDS.map(function (f) { return f.key; }));

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('友達管理')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** クライアントにフォーム定義・選択肢を渡すための関数 */
function getFormConfig() {
  return {
    fields: FIELDS,
    bookStatusOptions: BOOK_STATUS_OPTIONS,
    circleStatusOptions: CIRCLE_STATUS_OPTIONS,
    currentStageOptions: CURRENT_STAGE_OPTIONS,
  };
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(ALL_COLUMNS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function rowToObject_(headers, row) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) {
    var value = row[i];
    if (value instanceof Date) {
      obj[headers[i]] = value.toISOString();
    } else {
      obj[headers[i]] = value === undefined || value === null ? '' : String(value);
    }
  }
  return obj;
}

/** 全友達データを取得する */
function listFriends() {
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2) return [];

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  var friends = [];
  for (var i = 0; i < values.length; i++) {
    var obj = rowToObject_(headers, values[i]);
    if (obj.id) friends.push(obj);
  }
  return friends;
}

/** 1人分のデータを取得する */
function getFriend(id) {
  var friends = listFriends();
  for (var i = 0; i < friends.length; i++) {
    if (friends[i].id === String(id)) return friends[i];
  }
  return null;
}

function findRowIndexById_(sheet, headers, id) {
  var idColIndex = headers.indexOf('id');
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var ids = sheet.getRange(2, idColIndex + 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2; // シート上の行番号
  }
  return -1;
}

/**
 * 友達データを新規登録 or 更新する。
 * data.id が空なら新規登録、あれば該当行を更新する。
 * 戻り値: 保存された友達データ（idを含む）
 */
function saveFriend(data) {
  if (!data || !String(data.name || '').trim()) {
    throw new Error('名前を入力してください。');
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet_();
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var now = new Date().toISOString();
    var id = data.id ? String(data.id) : Utilities.getUuid();

    var existingRow = data.id ? findRowIndexById_(sheet, headers, data.id) : -1;
    var createdAt = now;
    if (existingRow !== -1) {
      var createdAtColIndex = headers.indexOf('createdAt');
      var existingCreatedAt = sheet.getRange(existingRow, createdAtColIndex + 1).getValue();
      if (existingCreatedAt) createdAt = existingCreatedAt;
    } else if (data.id && existingRow === -1) {
      // 更新対象のIDが見つからない場合はエラーにする（削除済みの可能性）
      throw new Error('更新対象の友達が見つかりませんでした。ページを再読み込みしてください。');
    }

    var rowValues = headers.map(function (key) {
      if (key === 'id') return id;
      if (key === 'createdAt') return createdAt;
      if (key === 'updatedAt') return now;
      return data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
    });

    if (existingRow !== -1) {
      sheet.getRange(existingRow, 1, 1, headers.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    return rowToObject_(headers, rowValues);
  } finally {
    lock.releaseLock();
  }
}

/** 友達データを削除する */
function deleteFriend(id) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet_();
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var rowIndex = findRowIndexById_(sheet, headers, id);
    if (rowIndex === -1) return false;
    sheet.deleteRow(rowIndex);
    return true;
  } finally {
    lock.releaseLock();
  }
}

/** 元データのスプレッドシートを直接開くためのURLを返す */
function getSpreadsheetUrl() {
  return SpreadsheetApp.getActiveSpreadsheet().getUrl();
}
