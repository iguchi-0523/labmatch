/**
 * キーワード階層ツリー
 *
 * - 5 階層の粒度：学問分野 → 大領域 → サブ領域 → テーマ → キーワード（leaf）
 * - leaf ノードのみ `keyword` プロパティを持つ。中間ノードは `children` だけ。
 * - 中間ノードをクリックすると、その配下にあるすべての leaf キーワードを
 *   一括 select / unselect する。
 *
 * Level 1（学問分野）— 2026-05-25 拡張：
 *   物理学 / 化学 / 生物学 / 医学・健康科学 / 工学 / 情報工学 / 数学 /
 *   地球科学・環境 / 農学
 *
 * 旧構成（分子・細胞 / 神経科学 / 医学・疾患 / 発生・モデル生物 / 技術・方法）
 * は生物学・医学・化学・情報工学 などに再配置されている。
 */

export interface KeywordNode {
  label: string;
  /** leaf のみ：実際に検索クエリとして使われる文字列 */
  keyword?: string;
  /** 中間ノードのみ */
  children?: KeywordNode[];
  /**
   * 主に Level 1（学問分野）に付与：この分野に対応する OpenAlex field code 配列。
   * tree でこのノードを選択／解除すると、URL の `f=...` フィルタも同期する。
   */
  fieldCodes?: string[];
}

export const KEYWORD_TREE: KeywordNode[] = [
  // ============================================================
  // 物理学
  // ============================================================
  {
    label: "物理学",
    fieldCodes: ["31"], // Physics and Astronomy
    children: [
      {
        label: "基礎物理",
        children: [
          {
            label: "古典物理",
            children: [
              { label: "力学", keyword: "力学" },
              { label: "電磁気学", keyword: "電磁気" },
              { label: "熱力学", keyword: "熱力学" },
              { label: "統計力学", keyword: "統計力学" },
            ],
          },
          {
            label: "現代物理",
            children: [
              { label: "量子力学", keyword: "量子力学" },
              { label: "相対論", keyword: "相対論" },
              { label: "場の理論", keyword: "場の理論" },
            ],
          },
        ],
      },
      {
        label: "凝縮系物理",
        children: [
          {
            label: "固体物理",
            children: [
              { label: "固体物理", keyword: "固体物理" },
              { label: "超伝導", keyword: "超伝導" },
              { label: "磁性", keyword: "磁性" },
              { label: "半導体物理", keyword: "半導体物理" },
            ],
          },
          {
            label: "ソフトマター",
            children: [
              { label: "ソフトマター", keyword: "ソフトマター" },
              { label: "液晶", keyword: "液晶" },
              { label: "コロイド", keyword: "コロイド" },
            ],
          },
        ],
      },
      {
        label: "素粒子・原子核・宇宙",
        children: [
          {
            label: "素粒子・原子核",
            children: [
              { label: "素粒子", keyword: "素粒子" },
              { label: "原子核", keyword: "原子核" },
              { label: "加速器", keyword: "加速器" },
            ],
          },
          {
            label: "天文・宇宙",
            children: [
              { label: "天文", keyword: "天文" },
              { label: "宇宙論", keyword: "宇宙論" },
              { label: "ブラックホール", keyword: "ブラックホール" },
              { label: "重力波", keyword: "重力波" },
            ],
          },
        ],
      },
      {
        label: "光学・プラズマ",
        children: [
          {
            label: "光学",
            children: [
              { label: "光学", keyword: "光学" },
              { label: "レーザー", keyword: "レーザー" },
              { label: "量子光学", keyword: "量子光学" },
              { label: "非線形光学", keyword: "非線形光学" },
            ],
          },
          {
            label: "プラズマ",
            children: [
              { label: "プラズマ", keyword: "プラズマ" },
              { label: "核融合", keyword: "核融合" },
            ],
          },
        ],
      },
      {
        label: "生物物理",
        children: [
          {
            label: "生物物理",
            children: [
              { label: "生物物理", keyword: "生物物理" },
              { label: "分子モーター", keyword: "分子モーター" },
              { label: "1分子計測", keyword: "1分子" },
            ],
          },
        ],
      },
    ],
  },

  // ============================================================
  // 化学
  // ============================================================
  {
    label: "化学",
    fieldCodes: ["16"], // Chemistry (化学工学=15は工学側に)
    children: [
      {
        label: "物理化学",
        children: [
          {
            label: "理論・分光",
            children: [
              { label: "量子化学", keyword: "量子化学" },
              { label: "分光", keyword: "分光" },
              { label: "反応速度", keyword: "反応速度" },
            ],
          },
          {
            label: "電気化学",
            children: [
              { label: "電気化学", keyword: "電気化学" },
              { label: "電極", keyword: "電極" },
            ],
          },
        ],
      },
      {
        label: "有機化学",
        children: [
          {
            label: "合成・反応",
            children: [
              { label: "有機合成", keyword: "有機合成" },
              { label: "不斉合成", keyword: "不斉合成" },
              { label: "触媒", keyword: "触媒" },
              { label: "有機反応", keyword: "有機反応" },
            ],
          },
          {
            label: "天然物・薬化学",
            children: [
              { label: "天然物", keyword: "天然物" },
              { label: "医薬化学", keyword: "医薬化学" },
              { label: "ケミカルバイオロジー", keyword: "ケミカルバイオロジー" },
            ],
          },
        ],
      },
      {
        label: "無機・錯体化学",
        children: [
          {
            label: "無機化学",
            children: [
              { label: "配位化学", keyword: "配位化学" },
              { label: "金属錯体", keyword: "金属錯体" },
              { label: "固体化学", keyword: "固体化学" },
              { label: "無機化学", keyword: "無機化学" },
            ],
          },
        ],
      },
      {
        label: "高分子・材料化学",
        children: [
          {
            label: "高分子",
            children: [
              { label: "高分子", keyword: "高分子" },
              { label: "ポリマー", keyword: "ポリマー" },
            ],
          },
          {
            label: "ナノ材料",
            children: [
              { label: "ナノ材料", keyword: "ナノ材料" },
              { label: "ナノ粒子", keyword: "ナノ粒子" },
              { label: "ナノテク", keyword: "ナノテクノロジー" },
            ],
          },
        ],
      },
      {
        label: "分析化学",
        children: [
          {
            label: "分析手法",
            children: [
              { label: "分析化学", keyword: "分析化学" },
              { label: "質量分析", keyword: "質量分析" },
              { label: "クロマトグラフィー", keyword: "クロマトグラフィー" },
            ],
          },
        ],
      },
      {
        label: "構造化学・結晶学",
        children: [
          {
            label: "構造解析",
            children: [
              { label: "構造化学", keyword: "構造化学" },
              { label: "構造生物学", keyword: "構造生物学" },
              { label: "X線結晶構造", keyword: "X線結晶構造" },
              { label: "クライオ電顕", keyword: "クライオ電顕" },
              { label: "NMR", keyword: "NMR" },
            ],
          },
        ],
      },
      {
        label: "生化学",
        children: [
          {
            label: "生化学",
            children: [
              { label: "生化学", keyword: "生化学" },
              { label: "酵素", keyword: "酵素" },
              { label: "代謝", keyword: "代謝" },
            ],
          },
        ],
      },
    ],
  },

  // ============================================================
  // 生物学
  // ============================================================
  {
    label: "生物学",
    fieldCodes: ["11", "13", "24", "28", "30"], // Agri/Bio, Biochem, Immun/Micro, Neuro, Pharma
    children: [
      {
        label: "分子・細胞",
        children: [
          {
            label: "分子",
            children: [
              { label: "DNA", keyword: "DNA" },
              { label: "RNA", keyword: "RNA" },
              { label: "ゲノム", keyword: "ゲノム" },
              { label: "エピゲノム", keyword: "エピゲノム" },
              { label: "タンパク質", keyword: "タンパク質" },
              { label: "受容体", keyword: "受容体" },
              { label: "キナーゼ", keyword: "キナーゼ" },
              { label: "脂質", keyword: "脂質" },
              { label: "糖質", keyword: "糖質" },
            ],
          },
          {
            label: "細胞",
            children: [
              { label: "細胞", keyword: "細胞" },
              { label: "ミトコンドリア", keyword: "ミトコンドリア" },
              { label: "小胞体", keyword: "小胞体" },
              { label: "リソソーム", keyword: "リソソーム" },
              { label: "オートファジー", keyword: "オートファジー" },
              { label: "細胞分裂", keyword: "細胞分裂" },
              { label: "細胞周期", keyword: "細胞周期" },
              { label: "アポトーシス", keyword: "アポトーシス" },
              { label: "シグナル伝達", keyword: "シグナル伝達" },
            ],
          },
          {
            label: "遺伝子発現",
            children: [
              { label: "遺伝子", keyword: "遺伝子" },
              { label: "遺伝子発現", keyword: "遺伝子発現" },
              { label: "転写", keyword: "転写" },
              { label: "翻訳", keyword: "翻訳" },
              { label: "エピジェネティクス", keyword: "エピジェネティクス" },
              { label: "クロマチン", keyword: "クロマチン" },
            ],
          },
        ],
      },
      {
        label: "神経科学",
        children: [
          {
            label: "基礎神経科学",
            children: [
              { label: "神経", keyword: "神経" },
              { label: "脳", keyword: "脳" },
              { label: "シナプス", keyword: "シナプス" },
              { label: "神経回路", keyword: "神経回路" },
              { label: "神経伝達物質", keyword: "神経伝達物質" },
              { label: "イオンチャネル", keyword: "イオンチャネル" },
            ],
          },
          {
            label: "認知・行動",
            children: [
              { label: "学習", keyword: "学習" },
              { label: "記憶", keyword: "記憶" },
              { label: "認知", keyword: "認知" },
              { label: "行動", keyword: "行動" },
              { label: "情動", keyword: "情動" },
            ],
          },
        ],
      },
      {
        label: "発生・モデル生物",
        children: [
          {
            label: "発生・再生",
            children: [
              { label: "発生", keyword: "発生" },
              { label: "胚", keyword: "胚" },
              { label: "形態形成", keyword: "形態形成" },
              { label: "幹細胞", keyword: "幹細胞" },
              { label: "再生", keyword: "再生" },
              { label: "iPS", keyword: "iPS" },
            ],
          },
          {
            label: "モデル動物",
            children: [
              { label: "マウス", keyword: "マウス" },
              { label: "ゼブラフィッシュ", keyword: "ゼブラフィッシュ" },
              { label: "ショウジョウバエ", keyword: "ショウジョウバエ" },
              { label: "線虫", keyword: "線虫" },
            ],
          },
        ],
      },
      {
        label: "生態・進化",
        children: [
          {
            label: "生態学",
            children: [
              { label: "生態", keyword: "生態" },
              { label: "群集生態", keyword: "群集生態" },
              { label: "個体群", keyword: "個体群" },
            ],
          },
          {
            label: "進化・系統",
            children: [
              { label: "進化", keyword: "進化" },
              { label: "系統", keyword: "系統" },
              { label: "分子進化", keyword: "分子進化" },
            ],
          },
        ],
      },
      {
        label: "植物科学",
        children: [
          {
            label: "植物生理",
            children: [
              { label: "植物", keyword: "植物" },
              { label: "光合成", keyword: "光合成" },
              { label: "シロイヌナズナ", keyword: "シロイヌナズナ" },
            ],
          },
        ],
      },
      {
        label: "微生物・免疫",
        children: [
          {
            label: "微生物",
            children: [
              { label: "微生物", keyword: "微生物" },
              { label: "細菌", keyword: "細菌" },
              { label: "酵母", keyword: "酵母" },
              { label: "大腸菌", keyword: "大腸菌" },
              { label: "ウイルス", keyword: "ウイルス" },
            ],
          },
          {
            label: "免疫学",
            children: [
              { label: "免疫", keyword: "免疫" },
              { label: "抗体", keyword: "抗体" },
              { label: "T細胞", keyword: "T細胞" },
              { label: "炎症", keyword: "炎症" },
            ],
          },
        ],
      },
      {
        label: "実験技術",
        children: [
          {
            label: "ゲノム編集",
            children: [
              { label: "CRISPR", keyword: "CRISPR" },
              { label: "ゲノム編集", keyword: "ゲノム編集" },
            ],
          },
          {
            label: "イメージング",
            children: [
              { label: "顕微鏡", keyword: "顕微鏡" },
              { label: "イメージング", keyword: "イメージング" },
              { label: "蛍光", keyword: "蛍光" },
            ],
          },
          {
            label: "オミクス",
            children: [
              { label: "オミクス", keyword: "オミクス" },
              { label: "プロテオミクス", keyword: "プロテオミクス" },
              { label: "メタボロミクス", keyword: "メタボロミクス" },
              { label: "シングルセル", keyword: "シングルセル" },
            ],
          },
        ],
      },
    ],
  },

  // ============================================================
  // 医学・健康科学
  // ============================================================
  {
    label: "医学・健康科学",
    fieldCodes: ["27", "29", "35", "36"], // Medicine, Nursing, Dentistry, Health Professions
    children: [
      {
        label: "がん",
        children: [
          {
            label: "がん基礎",
            children: [
              { label: "がん", keyword: "がん" },
              { label: "腫瘍", keyword: "腫瘍" },
              { label: "発がん", keyword: "発がん" },
            ],
          },
          {
            label: "がん進展",
            children: [
              { label: "転移", keyword: "転移" },
              { label: "腫瘍微小環境", keyword: "腫瘍微小環境" },
            ],
          },
        ],
      },
      {
        label: "代謝・生活習慣病",
        children: [
          {
            label: "代謝疾患",
            children: [
              { label: "糖尿病", keyword: "糖尿病" },
              { label: "肥満", keyword: "肥満" },
              { label: "脂質代謝", keyword: "脂質代謝" },
            ],
          },
        ],
      },
      {
        label: "神経・精神疾患",
        children: [
          {
            label: "神経変性疾患",
            children: [
              { label: "アルツハイマー", keyword: "アルツハイマー" },
              { label: "パーキンソン", keyword: "パーキンソン" },
              { label: "神経変性", keyword: "神経変性" },
            ],
          },
          {
            label: "精神疾患",
            children: [
              { label: "統合失調症", keyword: "統合失調症" },
              { label: "うつ", keyword: "うつ" },
            ],
          },
        ],
      },
      {
        label: "循環器・呼吸器",
        children: [
          {
            label: "循環器",
            children: [
              { label: "心臓", keyword: "心臓" },
              { label: "血管", keyword: "血管" },
              { label: "高血圧", keyword: "高血圧" },
            ],
          },
          {
            label: "呼吸器",
            children: [
              { label: "肺", keyword: "肺" },
              { label: "呼吸器", keyword: "呼吸器" },
            ],
          },
        ],
      },
      {
        label: "感染症",
        children: [
          {
            label: "感染症",
            children: [
              { label: "感染症", keyword: "感染症" },
              { label: "ウイルス感染", keyword: "ウイルス感染" },
            ],
          },
        ],
      },
      {
        label: "薬学・創薬",
        children: [
          {
            label: "薬理",
            children: [
              { label: "薬理", keyword: "薬理" },
              { label: "薬物動態", keyword: "薬物動態" },
            ],
          },
          {
            label: "創薬",
            children: [
              { label: "創薬", keyword: "創薬" },
              { label: "薬剤設計", keyword: "薬剤設計" },
            ],
          },
        ],
      },
      {
        label: "公衆衛生",
        children: [
          {
            label: "疫学・予防",
            children: [
              { label: "疫学", keyword: "疫学" },
              { label: "予防医学", keyword: "予防医学" },
              { label: "公衆衛生", keyword: "公衆衛生" },
            ],
          },
        ],
      },
      {
        label: "医用工学",
        children: [
          {
            label: "医用工学・医療機器",
            children: [
              { label: "医用工学", keyword: "医用工学" },
              { label: "生体材料", keyword: "生体材料" },
              { label: "医療機器", keyword: "医療機器" },
            ],
          },
        ],
      },
    ],
  },

  // ============================================================
  // 工学
  // ============================================================
  {
    label: "工学",
    fieldCodes: ["15", "21", "22", "25"], // Chem Eng, Energy, Engineering, Materials Science
    children: [
      {
        label: "機械・ロボティクス",
        children: [
          {
            label: "機械工学",
            children: [
              { label: "機械", keyword: "機械" },
              { label: "制御", keyword: "制御" },
              { label: "流体", keyword: "流体" },
            ],
          },
          {
            label: "ロボティクス",
            children: [
              { label: "ロボット", keyword: "ロボット" },
              { label: "ロボティクス", keyword: "ロボティクス" },
              { label: "アクチュエータ", keyword: "アクチュエータ" },
            ],
          },
        ],
      },
      {
        label: "電気・電子",
        children: [
          {
            label: "電子工学",
            children: [
              { label: "電子工学", keyword: "電子工学" },
              { label: "半導体", keyword: "半導体" },
              { label: "集積回路", keyword: "集積回路" },
              { label: "光デバイス", keyword: "光デバイス" },
            ],
          },
          {
            label: "通信",
            children: [
              { label: "通信", keyword: "通信" },
              { label: "アンテナ", keyword: "アンテナ" },
              { label: "信号処理", keyword: "信号処理" },
            ],
          },
        ],
      },
      {
        label: "化学工学",
        children: [
          {
            label: "プロセス・反応",
            children: [
              { label: "化学工学", keyword: "化学工学" },
              { label: "反応工学", keyword: "反応工学" },
              { label: "プロセス", keyword: "プロセス" },
            ],
          },
        ],
      },
      {
        label: "土木・建築",
        children: [
          {
            label: "建築・構造",
            children: [
              { label: "建築", keyword: "建築" },
              { label: "土木", keyword: "土木" },
              { label: "構造工学", keyword: "構造工学" },
            ],
          },
          {
            label: "都市・地盤",
            children: [
              { label: "都市計画", keyword: "都市計画" },
              { label: "地盤工学", keyword: "地盤" },
              { label: "交通", keyword: "交通" },
            ],
          },
        ],
      },
      {
        label: "材料工学",
        children: [
          {
            label: "材料",
            children: [
              { label: "金属材料", keyword: "金属材料" },
              { label: "セラミックス", keyword: "セラミックス" },
              { label: "複合材料", keyword: "複合材料" },
              { label: "薄膜", keyword: "薄膜" },
            ],
          },
        ],
      },
      {
        label: "航空宇宙",
        children: [
          {
            label: "航空・宇宙工学",
            children: [
              { label: "航空", keyword: "航空" },
              { label: "宇宙工学", keyword: "宇宙工学" },
              { label: "ロケット", keyword: "ロケット" },
              { label: "推進", keyword: "推進" },
            ],
          },
        ],
      },
      {
        label: "エネルギー",
        children: [
          {
            label: "エネルギー工学",
            children: [
              { label: "エネルギー", keyword: "エネルギー" },
              { label: "電池", keyword: "電池" },
              { label: "太陽電池", keyword: "太陽電池" },
              { label: "水素", keyword: "水素" },
              { label: "再生可能エネルギー", keyword: "再生可能エネルギー" },
            ],
          },
        ],
      },
    ],
  },

  // ============================================================
  // 情報工学
  // ============================================================
  {
    label: "情報工学",
    fieldCodes: ["17"], // Computer Science
    children: [
      {
        label: "計算機科学",
        children: [
          {
            label: "理論計算機科学",
            children: [
              { label: "アルゴリズム", keyword: "アルゴリズム" },
              { label: "計算量", keyword: "計算量" },
              { label: "暗号", keyword: "暗号" },
              { label: "プログラミング言語", keyword: "プログラミング言語" },
            ],
          },
          {
            label: "システム",
            children: [
              { label: "OS", keyword: "OS" },
              { label: "並列計算", keyword: "並列計算" },
              { label: "分散システム", keyword: "分散システム" },
              { label: "データベース", keyword: "データベース" },
            ],
          },
        ],
      },
      {
        label: "AI・機械学習",
        children: [
          {
            label: "機械学習",
            children: [
              { label: "機械学習", keyword: "機械学習" },
              { label: "深層学習", keyword: "深層学習" },
              { label: "強化学習", keyword: "強化学習" },
            ],
          },
          {
            label: "応用 AI",
            children: [
              { label: "自然言語処理", keyword: "自然言語処理" },
              { label: "コンピュータビジョン", keyword: "コンピュータビジョン" },
              { label: "音声認識", keyword: "音声認識" },
              { label: "生成 AI", keyword: "生成AI" },
            ],
          },
        ],
      },
      {
        label: "データサイエンス",
        children: [
          {
            label: "データ解析",
            children: [
              { label: "データサイエンス", keyword: "データサイエンス" },
              { label: "ビッグデータ", keyword: "ビッグデータ" },
              { label: "データマイニング", keyword: "データマイニング" },
            ],
          },
        ],
      },
      {
        label: "ネットワーク・セキュリティ",
        children: [
          {
            label: "ネットワーク",
            children: [
              { label: "ネットワーク", keyword: "ネットワーク" },
              { label: "IoT", keyword: "IoT" },
              { label: "クラウド", keyword: "クラウド" },
            ],
          },
          {
            label: "セキュリティ",
            children: [
              { label: "セキュリティ", keyword: "セキュリティ" },
              { label: "暗号通信", keyword: "暗号通信" },
            ],
          },
        ],
      },
      {
        label: "HCI・VR",
        children: [
          {
            label: "HCI",
            children: [
              { label: "HCI", keyword: "HCI" },
              { label: "ヒューマンインタフェース", keyword: "インタフェース" },
              { label: "VR", keyword: "VR" },
              { label: "AR", keyword: "AR" },
            ],
          },
        ],
      },
      {
        label: "バイオインフォマティクス",
        children: [
          {
            label: "計算生物学",
            children: [
              {
                label: "バイオインフォマティクス",
                keyword: "バイオインフォマティクス",
              },
              { label: "計算生物学", keyword: "計算生物学" },
              { label: "ゲノム解析", keyword: "ゲノム解析" },
            ],
          },
        ],
      },
    ],
  },

  // ============================================================
  // 数学
  // ============================================================
  {
    label: "数学",
    fieldCodes: ["26"], // Mathematics
    children: [
      {
        label: "純粋数学",
        children: [
          {
            label: "解析",
            children: [
              { label: "解析", keyword: "解析" },
              { label: "微分方程式", keyword: "微分方程式" },
              { label: "関数解析", keyword: "関数解析" },
            ],
          },
          {
            label: "代数・幾何",
            children: [
              { label: "代数", keyword: "代数" },
              { label: "幾何", keyword: "幾何" },
              { label: "トポロジー", keyword: "トポロジー" },
              { label: "数論", keyword: "数論" },
            ],
          },
        ],
      },
      {
        label: "確率・統計",
        children: [
          {
            label: "確率論・統計学",
            children: [
              { label: "確率", keyword: "確率" },
              { label: "統計", keyword: "統計" },
              { label: "確率過程", keyword: "確率過程" },
            ],
          },
        ],
      },
      {
        label: "応用・計算数学",
        children: [
          {
            label: "応用数学",
            children: [
              { label: "応用数学", keyword: "応用数学" },
              { label: "数値解析", keyword: "数値解析" },
              { label: "最適化", keyword: "最適化" },
              { label: "数理モデル", keyword: "数理モデル" },
            ],
          },
        ],
      },
    ],
  },

  // ============================================================
  // 地球科学・環境
  // ============================================================
  {
    label: "地球科学・環境",
    fieldCodes: ["19", "23"], // Earth and Planetary, Environmental Science
    children: [
      {
        label: "地球物理",
        children: [
          {
            label: "地震・火山",
            children: [
              { label: "地震", keyword: "地震" },
              { label: "火山", keyword: "火山" },
              { label: "地球内部", keyword: "地球内部" },
            ],
          },
          {
            label: "気象・気候",
            children: [
              { label: "気象", keyword: "気象" },
              { label: "気候変動", keyword: "気候変動" },
              { label: "大気", keyword: "大気" },
            ],
          },
        ],
      },
      {
        label: "海洋・地質",
        children: [
          {
            label: "海洋",
            children: [
              { label: "海洋", keyword: "海洋" },
              { label: "海洋生物", keyword: "海洋生物" },
            ],
          },
          {
            label: "地質・鉱物",
            children: [
              { label: "地質", keyword: "地質" },
              { label: "鉱物", keyword: "鉱物" },
              { label: "古生物", keyword: "古生物" },
            ],
          },
        ],
      },
      {
        label: "環境科学",
        children: [
          {
            label: "環境保全",
            children: [
              { label: "環境", keyword: "環境" },
              { label: "生物多様性", keyword: "生物多様性" },
              { label: "持続可能", keyword: "持続可能" },
              { label: "生態系", keyword: "生態系" },
            ],
          },
        ],
      },
    ],
  },

  // ============================================================
  // 農学
  // ============================================================
  {
    label: "農学",
    fieldCodes: ["11", "34"], // Agricultural and Biological, Veterinary
    children: [
      {
        label: "作物・植物科学",
        children: [
          {
            label: "作物科学",
            children: [
              { label: "作物", keyword: "作物" },
              { label: "育種", keyword: "育種" },
              { label: "農芸化学", keyword: "農芸化学" },
            ],
          },
        ],
      },
      {
        label: "畜産・獣医",
        children: [
          {
            label: "畜産",
            children: [
              { label: "畜産", keyword: "畜産" },
              { label: "家畜", keyword: "家畜" },
              { label: "獣医", keyword: "獣医" },
            ],
          },
        ],
      },
      {
        label: "食品・水産",
        children: [
          {
            label: "食品科学",
            children: [
              { label: "食品", keyword: "食品" },
              { label: "栄養", keyword: "栄養" },
            ],
          },
          {
            label: "水産",
            children: [
              { label: "水産", keyword: "水産" },
              { label: "養殖", keyword: "養殖" },
            ],
          },
        ],
      },
      {
        label: "森林・林業",
        children: [
          {
            label: "森林科学",
            children: [
              { label: "森林", keyword: "森林" },
              { label: "林業", keyword: "林業" },
            ],
          },
        ],
      },
    ],
  },
];

// ============================================================
// 便利関数（変更なし）
// ============================================================

/** ノード配下のすべての leaf キーワードを再帰収集 */
export function collectLeafKeywords(node: KeywordNode): string[] {
  if (node.keyword) return [node.keyword];
  const out: string[] = [];
  for (const child of node.children ?? []) {
    out.push(...collectLeafKeywords(child));
  }
  return out;
}

/** ツリー全体の leaf キーワード集合（重複排除済み） */
export function getAllTreeKeywords(): string[] {
  const set = new Set<string>();
  for (const root of KEYWORD_TREE) {
    for (const k of collectLeafKeywords(root)) set.add(k);
  }
  return [...set];
}

export type NodeSelectionState = "none" | "partial" | "all";

export function nodeSelectionState(
  node: KeywordNode,
  selected: Set<string>,
): NodeSelectionState {
  const leaves = collectLeafKeywords(node);
  if (leaves.length === 0) return "none";
  const hit = leaves.filter((k) => selected.has(k)).length;
  if (hit === 0) return "none";
  if (hit === leaves.length) return "all";
  return "partial";
}
