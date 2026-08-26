/**
 * 友達管理アプリ（Google スプレッドシート連携版）
 *
 * データは、このスクリプトが紐づくスプレッドシートの SHEET_NAME シートに
 * 1行1人で保存される。列構成は ALL_COLUMNS の順番に固定。
 */

var SHEET_NAME = '友達データ';

// 進捗管理系の選択肢（登録フォームと同じ並び順で管理する）
// 本・イベントは自由入力の1列にまとめているため、選択肢は持たない
// （現在の状態のみ固定のプルダウン選択肢を持つ）。
var CURRENT_STAGE_OPTIONS = [
  '情報提供',
  '可能性を感じる',
  '求めているものを明確にする',
  '学ぶ人を決める',
  '具体的なリスクを取る',
];

// フォーム項目の定義。label はフォームでの表示名、sheetLabel は
// スプレッドシートの列見出し専用の表示名（省略時はlabelを使う）。
// occupation の sheetLabel「仕事（現在）」は、過去にD:仕事(dWork)という
// 同名フィールドが別途存在していた名残（dWorkは削除しdVisionへ統合済み）。
// 既存シートの見出しをこれ以上変えないよう、そのまま維持している。
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
  { key: 'occupation', label: '仕事', sheetLabel: '仕事（現在）' },
  { key: 'education', label: '最終学歴' },
  { key: 'rHobby', label: '趣味' },
  { key: 'rClubs', label: '小中高大学の部活' },
  { key: 'mNote', label: 'M：Message / Money' },
  { key: 'dVision', label: 'ビジョン' },
  { key: 'book', label: '本' },
  { key: 'event', label: 'イベント' },
  { key: 'introStatus', label: '紹介' },
  { key: 'currentStage', label: '現在の状態' },
  { key: 'memo', label: 'メモ' },
];

var META_COLUMNS = ['id', 'createdAt', 'updatedAt'];
var META_LABELS = { id: 'ID', createdAt: '登録日時', updatedAt: '更新日時' };

/** 内部キーからスプレッドシートの列見出し（日本語）を返す */
function fieldLabel_(key) {
  if (META_LABELS[key]) return META_LABELS[key];
  for (var i = 0; i < FIELDS.length; i++) {
    if (FIELDS[i].key === key) return FIELDS[i].sheetLabel || FIELDS[i].label;
  }
  return key;
}

var ALL_COLUMNS = META_COLUMNS.concat(FIELDS.map(function (f) { return f.key; })); // 内部キー（アプリ内部・API用）
var ALL_LABELS = ALL_COLUMNS.map(fieldLabel_); // スプレッドシートの列見出し（日本語）

// 列見出し（日本語） -> 内部キー の逆引き
var LABEL_TO_KEY = {};
ALL_COLUMNS.forEach(function (key, i) { LABEL_TO_KEY[ALL_LABELS[i]] = key; });

// 廃止した列。既存シートに残っている場合は、値を統合先の列へ改行で追記した上で
// 列ごと削除する（getSheet_() 内の mergeRemovedFieldsIntoTargets_ が実行）。
// label は削除当時にシートへ実際に書き込まれていた見出し（sheetLabel優先）。
var REMOVED_FIELDS = [
  { label: 'なぜその選択をしたのか？', targetKey: 'occupation' },
  { label: 'なぜ好きなのか？', targetKey: 'rHobby' },
  { label: '始めたきっかけは？', targetKey: 'rHobby' },
  { label: 'なぜその部活を選んだのか？', targetKey: 'rClubs' },
  { label: 'どんなことにワクワクするのか？', targetKey: 'mNote' },
  { label: 'なぜそこにお金を使うのか？', targetKey: 'mNote' },
  { label: 'なぜそのビジョンがあるのか？', targetKey: 'dVision' },
  { label: '仕事（将来）', targetKey: 'dVision' },
  { label: 'プライベート', targetKey: 'dVision' },
  { label: '家族', targetKey: 'dVision' },
  { label: 'これからの家族', targetKey: 'dVision' },
];
var REMOVED_FIELD_MERGE_MAP = {};
REMOVED_FIELDS.forEach(function (f) { REMOVED_FIELD_MERGE_MAP[f.label] = f; });

/**
 * doGet はGitHub Pages版アプリ（docs/index.html）からのJSONP形式の読み取りAPIとして使う
 * （外部オリジンからの fetch はCORSの制約を受けるため、<script>タグ読み込みで
 * 　回避できるJSONP形式でレスポンスを返す）。
 * ?callback=xxx&action=... 以外の形（パラメータ無しでブラウザから直接開かれた場合など）は
 * 案内用のテキストを返すだけで、表示するUIは持たない。
 */
function doGet(e) {
  var params = (e && e.parameter) || {};
  if (params.callback) {
    return handleApiGet_(params);
  }
  return ContentService.createTextOutput(
    'このURLはGitHub Pages版アプリ（friendinfo）が使うAPIエンドポイントです。ブラウザで直接開いても表示するUIはありません。'
  );
}

function handleApiGet_(params) {
  var result;
  try {
    switch (params.action) {
      case 'get':
        result = { ok: true, data: getFriend(params.id) };
        break;
      case 'list':
      default:
        result = { ok: true, data: listFriends() };
        break;
    }
  } catch (err) {
    result = { ok: false, error: String(err && err.message ? err.message : err) };
  }
  var body = params.callback + '(' + JSON.stringify(result) + ')';
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

/**
 * doPost はGitHub Pages等の外部サイトからの書き込み用JSON APIとして使う。
 * 外部オリジンからのPOSTはCORSプリフライトの都合上レスポンスを読めない
 * （no-corsで送信される想定）ため、成否はクライアント側で楽観的に扱う。
 */
function doPost(e) {
  var result;
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    switch (body.action) {
      case 'save':
        result = { ok: true, data: saveFriend(body.data || {}) };
        break;
      case 'delete':
        result = { ok: true, data: deleteFriend(body.id) };
        break;
      default:
        result = { ok: false, error: 'unknown action' };
        break;
    }
  } catch (err) {
    result = { ok: false, error: String(err && err.message ? err.message : err) };
  }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(ALL_LABELS);
    sheet.setFrozenRows(1);
    formatDataColumnsAsPlainText_(sheet);
    return sheet;
  }

  mergeRemovedFieldsIntoTargets_(sheet);
  mergeBookEventColumns_(sheet);

  var lastCol = sheet.getLastColumn();
  var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // 各列がどの内部キーに対応するか判定する（現行の日本語ラベル／旧・英語キー表記のどちらでも対応）
  var resolvedKeys = headerRow.map(function (cell) {
    if (LABEL_TO_KEY[cell]) return LABEL_TO_KEY[cell];
    if (ALL_COLUMNS.indexOf(cell) !== -1) return cell; // 旧バージョンの英語キー表記の列
    return null; // 未知の列（ユーザーが独自に追加した列など）は触らない
  });

  // 判明した列は、位置とデータはそのままに見出しだけ日本語ラベルへ書き換える
  var newHeaderRow = headerRow.slice();
  var headerChanged = false;
  resolvedKeys.forEach(function (key, i) {
    if (!key) return;
    var label = fieldLabel_(key);
    if (newHeaderRow[i] !== label) {
      newHeaderRow[i] = label;
      headerChanged = true;
    }
  });
  if (headerChanged) {
    sheet.getRange(1, 1, 1, lastCol).setValues([newHeaderRow]);
  }

  // まだ存在しない項目（新しく追加されたフィールドなど）を末尾に追記する
  var presentKeys = resolvedKeys.filter(function (k) { return !!k; });
  var missingKeys = ALL_COLUMNS.filter(function (k) { return presentKeys.indexOf(k) === -1; });
  if (missingKeys.length > 0) {
    sheet.getRange(1, lastCol + 1, 1, missingKeys.length).setValues([missingKeys.map(fieldLabel_)]);
  }

  formatDataColumnsAsPlainText_(sheet);
  return sheet;
}

/**
 * 廃止した列（REMOVED_FIELDS）がシートに残っていた場合、値を統合先の列へ
 * 改行区切りで追記してから、その列自体を削除する。
 * 統合先の列がまだ存在しない場合（例: mNoteは旧シートには無い新設列）は
 * 末尾に空列として追加してから統合する。
 * 該当する列が1つも無ければ何もしない（毎回のアクセスで無駄な書き込みをしない）。
 */
function mergeRemovedFieldsIntoTargets_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return;
  var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  var removedColIndexes = [];
  headerRow.forEach(function (label, i) {
    if (REMOVED_FIELD_MERGE_MAP[label]) removedColIndexes.push(i);
  });
  if (removedColIndexes.length === 0) return;

  function findColIndexForKey(key) {
    for (var i = 0; i < headerRow.length; i++) {
      if (LABEL_TO_KEY[headerRow[i]] === key) return i;
    }
    return -1;
  }

  var neededTargetKeys = [];
  removedColIndexes.forEach(function (idx) {
    var key = REMOVED_FIELD_MERGE_MAP[headerRow[idx]].targetKey;
    if (findColIndexForKey(key) === -1 && neededTargetKeys.indexOf(key) === -1) {
      neededTargetKeys.push(key);
    }
  });
  if (neededTargetKeys.length > 0) {
    sheet.getRange(1, lastCol + 1, 1, neededTargetKeys.length).setValues([neededTargetKeys.map(fieldLabel_)]);
    lastCol += neededTargetKeys.length;
    headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  }

  if (lastRow >= 2) {
    var numRows = lastRow - 1;
    var dataRange = sheet.getRange(2, 1, numRows, lastCol);
    var values = dataRange.getValues();
    var changed = false;

    removedColIndexes.forEach(function (srcIdx) {
      var mergeInfo = REMOVED_FIELD_MERGE_MAP[headerRow[srcIdx]];
      var targetIdx = findColIndexForKey(mergeInfo.targetKey);
      if (targetIdx === -1) return; // 統合先列が見つからない場合は安全側に倒して何もしない
      for (var r = 0; r < values.length; r++) {
        var oldVal = values[r][srcIdx];
        var oldStr = oldVal === undefined || oldVal === null ? '' : String(oldVal).trim();
        if (!oldStr) continue;
        var targetVal = values[r][targetIdx];
        var targetStr = targetVal === undefined || targetVal === null ? '' : String(targetVal);
        values[r][targetIdx] = targetStr ? (targetStr + '\n' + oldStr) : oldStr;
        changed = true;
      }
    });

    if (changed) dataRange.setValues(values);
  }

  // 統合済みの列を後ろのインデックスから順に削除する（前から消すと後続のインデックスがずれるため）
  removedColIndexes
    .slice()
    .sort(function (a, b) { return b - a; })
    .forEach(function (idx) { sheet.deleteColumn(idx + 1); });
}

// 本・イベントの旧・複数列（チェックボックス方式だった名残）を、1つの自由入力列へ
// 統合するための定義。label は当時シートへ実際に書き込まれていた見出し。
var BOOK_LEGACY_COLUMNS = [
  { label: '本（旧・互換用）', subKey: 'legacyStatus' },
  { label: '本：金父', subKey: 'kinfu' },
  { label: '本：CFQ', subKey: 'cfq' },
  { label: '本：その他', subKey: 'other' },
  { label: '本：その他の詳細', subKey: 'otherNote' },
];
var EVENT_LEGACY_COLUMNS = [
  { label: 'イベント（旧・互換用）', subKey: 'legacyStatus' },
  { label: 'イベント：びすとろ', subKey: 'bistro' },
  { label: 'イベント：Change', subKey: 'change' },
  { label: 'イベント：その他', subKey: 'other' },
  { label: 'イベント：その他の詳細', subKey: 'otherNote' },
];

/** 本の旧・複数列の値から、1つの自由入力文字列（例: 金父(読書中)、その他（銀のさじ））を組み立てる */
function formatBookLegacyText_(v) {
  var entries = [];
  if (v.kinfu) entries.push('金父(' + v.kinfu + ')');
  else if (v.legacyStatus === '金父') entries.push('金父');
  if (v.cfq) entries.push('CFQ(' + v.cfq + ')');
  else if (v.legacyStatus === 'CFQ') entries.push('CFQ');
  if (v.other || v.legacyStatus === 'その他') entries.push(v.otherNote ? 'その他（' + v.otherNote + '）' : 'その他');
  return entries.join('、');
}

/** イベントの旧・複数列の値から、1つの自由入力文字列を組み立てる */
function formatEventLegacyText_(v) {
  var entries = [];
  if (v.bistro || v.legacyStatus === 'びすとろ') entries.push('びすとろ');
  if (v.change || v.legacyStatus === 'Change') entries.push('Change');
  if (v.other || v.legacyStatus === 'その他') entries.push(v.otherNote ? 'その他（' + v.otherNote + '）' : 'その他');
  return entries.join('、');
}

/**
 * 本・イベントが複数列（チェックボックス＋段階／旧・単一選択形式）に分かれていた
 * 時期のシートに対して、1つの自由入力列（book／event）へ統合してから旧列を削除する。
 * 統合先の列（book／event）がまだ存在しない場合は末尾に空列として追加してから統合する。
 * 該当する旧列が1つも無ければ何もしない。
 */
function mergeBookEventColumns_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return;
  var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  var bookColIndexes = {}; // subKey -> 列インデックス(0-based)
  var eventColIndexes = {};
  headerRow.forEach(function (label, i) {
    BOOK_LEGACY_COLUMNS.forEach(function (f) { if (f.label === label) bookColIndexes[f.subKey] = i; });
    EVENT_LEGACY_COLUMNS.forEach(function (f) { if (f.label === label) eventColIndexes[f.subKey] = i; });
  });
  var hasBookLegacy = Object.keys(bookColIndexes).length > 0;
  var hasEventLegacy = Object.keys(eventColIndexes).length > 0;
  if (!hasBookLegacy && !hasEventLegacy) return;

  function findColIndexForKey(key) {
    for (var i = 0; i < headerRow.length; i++) {
      if (LABEL_TO_KEY[headerRow[i]] === key) return i;
    }
    return -1;
  }

  var neededTargetKeys = [];
  if (hasBookLegacy && findColIndexForKey('book') === -1) neededTargetKeys.push('book');
  if (hasEventLegacy && findColIndexForKey('event') === -1) neededTargetKeys.push('event');
  if (neededTargetKeys.length > 0) {
    sheet.getRange(1, lastCol + 1, 1, neededTargetKeys.length).setValues([neededTargetKeys.map(fieldLabel_)]);
    lastCol += neededTargetKeys.length;
    headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  }
  var bookTargetIdx = hasBookLegacy ? findColIndexForKey('book') : -1;
  var eventTargetIdx = hasEventLegacy ? findColIndexForKey('event') : -1;

  if (lastRow >= 2) {
    var numRows = lastRow - 1;
    var dataRange = sheet.getRange(2, 1, numRows, lastCol);
    var values = dataRange.getValues();
    var changed = false;

    function cellStr(row, idx) {
      if (idx === undefined) return '';
      var val = row[idx];
      return val === undefined || val === null ? '' : String(val).trim();
    }

    for (var r = 0; r < values.length; r++) {
      var row = values[r];
      if (hasBookLegacy && bookTargetIdx !== -1) {
        var bookText = formatBookLegacyText_({
          legacyStatus: cellStr(row, bookColIndexes.legacyStatus),
          kinfu: cellStr(row, bookColIndexes.kinfu),
          cfq: cellStr(row, bookColIndexes.cfq),
          other: cellStr(row, bookColIndexes.other),
          otherNote: cellStr(row, bookColIndexes.otherNote),
        });
        if (bookText) {
          var existingBook = cellStr(row, bookTargetIdx);
          row[bookTargetIdx] = existingBook ? (existingBook + '\n' + bookText) : bookText;
          changed = true;
        }
      }
      if (hasEventLegacy && eventTargetIdx !== -1) {
        var eventText = formatEventLegacyText_({
          legacyStatus: cellStr(row, eventColIndexes.legacyStatus),
          bistro: cellStr(row, eventColIndexes.bistro),
          change: cellStr(row, eventColIndexes.change),
          other: cellStr(row, eventColIndexes.other),
          otherNote: cellStr(row, eventColIndexes.otherNote),
        });
        if (eventText) {
          var existingEvent = cellStr(row, eventTargetIdx);
          row[eventTargetIdx] = existingEvent ? (existingEvent + '\n' + eventText) : eventText;
          changed = true;
        }
      }
    }

    if (changed) dataRange.setValues(values);
  }

  var toDelete = Object.keys(bookColIndexes).map(function (k) { return bookColIndexes[k]; })
    .concat(Object.keys(eventColIndexes).map(function (k) { return eventColIndexes[k]; }));
  toDelete
    .sort(function (a, b) { return b - a; })
    .forEach(function (idx) { sheet.deleteColumn(idx + 1); });
}

/**
 * データ列を「書式なしテキスト」にする。
 * これをしておかないと、Google スプレッドシートが "1997-05-26" のような
 * 文字列を自動的に日付型のセルに変換してしまい、読み出したときに
 * タイムゾーン付きの日時（例: 1997-05-26T15:00:00.000Z）になってしまう
 * （誕生日・退去月の表示がおかしくなる原因）。
 */
function formatDataColumnsAsPlainText_(sheet) {
  var numRows = Math.max(sheet.getMaxRows() - 1, 1);
  var numCols = Math.max(sheet.getMaxColumns(), ALL_COLUMNS.length);
  sheet.getRange(2, 1, numRows, numCols).setNumberFormat('@');
}

// セルが自動で日付型に変換されてしまっていた場合に、日付のみ／年月のみで
// 復元すべき項目（タイムゾーン付きの日時をそのまま出さないようにするため）
var DATE_ONLY_KEYS = ['birthday'];
var MONTH_ONLY_KEYS = ['moveOutMonth'];

function rowToObject_(headerLabels, row) {
  var obj = {};
  for (var i = 0; i < headerLabels.length; i++) {
    var key = LABEL_TO_KEY[headerLabels[i]] || headerLabels[i];
    var value = row[i];
    if (value instanceof Date) {
      var tz = Session.getScriptTimeZone();
      if (DATE_ONLY_KEYS.indexOf(key) !== -1) {
        obj[key] = Utilities.formatDate(value, tz, 'yyyy-MM-dd');
      } else if (MONTH_ONLY_KEYS.indexOf(key) !== -1) {
        obj[key] = Utilities.formatDate(value, tz, 'yyyy-MM');
      } else {
        obj[key] = value.toISOString();
      }
    } else {
      obj[key] = value === undefined || value === null ? '' : String(value);
    }
  }
  return obj;
}

/**
 * スプレッドシートに直接行を追加した場合など、ID（およびcreatedAt/updatedAt）が
 * 未入力のまま何らかのデータだけ入力されている行にIDを自動採番して書き戻す。
 * ID列が空の行はlistFriends()の対象から漏れてしまう（編集・削除時に行を
 * 一意に特定できないため）ため、Webアプリの一覧に表示されるようにする処理。
 * 完全に空の行（何も入力されていない行）は対象にしない。
 */
function backfillMissingIds_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2) return;

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var idColIndex = headers.indexOf(fieldLabel_('id'));
  if (idColIndex === -1) return;
  var createdAtColIndex = headers.indexOf(fieldLabel_('createdAt'));
  var updatedAtColIndex = headers.indexOf(fieldLabel_('updatedAt'));

  var numRows = lastRow - 1;
  var dataRange = sheet.getRange(2, 1, numRows, lastCol);
  var values = dataRange.getValues();
  var changed = false;
  var now = new Date().toISOString();

  function rowHasAnyData(row) {
    for (var i = 0; i < headers.length; i++) {
      if (i === idColIndex || i === createdAtColIndex || i === updatedAtColIndex) continue;
      var val = row[i];
      if (val !== undefined && val !== null && String(val).trim() !== '') return true;
    }
    return false;
  }

  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    if (row[idColIndex] || !rowHasAnyData(row)) continue;
    row[idColIndex] = Utilities.getUuid();
    if (createdAtColIndex !== -1 && !row[createdAtColIndex]) row[createdAtColIndex] = now;
    if (updatedAtColIndex !== -1 && !row[updatedAtColIndex]) row[updatedAtColIndex] = now;
    changed = true;
  }

  if (changed) dataRange.setValues(values);
}

/** 全友達データを取得する */
function listFriends() {
  var sheet = getSheet_();

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    backfillMissingIds_(sheet);
  } finally {
    lock.releaseLock();
  }

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

function findRowIndexById_(sheet, headerLabels, id) {
  var idColIndex = headerLabels.indexOf(fieldLabel_('id'));
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var ids = sheet.getRange(2, idColIndex + 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2; // シート上の行番号
  }
  return -1;
}

/**
 * 友達データを新規登録 or 更新する（upsert）。
 * data.id に既存の友達のIDが指定されていればその行を更新し、
 * 指定がない、または一致する行が無ければ新規登録として扱う。
 * ID未指定の場合はサーバー側で採番する（GitHub Pages版クライアントは
 * no-corsでPOSTするためレスポンスを読めず、事前にクライアント側でUUIDを
 * 発行してdata.idに含める運用を基本とする）。
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
    var headerLabels = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var now = new Date().toISOString();
    var id = data.id ? String(data.id) : Utilities.getUuid();

    var existingRow = data.id ? findRowIndexById_(sheet, headerLabels, data.id) : -1;
    var existingRowValues = existingRow !== -1 ? sheet.getRange(existingRow, 1, 1, headerLabels.length).getValues()[0] : null;
    var createdAt = now;
    if (existingRowValues) {
      var createdAtColIndex = headerLabels.indexOf(fieldLabel_('createdAt'));
      var existingCreatedAt = existingRowValues[createdAtColIndex];
      if (existingCreatedAt) createdAt = existingCreatedAt;
    }

    var rowValues = headerLabels.map(function (label, idx) {
      var key = LABEL_TO_KEY[label] || label;
      if (key === 'id') return id;
      if (key === 'createdAt') return createdAt;
      if (key === 'updatedAt') return now;
      // 送信データにそのキー自体が含まれていない場合（項目を持たない古いUIからの
      // 更新など）は、既存の値を消さずに維持する。キーはあるが空文字の場合は
      // 意図的なクリアとして扱い、空で上書きする。
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        return data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
      }
      return existingRowValues ? existingRowValues[idx] : '';
    });

    if (existingRow !== -1) {
      sheet.getRange(existingRow, 1, 1, headerLabels.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    return rowToObject_(headerLabels, rowValues);
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
