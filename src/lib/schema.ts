// 友達情報の項目定義。フォーム・一覧・詳細表示はすべてこの定義から生成される。

export type FieldType = "text" | "textarea" | "date" | "month" | "select";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
  helpText?: string;
}

export interface SectionDef {
  key: string;
  title: string;
  description?: string;
  fields: FieldDef[];
}

export const BOOK_STATUS_OPTIONS = ["未", "金父", "CFQ", "その他"];
export const CIRCLE_STATUS_OPTIONS = ["未", "びすとろ", "Change", "その他"];
export const CURRENT_STAGE_OPTIONS = [
  "情報提供",
  "可能性を感じる",
  "求めているものを明確にする",
  "学ぶ人を決める",
  "具体的なリスクを取る",
];

// 基本情報（一覧・ソートに使う項目）
export const BASIC_FIELDS: FieldDef[] = [
  { key: "name", label: "名前", type: "text", placeholder: "山田 太郎" },
  { key: "relationship", label: "関係", type: "text", placeholder: "大学の友人 など" },
  {
    key: "birthday",
    label: "誕生日",
    type: "date",
    helpText: "年が分からない場合は適当な年で登録してOK（並び替えは月日のみ使用）",
  },
  {
    key: "moveOutMonth",
    label: "家の退去月",
    type: "month",
  },
];

export const SECTIONS: SectionDef[] = [
  {
    key: "f",
    title: "F：Family（家族・出身）",
    fields: [
      { key: "hometown", label: "出身", type: "text" },
      { key: "currentLocation", label: "現在", type: "text" },
      { key: "fatherJob", label: "仕事：父", type: "text" },
      { key: "motherJob", label: "仕事：母", type: "text" },
      { key: "siblings", label: "兄弟", type: "text" },
    ],
  },
  {
    key: "o",
    title: "O：Occupation（学歴・仕事）",
    fields: [
      { key: "education", label: "最終学歴", type: "text" },
      { key: "educationReason", label: "なぜその選択をしたのか？", type: "textarea" },
    ],
  },
  {
    key: "r",
    title: "R：Recreation（趣味・部活）",
    fields: [
      { key: "rWhyLike", label: "なぜ好きなのか？", type: "textarea" },
      { key: "rHowStarted", label: "始めたきっかけは？", type: "textarea" },
      { key: "rClubs", label: "小中高大学の部活", type: "text" },
      { key: "rWhyClub", label: "なぜその部活を選んだのか？", type: "textarea" },
    ],
  },
  {
    key: "m",
    title: "M：Message / Money",
    fields: [
      { key: "mExcitement", label: "どんなことにワクワクするのか？", type: "textarea" },
      { key: "mWhySpend", label: "なぜそこにお金を使うのか？", type: "textarea" },
    ],
  },
  {
    key: "d",
    title: "D：Dream（ビジョン）",
    fields: [
      { key: "dWhyVision", label: "なぜそのビジョンがあるのか？", type: "textarea" },
      { key: "dWork", label: "仕事", type: "textarea" },
      { key: "dPrivate", label: "プライベート", type: "textarea" },
      { key: "dFamily", label: "家族", type: "textarea" },
      { key: "dFutureFamily", label: "これからの家族", type: "textarea" },
    ],
  },
  {
    key: "status",
    title: "進捗管理",
    fields: [
      { key: "bookStatus", label: "本", type: "select", options: BOOK_STATUS_OPTIONS },
      {
        key: "bookStatusNote",
        label: "本（その他の場合の詳細）",
        type: "text",
        placeholder: "その他を選んだ場合に書名などを入力",
      },
      { key: "circleStatus", label: "サークル", type: "select", options: CIRCLE_STATUS_OPTIONS },
      {
        key: "circleStatusNote",
        label: "サークル（その他の場合の詳細）",
        type: "text",
        placeholder: "その他を選んだ場合に詳細を入力",
      },
      { key: "introStatus", label: "紹介", type: "text", placeholder: "未" },
      {
        key: "currentStage",
        label: "現在の状態",
        type: "select",
        options: CURRENT_STAGE_OPTIONS,
      },
      { key: "memo", label: "メモ", type: "textarea" },
    ],
  },
];

export const ALL_FIELDS: FieldDef[] = [
  ...BASIC_FIELDS,
  ...SECTIONS.flatMap((s) => s.fields),
];

export const TEXT_COLUMN_KEYS = ALL_FIELDS.map((f) => f.key);
