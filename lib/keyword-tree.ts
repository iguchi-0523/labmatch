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
  {
    label: "物理学",
    fieldCodes: ["31"],
    children: [
      {
        label: "理論・基礎物理",
        children: [
          {
            label: "古典物理",
            children: [
              {
                label: "力学理論",
                children: [
                  {
                    label: "質点・剛体力学",
                    children: [
                      { label: "力学", keyword: "力学" },
                      { label: "解析力学", keyword: "解析力学" },
                      { label: "剛体の力学", keyword: "剛体の力学" },
                      { label: "ハミルトン力学", keyword: "ハミルトン力学" }
                    ],
                  },
                  {
                    label: "連続体・流体力学",
                    children: [
                      { label: "連続体力学", keyword: "連続体力学" },
                      { label: "流体力学", keyword: "流体力学" },
                      { label: "弾性体力学", keyword: "弾性体力学" }
                    ],
                  },
                  {
                    label: "非線形・カオス",
                    children: [
                      { label: "非線形力学", keyword: "非線形力学" },
                      { label: "カオス理論", keyword: "カオス理論" },
                      { label: "非線形動力学", keyword: "非線形動力学" },
                      { label: "可積分系", keyword: "可積分系" }
                    ],
                  }
                ],
              },
              {
                label: "電磁気理論",
                children: [
                  {
                    label: "電場・磁場理論",
                    children: [
                      { label: "電磁気", keyword: "電磁気" },
                      { label: "古典電磁気学", keyword: "古典電磁気学" },
                      { label: "電磁場理論", keyword: "電磁場理論" }
                    ],
                  },
                  {
                    label: "電気力学・電磁波",
                    children: [
                      { label: "電気力学", keyword: "電気力学" },
                      { label: "電磁波", keyword: "電磁波" },
                      { label: "磁気流体力学", keyword: "磁気流体力学" }
                    ],
                  }
                ],
              },
              {
                label: "熱・統計物理",
                children: [
                  {
                    label: "熱力学・相転移",
                    children: [
                      { label: "熱力学", keyword: "熱力学" },
                      { label: "相転移", keyword: "相転移" },
                      { label: "臨界現象", keyword: "臨界現象" }
                    ],
                  },
                  {
                    label: "統計力学・非平衡",
                    children: [
                      { label: "統計力学", keyword: "統計力学" },
                      { label: "非平衡統計力学", keyword: "非平衡統計力学" },
                      { label: "ゆらぎの熱力学", keyword: "ゆらぎの熱力学" },
                      { label: "確率的熱力学", keyword: "確率的熱力学" },
                      { label: "パーコレーション", keyword: "パーコレーション" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "現代物理",
            children: [
              {
                label: "量子論",
                children: [
                  {
                    label: "量子力学基礎",
                    children: [
                      { label: "量子力学", keyword: "量子力学" },
                      { label: "量子多体系", keyword: "量子多体系" },
                      { label: "量子測定", keyword: "量子測定" },
                      { label: "量子カオス", keyword: "量子カオス" }
                    ],
                  },
                  {
                    label: "場の量子論",
                    children: [
                      { label: "場の理論", keyword: "場の理論" },
                      { label: "量子電磁力学", keyword: "量子電磁力学" },
                      { label: "くりこみ群", keyword: "くりこみ群" },
                      { label: "トポロジカル場の理論", keyword: "トポロジカル場の理論" }
                    ],
                  },
                  {
                    label: "量子情報基礎",
                    children: [
                      { label: "量子情報理論", keyword: "量子情報理論" },
                      { label: "量子エンタングルメント", keyword: "量子エンタングルメント" }
                    ],
                  }
                ],
              },
              {
                label: "相対論・重力理論",
                children: [
                  {
                    label: "相対性理論",
                    children: [
                      { label: "相対論", keyword: "相対論" },
                      { label: "特殊相対性理論", keyword: "特殊相対性理論" },
                      { label: "一般相対性理論", keyword: "一般相対性理論" }
                    ],
                  },
                  {
                    label: "重力・量子重力",
                    children: [
                      { label: "重力理論", keyword: "重力理論" },
                      { label: "量子重力", keyword: "量子重力" },
                      { label: "ブラックホール熱力学", keyword: "ブラックホール熱力学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "物性・凝縮系物理",
        children: [
          {
            label: "固体電子物性",
            children: [
              {
                label: "電子構造・バンド",
                children: [
                  {
                    label: "バンド計算",
                    children: [
                      { label: "固体物理", keyword: "固体物理" },
                      { label: "バンド構造", keyword: "バンド構造" },
                      { label: "電子状態計算", keyword: "電子状態計算" },
                      { label: "光電子分光", keyword: "光電子分光" }
                    ],
                  },
                  {
                    label: "第一原理電子計算",
                    children: [
                      { label: "第一原理計算", keyword: "第一原理計算" },
                      { label: "密度汎関数理論", keyword: "密度汎関数理論" }
                    ],
                  }
                ],
              },
              {
                label: "強相関・超伝導",
                children: [
                  {
                    label: "超伝導物理",
                    children: [
                      { label: "超伝導", keyword: "超伝導" },
                      { label: "高温超伝導", keyword: "高温超伝導" },
                      { label: "非従来型超伝導", keyword: "非従来型超伝導" },
                      { label: "鉄系超伝導", keyword: "鉄系超伝導" }
                    ],
                  },
                  {
                    label: "強相関系",
                    children: [
                      { label: "強相関電子系", keyword: "強相関電子系" },
                      { label: "量子相転移", keyword: "量子相転移" },
                      { label: "モット絶縁体", keyword: "モット絶縁体" },
                      { label: "重い電子系", keyword: "重い電子系" }
                    ],
                  }
                ],
              },
              {
                label: "トポロジカル物性",
                children: [
                  {
                    label: "トポロジカル電子系",
                    children: [
                      { label: "トポロジカル絶縁体", keyword: "トポロジカル絶縁体" },
                      { label: "トポロジカル物質", keyword: "トポロジカル物質" },
                      { label: "ワイル半金属", keyword: "ワイル半金属" },
                      { label: "ディラック半金属", keyword: "ディラック半金属" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "磁性・スピン物性",
            children: [
              {
                label: "磁性物理",
                children: [
                  {
                    label: "磁気秩序",
                    children: [
                      { label: "磁性", keyword: "磁性" },
                      { label: "強磁性", keyword: "強磁性" },
                      { label: "反強磁性", keyword: "反強磁性" }
                    ],
                  },
                  {
                    label: "スピン系・フラストレーション",
                    children: [
                      { label: "スピン系", keyword: "スピン系" },
                      { label: "量子スピン系", keyword: "量子スピン系" },
                      { label: "フラストレート磁性", keyword: "フラストレート磁性" },
                      { label: "スピングラス", keyword: "スピングラス" },
                      { label: "量子スピン液体", keyword: "量子スピン液体" }
                    ],
                  }
                ],
              },
              {
                label: "スピントロニクス物理",
                children: [
                  {
                    label: "スピン流・スキルミオン",
                    children: [
                      { label: "スピントロニクス", keyword: "スピントロニクス" },
                      { label: "スピン流", keyword: "スピン流" },
                      { label: "スキルミオン", keyword: "スキルミオン" },
                      { label: "磁壁", keyword: "磁壁" },
                      { label: "スピン軌道相互作用", keyword: "スピン軌道相互作用" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "半導体・ナノ物性",
            children: [
              {
                label: "半導体物性",
                children: [
                  {
                    label: "半導体・低次元系",
                    children: [
                      { label: "半導体物理", keyword: "半導体物理" },
                      { label: "二次元物質", keyword: "二次元物質" },
                      { label: "グラフェン", keyword: "グラフェン" },
                      { label: "熱電変換", keyword: "熱電変換" }
                    ],
                  },
                  {
                    label: "量子ナノ構造",
                    children: [
                      { label: "量子ドット", keyword: "量子ドット" },
                      { label: "量子井戸", keyword: "量子井戸" },
                      { label: "量子細線", keyword: "量子細線" }
                    ],
                  }
                ],
              },
              {
                label: "メゾスコピック系",
                children: [
                  {
                    label: "メゾスコピック輸送",
                    children: [
                      { label: "メゾスコピック物理", keyword: "メゾスコピック物理" },
                      { label: "量子輸送", keyword: "量子輸送" },
                      { label: "量子ホール効果", keyword: "量子ホール効果" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "ソフトマター・生物物理",
            children: [
              {
                label: "ソフトマター物理",
                children: [
                  {
                    label: "高分子・コロイド",
                    children: [
                      { label: "ソフトマター", keyword: "ソフトマター" },
                      { label: "高分子物理", keyword: "高分子物理" },
                      { label: "コロイド", keyword: "コロイド" },
                      { label: "ゲル", keyword: "ゲル" }
                    ],
                  },
                  {
                    label: "液晶・ガラス",
                    children: [
                      { label: "液晶", keyword: "液晶" },
                      { label: "ガラス転移", keyword: "ガラス転移" },
                      { label: "アクティブマター", keyword: "アクティブマター" }
                    ],
                  }
                ],
              },
              {
                label: "生物物理学",
                children: [
                  {
                    label: "1分子・分子モーター",
                    children: [
                      { label: "生物物理", keyword: "生物物理" },
                      { label: "分子モーター", keyword: "分子モーター" },
                      { label: "1分子", keyword: "1分子" }
                    ],
                  },
                  {
                    label: "生体分子・神経物理",
                    children: [
                      { label: "生体分子動力学", keyword: "生体分子動力学" },
                      { label: "神経物理", keyword: "神経物理" },
                      { label: "蛋白質フォールディング", keyword: "蛋白質フォールディング" },
                      { label: "生体膜", keyword: "生体膜" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "量子・光・プラズマ科学",
        children: [
          {
            label: "光科学",
            children: [
              {
                label: "光学・レーザー",
                children: [
                  {
                    label: "光学・非線形光学",
                    children: [
                      { label: "光学", keyword: "光学" },
                      { label: "非線形光学", keyword: "非線形光学" }
                    ],
                  },
                  {
                    label: "レーザー物理",
                    children: [
                      { label: "レーザー", keyword: "レーザー" },
                      { label: "超短パルスレーザー", keyword: "超短パルスレーザー" },
                      { label: "高強度レーザー", keyword: "高強度レーザー" }
                    ],
                  }
                ],
              },
              {
                label: "量子光学・フォトニクス",
                children: [
                  {
                    label: "量子光学・光計測",
                    children: [
                      { label: "量子光学", keyword: "量子光学" },
                      { label: "光周波数コム", keyword: "光周波数コム" },
                      { label: "単一光子", keyword: "単一光子" }
                    ],
                  },
                  {
                    label: "フォトニクス・超高速光科学",
                    children: [
                      { label: "フォトニクス", keyword: "フォトニクス" },
                      { label: "アト秒科学", keyword: "アト秒科学" },
                      { label: "テラヘルツ", keyword: "テラヘルツ" },
                      { label: "超高速分光", keyword: "超高速分光" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "量子技術物理",
            children: [
              {
                label: "量子計算・センシング",
                children: [
                  {
                    label: "量子コンピュータ",
                    children: [
                      { label: "量子コンピュータ物理", keyword: "量子コンピュータ物理" },
                      { label: "量子ビット", keyword: "量子ビット" },
                      { label: "量子誤り訂正", keyword: "量子誤り訂正" }
                    ],
                  },
                  {
                    label: "冷却原子・量子センシング",
                    children: [
                      { label: "冷却原子", keyword: "冷却原子" },
                      { label: "イオントラップ", keyword: "イオントラップ" },
                      { label: "量子センシング", keyword: "量子センシング" },
                      { label: "ボース・アインシュタイン凝縮", keyword: "ボース・アインシュタイン凝縮" },
                      { label: "光格子", keyword: "光格子" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "プラズマ・核融合",
            children: [
              {
                label: "プラズマ物理学",
                children: [
                  {
                    label: "プラズマ物理",
                    children: [
                      { label: "プラズマ", keyword: "プラズマ" },
                      { label: "高温プラズマ", keyword: "高温プラズマ" },
                      { label: "レーザープラズマ", keyword: "レーザープラズマ" },
                      { label: "宇宙プラズマ", keyword: "宇宙プラズマ" }
                    ],
                  }
                ],
              },
              {
                label: "核融合科学",
                children: [
                  {
                    label: "核融合プラズマ",
                    children: [
                      { label: "核融合", keyword: "核融合" },
                      { label: "磁場閉じ込め", keyword: "磁場閉じ込め" },
                      { label: "慣性核融合", keyword: "慣性核融合" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "素粒子・原子核・宇宙",
        children: [
          {
            label: "素粒子・原子核物理",
            children: [
              {
                label: "素粒子物理学",
                children: [
                  {
                    label: "標準模型・弦理論",
                    children: [
                      { label: "素粒子", keyword: "素粒子" },
                      { label: "ヒッグス物理", keyword: "ヒッグス物理" },
                      { label: "超対称性", keyword: "超対称性" },
                      { label: "弦理論", keyword: "弦理論" }
                    ],
                  },
                  {
                    label: "格子・ニュートリノ",
                    children: [
                      { label: "格子ゲージ理論", keyword: "格子ゲージ理論" },
                      { label: "ニュートリノ物理", keyword: "ニュートリノ物理" }
                    ],
                  }
                ],
              },
              {
                label: "原子核物理学",
                children: [
                  {
                    label: "ハドロン・核構造",
                    children: [
                      { label: "原子核", keyword: "原子核" },
                      { label: "ハドロン物理", keyword: "ハドロン物理" },
                      { label: "クォークグルーオンプラズマ", keyword: "クォークグルーオンプラズマ" },
                      { label: "不安定核", keyword: "不安定核" },
                      { label: "反物質", keyword: "反物質" }
                    ],
                  }
                ],
              },
              {
                label: "加速器科学",
                children: [
                  {
                    label: "加速器・放射光",
                    children: [
                      { label: "加速器", keyword: "加速器" },
                      { label: "ビーム物理", keyword: "ビーム物理" },
                      { label: "放射光", keyword: "放射光" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "宇宙・天文物理",
            children: [
              {
                label: "観測天文物理",
                children: [
                  {
                    label: "電波・光赤外観測",
                    children: [
                      { label: "天文", keyword: "天文" },
                      { label: "観測天文学", keyword: "観測天文学" },
                      { label: "電波天文学", keyword: "電波天文学" }
                    ],
                  },
                  {
                    label: "恒星・銀河・系外惑星",
                    children: [
                      { label: "系外惑星", keyword: "系外惑星" },
                      { label: "太陽物理", keyword: "太陽物理" },
                      { label: "銀河形成", keyword: "銀河形成" }
                    ],
                  }
                ],
              },
              {
                label: "宇宙物理・宇宙論",
                children: [
                  {
                    label: "宇宙論・暗黒物質",
                    children: [
                      { label: "宇宙論", keyword: "宇宙論" },
                      { label: "暗黒物質", keyword: "暗黒物質" },
                      { label: "暗黒エネルギー", keyword: "暗黒エネルギー" },
                      { label: "宇宙背景放射", keyword: "宇宙背景放射" }
                    ],
                  },
                  {
                    label: "高エネルギー宇宙・重力波",
                    children: [
                      { label: "ブラックホール", keyword: "ブラックホール" },
                      { label: "重力波", keyword: "重力波" },
                      { label: "宇宙物理学", keyword: "宇宙物理学" },
                      { label: "中性子星", keyword: "中性子星" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      }
    ],
  },
  {
    label: "化学",
    fieldCodes: ["16"],
    children: [
      {
        label: "物理化学",
        children: [
          {
            label: "量子・理論化学",
            children: [
              {
                label: "量子化学理論",
                children: [
                  {
                    label: "電子構造論",
                    children: [
                      { label: "量子化学", keyword: "量子化学" },
                      { label: "分子軌道法", keyword: "分子軌道法" },
                      { label: "電子状態理論", keyword: "電子状態理論" }
                    ],
                  },
                  {
                    label: "計算化学手法",
                    children: [
                      { label: "計算化学", keyword: "計算化学" },
                      { label: "分子動力学計算", keyword: "分子動力学計算" },
                      { label: "第一原理計算", keyword: "第一原理計算" },
                      { label: "密度汎関数法", keyword: "密度汎関数法" }
                    ],
                  }
                ],
              },
              {
                label: "理論化学",
                children: [
                  {
                    label: "分子理論・統計力学",
                    children: [
                      { label: "統計熱力学", keyword: "統計熱力学" },
                      { label: "分子シミュレーション", keyword: "分子シミュレーション" },
                      { label: "化学結合論", keyword: "化学結合論" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "分光・分子分光",
            children: [
              {
                label: "分光学分野",
                children: [
                  {
                    label: "磁気共鳴・振動分光",
                    children: [
                      { label: "分光学", keyword: "分光学" },
                      { label: "NMR分光", keyword: "NMR分光" },
                      { label: "振動分光", keyword: "振動分光" }
                    ],
                  },
                  {
                    label: "レーザー・時間分解分光",
                    children: [
                      { label: "レーザー分光", keyword: "レーザー分光" },
                      { label: "時間分解分光", keyword: "時間分解分光" },
                      { label: "分光", keyword: "分光" },
                      { label: "超高速分光", keyword: "超高速分光" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "反応・速度論",
            children: [
              {
                label: "化学反応論",
                children: [
                  {
                    label: "反応速度論解析",
                    children: [
                      { label: "反応速度論", keyword: "反応速度論" },
                      { label: "反応速度", keyword: "反応速度" },
                      { label: "化学反応ダイナミクス", keyword: "化学反応ダイナミクス" },
                      { label: "反応機構", keyword: "反応機構" }
                    ],
                  },
                  {
                    label: "光化学",
                    children: [
                      { label: "光化学反応", keyword: "光化学反応" },
                      { label: "光物理化学", keyword: "光物理化学" },
                      { label: "励起状態ダイナミクス", keyword: "励起状態ダイナミクス" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "熱・電気化学",
            children: [
              {
                label: "化学熱力学分野",
                children: [
                  {
                    label: "熱力学・溶液論",
                    children: [
                      { label: "化学熱力学", keyword: "化学熱力学" },
                      { label: "溶液化学", keyword: "溶液化学" },
                      { label: "界面化学", keyword: "界面化学" }
                    ],
                  }
                ],
              },
              {
                label: "電気化学分野",
                children: [
                  {
                    label: "電気化学基礎",
                    children: [
                      { label: "電気化学", keyword: "電気化学" },
                      { label: "電極", keyword: "電極" },
                      { label: "電極触媒", keyword: "電極触媒" }
                    ],
                  },
                  {
                    label: "エネルギー電気化学",
                    children: [
                      { label: "電池材料", keyword: "電池材料" },
                      { label: "光電気化学", keyword: "光電気化学" },
                      { label: "燃料電池", keyword: "燃料電池" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "有機化学",
        children: [
          {
            label: "有機合成化学",
            children: [
              {
                label: "合成方法論",
                children: [
                  {
                    label: "基本合成戦略",
                    children: [
                      { label: "有機合成", keyword: "有機合成" },
                      { label: "全合成", keyword: "全合成" },
                      { label: "有機反応", keyword: "有機反応" }
                    ],
                  },
                  {
                    label: "立体・有機金属合成",
                    children: [
                      { label: "不斉合成", keyword: "不斉合成" },
                      { label: "有機金属化学", keyword: "有機金属化学" },
                      { label: "立体選択的合成", keyword: "立体選択的合成" }
                    ],
                  }
                ],
              },
              {
                label: "触媒的反応開発",
                children: [
                  {
                    label: "不斉・遷移金属触媒",
                    children: [
                      { label: "不斉触媒", keyword: "不斉触媒" },
                      { label: "クロスカップリング", keyword: "クロスカップリング" },
                      { label: "触媒", keyword: "触媒" },
                      { label: "遷移金属触媒", keyword: "遷移金属触媒" }
                    ],
                  },
                  {
                    label: "新規結合形成",
                    children: [
                      { label: "光レドックス触媒", keyword: "光レドックス触媒" },
                      { label: "C-H活性化", keyword: "C-H活性化" },
                      { label: "有機触媒", keyword: "有機触媒" },
                      { label: "フロー合成", keyword: "フロー合成" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "構造・機能有機化学",
            children: [
              {
                label: "構造有機化学分野",
                children: [
                  {
                    label: "構造・物理有機化学",
                    children: [
                      { label: "構造有機化学", keyword: "構造有機化学" },
                      { label: "芳香族化学", keyword: "芳香族化学" },
                      { label: "物理有機化学", keyword: "物理有機化学" }
                    ],
                  },
                  {
                    label: "超分子・有機材料",
                    children: [
                      { label: "超分子化学", keyword: "超分子化学" },
                      { label: "有機半導体材料", keyword: "有機半導体材料" },
                      { label: "分子認識", keyword: "分子認識" },
                      { label: "有機エレクトロニクス", keyword: "有機エレクトロニクス" }
                    ],
                  }
                ],
              },
              {
                label: "元素・機能分子",
                children: [
                  {
                    label: "主族元素・機能性分子",
                    children: [
                      { label: "典型元素化学", keyword: "典型元素化学" },
                      { label: "フッ素化学", keyword: "フッ素化学" },
                      { label: "機能性色素", keyword: "機能性色素" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "生物有機化学",
            children: [
              {
                label: "天然物・医薬化学",
                children: [
                  {
                    label: "天然物・全合成化学",
                    children: [
                      { label: "天然物化学", keyword: "天然物化学" },
                      { label: "天然物", keyword: "天然物" },
                      { label: "生物活性天然物", keyword: "生物活性天然物" }
                    ],
                  },
                  {
                    label: "医薬・創薬化学",
                    children: [
                      { label: "医薬品化学", keyword: "医薬品化学" },
                      { label: "医薬化学", keyword: "医薬化学" },
                      { label: "創薬化学", keyword: "創薬化学" }
                    ],
                  },
                  {
                    label: "ケミカルバイオロジー・生体分子",
                    children: [
                      { label: "ケミカルバイオロジー", keyword: "ケミカルバイオロジー" },
                      { label: "ペプチド化学", keyword: "ペプチド化学" },
                      { label: "糖鎖化学", keyword: "糖鎖化学" },
                      { label: "核酸化学", keyword: "核酸化学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "無機・錯体化学",
        children: [
          {
            label: "錯体・有機金属化学",
            children: [
              {
                label: "配位化学分野",
                children: [
                  {
                    label: "配位・錯体化学",
                    children: [
                      { label: "配位化学", keyword: "配位化学" },
                      { label: "金属錯体", keyword: "金属錯体" }
                    ],
                  },
                  {
                    label: "有機金属・クラスター",
                    children: [
                      { label: "有機金属錯体", keyword: "有機金属錯体" },
                      { label: "金属クラスター", keyword: "金属クラスター" },
                      { label: "錯体触媒", keyword: "錯体触媒" }
                    ],
                  }
                ],
              },
              {
                label: "機能錯体化学",
                children: [
                  {
                    label: "光・磁気機能錯体",
                    children: [
                      { label: "発光性錯体", keyword: "発光性錯体" },
                      { label: "分子磁性", keyword: "分子磁性" },
                      { label: "金属酵素モデル", keyword: "金属酵素モデル" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "固体・無機材料化学",
            children: [
              {
                label: "固体化学分野",
                children: [
                  {
                    label: "固体・結晶化学",
                    children: [
                      { label: "固体化学", keyword: "固体化学" },
                      { label: "結晶化学", keyword: "結晶化学" },
                      { label: "無機化学", keyword: "無機化学" }
                    ],
                  },
                  {
                    label: "多孔性・機能材料",
                    children: [
                      { label: "多孔性材料", keyword: "多孔性材料" },
                      { label: "無機材料化学", keyword: "無機材料化学" },
                      { label: "金属有機構造体", keyword: "金属有機構造体" },
                      { label: "ゼオライト", keyword: "ゼオライト" }
                    ],
                  }
                ],
              },
              {
                label: "無機機能材料",
                children: [
                  {
                    label: "無機固体機能材料",
                    children: [
                      { label: "無機蛍光体", keyword: "無機蛍光体" },
                      { label: "誘電体材料", keyword: "誘電体材料" },
                      { label: "磁性材料", keyword: "磁性材料" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "触媒化学",
            children: [
              {
                label: "触媒設計",
                children: [
                  {
                    label: "不均一・固体触媒",
                    children: [
                      { label: "不均一触媒", keyword: "不均一触媒" },
                      { label: "固体酸触媒", keyword: "固体酸触媒" },
                      { label: "担持金属触媒", keyword: "担持金属触媒" }
                    ],
                  },
                  {
                    label: "均一・光触媒",
                    children: [
                      { label: "均一触媒", keyword: "均一触媒" },
                      { label: "光触媒", keyword: "光触媒" },
                      { label: "環境触媒", keyword: "環境触媒" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "分析化学",
        children: [
          {
            label: "分離・機器分析",
            children: [
              {
                label: "分離分析法",
                children: [
                  {
                    label: "分離分析技術",
                    children: [
                      { label: "クロマトグラフィー", keyword: "クロマトグラフィー" },
                      { label: "キャピラリー電気泳動", keyword: "キャピラリー電気泳動" },
                      { label: "液体クロマトグラフィー", keyword: "液体クロマトグラフィー" }
                    ],
                  },
                  {
                    label: "分析基礎・表面分析",
                    children: [
                      { label: "表面分析", keyword: "表面分析" },
                      { label: "電気化学分析", keyword: "電気化学分析" },
                      { label: "微量分析", keyword: "微量分析" }
                    ],
                  }
                ],
              },
              {
                label: "機器分析法",
                children: [
                  {
                    label: "質量・分光分析",
                    children: [
                      { label: "質量分析法", keyword: "質量分析法" },
                      { label: "質量分析", keyword: "質量分析" },
                      { label: "分光分析", keyword: "分光分析" }
                    ],
                  },
                  {
                    label: "X線・元素分析",
                    children: [
                      { label: "X線分析", keyword: "X線分析" },
                      { label: "元素分析", keyword: "元素分析" },
                      { label: "放射光分析", keyword: "放射光分析" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "化学センシング",
            children: [
              {
                label: "センサー化学",
                children: [
                  {
                    label: "化学・バイオセンサー",
                    children: [
                      { label: "化学センサー", keyword: "化学センサー" },
                      { label: "バイオセンサー化学", keyword: "バイオセンサー化学" },
                      { label: "ガスセンサー", keyword: "ガスセンサー" }
                    ],
                  },
                  {
                    label: "蛍光・光学プローブ",
                    children: [
                      { label: "蛍光プローブ", keyword: "蛍光プローブ" },
                      { label: "イメージングプローブ", keyword: "イメージングプローブ" },
                      { label: "分子プローブ", keyword: "分子プローブ" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "イメージング分析",
            children: [
              {
                label: "分析イメージング",
                children: [
                  {
                    label: "顕微・イメージング分析",
                    children: [
                      { label: "イメージング質量分析", keyword: "イメージング質量分析" },
                      { label: "ラマンイメージング", keyword: "ラマンイメージング" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "高分子化学",
        children: [
          {
            label: "高分子合成化学",
            children: [
              {
                label: "重合化学",
                children: [
                  {
                    label: "連鎖・リビング重合",
                    children: [
                      { label: "高分子合成", keyword: "高分子合成" },
                      { label: "リビング重合", keyword: "リビング重合" },
                      { label: "精密重合", keyword: "精密重合" }
                    ],
                  },
                  {
                    label: "開環・重縮合",
                    children: [
                      { label: "開環重合", keyword: "開環重合" },
                      { label: "ポリマー", keyword: "ポリマー" },
                      { label: "重縮合", keyword: "重縮合" }
                    ],
                  }
                ],
              },
              {
                label: "高分子設計",
                children: [
                  {
                    label: "精密高分子設計",
                    children: [
                      { label: "ブロック共重合体", keyword: "ブロック共重合体" },
                      { label: "高分子構造制御", keyword: "高分子構造制御" },
                      { label: "配位重合", keyword: "配位重合" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "高分子物性・機能",
            children: [
              {
                label: "機能性高分子分野",
                children: [
                  {
                    label: "機能性高分子材料",
                    children: [
                      { label: "機能性高分子", keyword: "機能性高分子" },
                      { label: "導電性高分子", keyword: "導電性高分子" },
                      { label: "高分子ゲル", keyword: "高分子ゲル" }
                    ],
                  },
                  {
                    label: "高分子物性・環境対応",
                    children: [
                      { label: "生分解性高分子", keyword: "生分解性高分子" },
                      { label: "高分子", keyword: "高分子" },
                      { label: "高分子物性", keyword: "高分子物性" }
                    ],
                  }
                ],
              },
              {
                label: "先端高分子材料",
                children: [
                  {
                    label: "高分子材料応用",
                    children: [
                      { label: "高分子薄膜", keyword: "高分子薄膜" },
                      { label: "刺激応答性高分子", keyword: "刺激応答性高分子" },
                      { label: "バイオマテリアル高分子", keyword: "バイオマテリアル高分子" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "ナノ・グリーン化学",
        children: [
          {
            label: "ナノ化学",
            children: [
              {
                label: "ナノ材料化学",
                children: [
                  {
                    label: "ナノ材料・粒子",
                    children: [
                      { label: "ナノ材料", keyword: "ナノ材料" },
                      { label: "ナノ粒子", keyword: "ナノ粒子" },
                      { label: "ナノ粒子合成", keyword: "ナノ粒子合成" }
                    ],
                  },
                  {
                    label: "自己組織化・ナノ構造",
                    children: [
                      { label: "自己組織化", keyword: "自己組織化" },
                      { label: "ナノテクノロジー", keyword: "ナノテクノロジー" },
                      { label: "ナノ構造制御", keyword: "ナノ構造制御" }
                    ],
                  }
                ],
              },
              {
                label: "ナノ機能材料",
                children: [
                  {
                    label: "ナノ機能・カーボン材料",
                    children: [
                      { label: "カーボンナノチューブ", keyword: "カーボンナノチューブ" },
                      { label: "量子ドット", keyword: "量子ドット" },
                      { label: "グラフェン", keyword: "グラフェン" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "グリーン・環境化学",
            children: [
              {
                label: "持続可能化学",
                children: [
                  {
                    label: "グリーン化学プロセス",
                    children: [
                      { label: "グリーンケミストリー", keyword: "グリーンケミストリー" },
                      { label: "環境化学", keyword: "環境化学" }
                    ],
                  },
                  {
                    label: "炭素資源変換",
                    children: [
                      { label: "CO2変換", keyword: "CO2変換" },
                      { label: "人工光合成", keyword: "人工光合成" },
                      { label: "バイオマス変換", keyword: "バイオマス変換" }
                    ],
                  }
                ],
              },
              {
                label: "資源・エネルギー化学",
                children: [
                  {
                    label: "触媒的資源変換",
                    children: [
                      { label: "水素製造", keyword: "水素製造" },
                      { label: "バイオリファイナリー", keyword: "バイオリファイナリー" },
                      { label: "光触媒的水分解", keyword: "光触媒的水分解" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "構造化学・結晶学",
        children: [
          {
            label: "構造解析",
            children: [
              {
                label: "構造化学分野",
                children: [
                  {
                    label: "回折構造解析",
                    children: [
                      { label: "構造化学", keyword: "構造化学" },
                      { label: "X線結晶構造", keyword: "X線結晶構造" },
                      { label: "中性子回折", keyword: "中性子回折" }
                    ],
                  },
                  {
                    label: "生体高分子構造解析",
                    children: [
                      { label: "構造生物学", keyword: "構造生物学" },
                      { label: "クライオ電顕", keyword: "クライオ電顕" },
                      { label: "NMR", keyword: "NMR" }
                    ],
                  }
                ],
              },
              {
                label: "結晶工学",
                children: [
                  {
                    label: "結晶成長・結晶工学",
                    children: [
                      { label: "結晶成長", keyword: "結晶成長" },
                      { label: "分子結晶", keyword: "分子結晶" },
                      { label: "結晶構造予測", keyword: "結晶構造予測" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "生化学・生体機能化学",
        children: [
          {
            label: "生体分子化学",
            children: [
              {
                label: "生化学分野",
                children: [
                  {
                    label: "酵素・タンパク質化学",
                    children: [
                      { label: "生化学", keyword: "生化学" },
                      { label: "酵素", keyword: "酵素" },
                      { label: "タンパク質工学", keyword: "タンパク質工学" }
                    ],
                  },
                  {
                    label: "代謝・生体触媒",
                    children: [
                      { label: "代謝", keyword: "代謝" },
                      { label: "代謝工学", keyword: "代謝工学" },
                      { label: "生体触媒", keyword: "生体触媒" }
                    ],
                  }
                ],
              },
              {
                label: "生体機能化学",
                children: [
                  {
                    label: "生体分子機能化学",
                    children: [
                      { label: "脂質生化学", keyword: "脂質生化学" },
                      { label: "糖化学", keyword: "糖化学" },
                      { label: "生体膜化学", keyword: "生体膜化学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "化学・その他",
        children: [
          { label: "分析化学", keyword: "分析化学" }
        ],
      }
    ],
  },
  {
    label: "生物学",
    fieldCodes: ["11", "13", "24", "28", "30"],
    children: [
      {
        label: "分子生物学",
        children: [
          {
            label: "遺伝子発現制御",
            children: [
              {
                label: "転写・エピジェネティクス",
                children: [
                  {
                    label: "転写制御機構",
                    children: [
                      { label: "遺伝子発現", keyword: "遺伝子発現" },
                      { label: "転写制御", keyword: "転写制御" },
                      { label: "転写", keyword: "転写" },
                      { label: "遺伝子", keyword: "遺伝子" },
                      { label: "プロモーター", keyword: "プロモーター" },
                      { label: "エンハンサー", keyword: "エンハンサー" }
                    ],
                  },
                  {
                    label: "エピジェネティック制御",
                    children: [
                      { label: "エピジェネティクス", keyword: "エピジェネティクス" },
                      { label: "クロマチン", keyword: "クロマチン" },
                      { label: "エピゲノム", keyword: "エピゲノム" },
                      { label: "DNAメチル化", keyword: "DNAメチル化" },
                      { label: "ヒストン修飾", keyword: "ヒストン修飾" }
                    ],
                  },
                  {
                    label: "非コードRNA・RNA干渉",
                    children: [
                      { label: "非コードRNA", keyword: "非コードRNA" },
                      { label: "マイクロRNA", keyword: "マイクロRNA" },
                      { label: "RNA干渉", keyword: "RNA干渉" },
                      { label: "長鎖ノンコーディングRNA", keyword: "長鎖ノンコーディングRNA" }
                    ],
                  }
                ],
              },
              {
                label: "RNA生物学分野",
                children: [
                  {
                    label: "RNAプロセシング",
                    children: [
                      { label: "RNA生物学", keyword: "RNA生物学" },
                      { label: "RNAスプライシング", keyword: "RNAスプライシング" },
                      { label: "RNA", keyword: "RNA" }
                    ],
                  },
                  {
                    label: "翻訳・RNA代謝",
                    children: [
                      { label: "翻訳制御", keyword: "翻訳制御" },
                      { label: "翻訳", keyword: "翻訳" },
                      { label: "リボソーム", keyword: "リボソーム" },
                      { label: "mRNA", keyword: "mRNA" },
                      { label: "リボソームプロファイリング", keyword: "リボソームプロファイリング" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "ゲノム機能",
            children: [
              {
                label: "ゲノム科学",
                children: [
                  {
                    label: "ゲノム構造・編集",
                    children: [
                      { label: "ゲノム", keyword: "ゲノム" },
                      { label: "ゲノム編集", keyword: "ゲノム編集" },
                      { label: "DNA", keyword: "DNA" },
                      { label: "CRISPR", keyword: "CRISPR" }
                    ],
                  },
                  {
                    label: "DNA複製・修復",
                    children: [
                      { label: "DNA複製", keyword: "DNA複製" },
                      { label: "DNA修復", keyword: "DNA修復" },
                      { label: "染色体", keyword: "染色体" },
                      { label: "ゲノム不安定性", keyword: "ゲノム不安定性" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "細胞生物学・細胞動態",
        children: [
          {
            label: "細胞構造・動態",
            children: [
              {
                label: "細胞骨格・オルガネラ",
                children: [
                  {
                    label: "細胞骨格・輸送",
                    children: [
                      { label: "細胞生物学", keyword: "細胞生物学" },
                      { label: "細胞骨格", keyword: "細胞骨格" },
                      { label: "細胞内輸送", keyword: "細胞内輸送" },
                      { label: "細胞", keyword: "細胞" },
                      { label: "モータータンパク質", keyword: "モータータンパク質" }
                    ],
                  },
                  {
                    label: "オルガネラ・オートファジー",
                    children: [
                      { label: "オルガネラ", keyword: "オルガネラ" },
                      { label: "オートファジー", keyword: "オートファジー" },
                      { label: "ミトコンドリア", keyword: "ミトコンドリア" },
                      { label: "小胞体", keyword: "小胞体" },
                      { label: "リソソーム", keyword: "リソソーム" },
                      { label: "ゴルジ体", keyword: "ゴルジ体" },
                      { label: "細胞核", keyword: "細胞核" }
                    ],
                  },
                  {
                    label: "細胞接着・細胞外環境",
                    children: [
                      { label: "細胞接着", keyword: "細胞接着" },
                      { label: "細胞外マトリックス", keyword: "細胞外マトリックス" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "細胞増殖・運命",
            children: [
              {
                label: "細胞周期・細胞死",
                children: [
                  {
                    label: "細胞周期・分裂",
                    children: [
                      { label: "細胞周期", keyword: "細胞周期" },
                      { label: "細胞分化", keyword: "細胞分化" },
                      { label: "細胞分裂", keyword: "細胞分裂" }
                    ],
                  },
                  {
                    label: "細胞死・アポトーシス",
                    children: [
                      { label: "細胞死", keyword: "細胞死" },
                      { label: "アポトーシス", keyword: "アポトーシス" },
                      { label: "ネクローシス", keyword: "ネクローシス" }
                    ],
                  }
                ],
              },
              {
                label: "シグナル伝達・受容体",
                children: [
                  {
                    label: "シグナル伝達経路",
                    children: [
                      { label: "細胞シグナル伝達", keyword: "細胞シグナル伝達" },
                      { label: "シグナル伝達", keyword: "シグナル伝達" },
                      { label: "受容体", keyword: "受容体" }
                    ],
                  },
                  {
                    label: "キナーゼ・リン酸化",
                    children: [
                      { label: "キナーゼ", keyword: "キナーゼ" },
                      { label: "リン酸化", keyword: "リン酸化" },
                      { label: "Gタンパク質共役受容体", keyword: "Gタンパク質共役受容体" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "生化学・構造生物学",
        children: [
          {
            label: "タンパク質・構造科学",
            children: [
              {
                label: "タンパク質・酵素",
                children: [
                  {
                    label: "タンパク質・酵素学",
                    children: [
                      { label: "生化学", keyword: "生化学" },
                      { label: "タンパク質科学", keyword: "タンパク質科学" },
                      { label: "酵素学", keyword: "酵素学" },
                      { label: "タンパク質", keyword: "タンパク質" },
                      { label: "酵素反応", keyword: "酵素反応" }
                    ],
                  },
                  {
                    label: "タンパク質構造・機能",
                    children: [
                      { label: "タンパク質構造", keyword: "タンパク質構造" },
                      { label: "タンパク質フォールディング", keyword: "タンパク質フォールディング" }
                    ],
                  }
                ],
              },
              {
                label: "構造生物学分野",
                children: [
                  {
                    label: "構造解析法",
                    children: [
                      { label: "構造生物学", keyword: "構造生物学" },
                      { label: "クライオ電子顕微鏡", keyword: "クライオ電子顕微鏡" },
                      { label: "構造解析", keyword: "構造解析" }
                    ],
                  },
                  {
                    label: "分子間相互作用",
                    children: [
                      { label: "タンパク質間相互作用", keyword: "タンパク質間相互作用" },
                      { label: "生体分子構造", keyword: "生体分子構造" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "代謝生化学",
            children: [
              {
                label: "代謝科学",
                children: [
                  {
                    label: "代謝・エネルギー",
                    children: [
                      { label: "代謝", keyword: "代謝" },
                      { label: "エネルギー代謝", keyword: "エネルギー代謝" },
                      { label: "メタボロミクス", keyword: "メタボロミクス" },
                      { label: "解糖系", keyword: "解糖系" },
                      { label: "TCA回路", keyword: "TCA回路" }
                    ],
                  },
                  {
                    label: "生体分子・脂質糖",
                    children: [
                      { label: "脂質", keyword: "脂質" },
                      { label: "糖質", keyword: "糖質" },
                      { label: "生体膜", keyword: "生体膜" },
                      { label: "糖鎖", keyword: "糖鎖" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "遺伝学・バイオインフォマティクス",
        children: [
          {
            label: "遺伝学・遺伝解析",
            children: [
              {
                label: "遺伝学分野",
                children: [
                  {
                    label: "遺伝・変異解析",
                    children: [
                      { label: "遺伝学", keyword: "遺伝学" },
                      { label: "分子遺伝学", keyword: "分子遺伝学" },
                      { label: "突然変異", keyword: "突然変異" },
                      { label: "遺伝子多型", keyword: "遺伝子多型" }
                    ],
                  },
                  {
                    label: "集団・進化遺伝",
                    children: [
                      { label: "集団遺伝学", keyword: "集団遺伝学" },
                      { label: "QTL解析", keyword: "QTL解析" },
                      { label: "GWAS", keyword: "GWAS" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "オミクス・計算生物学",
            children: [
              {
                label: "バイオインフォマティクス分野",
                children: [
                  {
                    label: "配列・ゲノム解析",
                    children: [
                      { label: "バイオインフォマティクス", keyword: "バイオインフォマティクス" },
                      { label: "ゲノミクス", keyword: "ゲノミクス" },
                      { label: "配列解析", keyword: "配列解析" }
                    ],
                  },
                  {
                    label: "システム・シングルセル",
                    children: [
                      { label: "システム生物学", keyword: "システム生物学" },
                      { label: "シングルセル解析", keyword: "シングルセル解析" },
                      { label: "シングルセル", keyword: "シングルセル" },
                      { label: "トランスクリプトミクス", keyword: "トランスクリプトミクス" }
                    ],
                  }
                ],
              },
              {
                label: "オミクス計測",
                children: [
                  {
                    label: "多層オミクス",
                    children: [
                      { label: "オミクス", keyword: "オミクス" },
                      { label: "プロテオミクス", keyword: "プロテオミクス" },
                      { label: "リピドミクス", keyword: "リピドミクス" }
                    ],
                  }
                ],
              },
              {
                label: "バイオイメージング",
                children: [
                  {
                    label: "顕微鏡技術",
                    children: [
                      { label: "顕微鏡", keyword: "顕微鏡" },
                      { label: "蛍光", keyword: "蛍光" },
                      { label: "蛍光顕微鏡", keyword: "蛍光顕微鏡" }
                    ],
                  },
                  {
                    label: "生体イメージング",
                    children: [
                      { label: "イメージング", keyword: "イメージング" },
                      { label: "ライブイメージング", keyword: "ライブイメージング" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "発生・幹細胞生物学",
        children: [
          {
            label: "発生・器官形成",
            children: [
              {
                label: "発生・形態形成",
                children: [
                  {
                    label: "初期発生・パターン形成",
                    children: [
                      { label: "発生生物学", keyword: "発生生物学" },
                      { label: "発生", keyword: "発生" },
                      { label: "胚", keyword: "胚" },
                      { label: "パターン形成", keyword: "パターン形成" }
                    ],
                  },
                  {
                    label: "形態形成・器官形成",
                    children: [
                      { label: "形態形成", keyword: "形態形成" },
                      { label: "器官形成", keyword: "器官形成" },
                      { label: "オルガノイド", keyword: "オルガノイド" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "幹細胞・再生",
            children: [
              {
                label: "幹細胞生物学",
                children: [
                  {
                    label: "多能性幹細胞",
                    children: [
                      { label: "幹細胞", keyword: "幹細胞" },
                      { label: "iPS細胞", keyword: "iPS細胞" },
                      { label: "iPS", keyword: "iPS" },
                      { label: "ES細胞", keyword: "ES細胞" }
                    ],
                  },
                  {
                    label: "組織幹細胞・再生医療",
                    children: [
                      { label: "組織幹細胞", keyword: "組織幹細胞" },
                      { label: "再生医学", keyword: "再生医学" },
                      { label: "再生", keyword: "再生" },
                      { label: "細胞移植", keyword: "細胞移植" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "モデル生物",
            children: [
              {
                label: "モデル動物",
                children: [
                  {
                    label: "脊椎モデル動物",
                    children: [
                      { label: "マウス", keyword: "マウス" },
                      { label: "ゼブラフィッシュ", keyword: "ゼブラフィッシュ" },
                      { label: "ラット", keyword: "ラット" }
                    ],
                  },
                  {
                    label: "無脊椎モデル動物",
                    children: [
                      { label: "ショウジョウバエ", keyword: "ショウジョウバエ" },
                      { label: "線虫", keyword: "線虫" },
                      { label: "アフリカツメガエル", keyword: "アフリカツメガエル" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "神経科学・脳科学",
        children: [
          {
            label: "分子・細胞神経科学",
            children: [
              {
                label: "神経細胞・シナプス",
                children: [
                  {
                    label: "シナプス・可塑性",
                    children: [
                      { label: "神経科学", keyword: "神経科学" },
                      { label: "シナプス", keyword: "シナプス" },
                      { label: "神経可塑性", keyword: "神経可塑性" },
                      { label: "神経伝達物質", keyword: "神経伝達物質" },
                      { label: "イオンチャネル", keyword: "イオンチャネル" },
                      { label: "長期増強", keyword: "長期増強" }
                    ],
                  },
                  {
                    label: "神経発生・分化",
                    children: [
                      { label: "神経発生", keyword: "神経発生" },
                      { label: "神経細胞", keyword: "神経細胞" },
                      { label: "グリア細胞", keyword: "グリア細胞" },
                      { label: "軸索", keyword: "軸索" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "システム・計算神経科学",
            children: [
              {
                label: "神経回路・脳",
                children: [
                  {
                    label: "神経回路・脳機能",
                    children: [
                      { label: "神経回路", keyword: "神経回路" },
                      { label: "脳機能イメージング", keyword: "脳機能イメージング" },
                      { label: "神経", keyword: "神経" },
                      { label: "脳", keyword: "脳" },
                      { label: "コネクトーム", keyword: "コネクトーム" }
                    ],
                  },
                  {
                    label: "計算・行動神経科学",
                    children: [
                      { label: "計算神経科学", keyword: "計算神経科学" },
                      { label: "行動神経科学", keyword: "行動神経科学" },
                      { label: "神経活動計測", keyword: "神経活動計測" }
                    ],
                  }
                ],
              },
              {
                label: "認知・行動科学",
                children: [
                  {
                    label: "学習・記憶",
                    children: [
                      { label: "学習", keyword: "学習" },
                      { label: "記憶", keyword: "記憶" },
                      { label: "認知", keyword: "認知" }
                    ],
                  },
                  {
                    label: "行動・情動",
                    children: [
                      { label: "行動", keyword: "行動" },
                      { label: "情動", keyword: "情動" },
                      { label: "意思決定", keyword: "意思決定" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "免疫・微生物学",
        children: [
          {
            label: "免疫生物学",
            children: [
              {
                label: "免疫応答",
                children: [
                  {
                    label: "自然・獲得免疫",
                    children: [
                      { label: "免疫学", keyword: "免疫学" },
                      { label: "自然免疫", keyword: "自然免疫" },
                      { label: "獲得免疫", keyword: "獲得免疫" },
                      { label: "免疫", keyword: "免疫" },
                      { label: "免疫記憶", keyword: "免疫記憶" }
                    ],
                  },
                  {
                    label: "炎症・免疫細胞",
                    children: [
                      { label: "炎症", keyword: "炎症" },
                      { label: "抗体", keyword: "抗体" },
                      { label: "T細胞", keyword: "T細胞" },
                      { label: "サイトカイン", keyword: "サイトカイン" },
                      { label: "抗原提示", keyword: "抗原提示" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "微生物・ウイルス学",
            children: [
              {
                label: "細菌・ウイルス",
                children: [
                  {
                    label: "細菌・微生物",
                    children: [
                      { label: "微生物学", keyword: "微生物学" },
                      { label: "細菌学", keyword: "細菌学" },
                      { label: "微生物", keyword: "微生物" },
                      { label: "細菌", keyword: "細菌" },
                      { label: "酵母", keyword: "酵母" },
                      { label: "大腸菌", keyword: "大腸菌" }
                    ],
                  },
                  {
                    label: "ウイルス・微生物叢",
                    children: [
                      { label: "ウイルス学", keyword: "ウイルス学" },
                      { label: "微生物叢", keyword: "微生物叢" },
                      { label: "ウイルス", keyword: "ウイルス" },
                      { label: "腸内細菌叢", keyword: "腸内細菌叢" },
                      { label: "バクテリオファージ", keyword: "バクテリオファージ" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "生理・植物・進化生態",
        children: [
          {
            label: "生理学・植物科学",
            children: [
              {
                label: "生理学分野",
                children: [
                  {
                    label: "器官生理・内分泌",
                    children: [
                      { label: "生理学", keyword: "生理学" },
                      { label: "内分泌学", keyword: "内分泌学" },
                      { label: "ホルモン", keyword: "ホルモン" },
                      { label: "概日リズム", keyword: "概日リズム" },
                      { label: "ステロイドホルモン", keyword: "ステロイドホルモン" }
                    ],
                  }
                ],
              },
              {
                label: "植物科学分野",
                children: [
                  {
                    label: "植物生理・光合成",
                    children: [
                      { label: "植物科学", keyword: "植物科学" },
                      { label: "植物生理学", keyword: "植物生理学" },
                      { label: "光合成", keyword: "光合成" },
                      { label: "植物", keyword: "植物" },
                      { label: "気孔", keyword: "気孔" }
                    ],
                  },
                  {
                    label: "植物遺伝・モデル植物",
                    children: [
                      { label: "シロイヌナズナ", keyword: "シロイヌナズナ" },
                      { label: "植物ホルモン", keyword: "植物ホルモン" },
                      { label: "植物免疫", keyword: "植物免疫" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "進化・生態学",
            children: [
              {
                label: "進化生物学分野",
                children: [
                  {
                    label: "進化・系統",
                    children: [
                      { label: "進化生物学", keyword: "進化生物学" },
                      { label: "分子進化", keyword: "分子進化" },
                      { label: "進化", keyword: "進化" },
                      { label: "系統", keyword: "系統" },
                      { label: "適応進化", keyword: "適応進化" },
                      { label: "分子系統学", keyword: "分子系統学" },
                      { label: "種分化", keyword: "種分化" }
                    ],
                  }
                ],
              },
              {
                label: "生態学分野",
                children: [
                  {
                    label: "群集・行動生態",
                    children: [
                      { label: "生態学", keyword: "生態学" },
                      { label: "行動生態学", keyword: "行動生態学" },
                      { label: "群集生態学", keyword: "群集生態学" },
                      { label: "生態", keyword: "生態" },
                      { label: "群集生態", keyword: "群集生態" },
                      { label: "種間相互作用", keyword: "種間相互作用" }
                    ],
                  },
                  {
                    label: "個体群・保全",
                    children: [
                      { label: "個体群", keyword: "個体群" },
                      { label: "個体群動態", keyword: "個体群動態" },
                      { label: "保全生物学", keyword: "保全生物学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "薬理・創薬科学",
        children: [
          {
            label: "薬理学・創薬",
            children: [
              {
                label: "薬理・薬物動態",
                children: [
                  {
                    label: "薬理・薬物動態学",
                    children: [
                      { label: "薬理学", keyword: "薬理学" },
                      { label: "薬物動態", keyword: "薬物動態" },
                      { label: "薬理作用", keyword: "薬理作用" },
                      { label: "薬物代謝", keyword: "薬物代謝" }
                    ],
                  },
                  {
                    label: "創薬・分子標的",
                    children: [
                      { label: "創薬科学", keyword: "創薬科学" },
                      { label: "分子標的薬", keyword: "分子標的薬" },
                      { label: "受容体薬理", keyword: "受容体薬理" },
                      { label: "抗体医薬", keyword: "抗体医薬" },
                      { label: "毒性学", keyword: "毒性学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      }
    ],
  },
  {
    label: "医学・健康科学",
    fieldCodes: ["27", "29", "35", "36"],
    children: [
      {
        label: "基礎医学",
        children: [
          {
            label: "形態・機能医学",
            children: [
              {
                label: "解剖・組織学",
                children: [
                  {
                    label: "解剖・発生",
                    children: [
                      { label: "解剖学", keyword: "解剖学" },
                      { label: "発生学（医学）", keyword: "発生学（医学）" },
                      { label: "組織学", keyword: "組織学" }
                    ],
                  },
                  {
                    label: "神経・機能形態",
                    children: [
                      { label: "神経解剖学", keyword: "神経解剖学" },
                      { label: "機能形態学", keyword: "機能形態学" }
                    ],
                  }
                ],
              },
              {
                label: "生理・生化学",
                children: [
                  {
                    label: "生理学系",
                    children: [
                      { label: "生理学（医学）", keyword: "生理学（医学）" },
                      { label: "統合生理学", keyword: "統合生理学" },
                      { label: "分子生理学", keyword: "分子生理学" }
                    ],
                  },
                  {
                    label: "医化学系",
                    children: [
                      { label: "医化学", keyword: "医化学" },
                      { label: "代謝生化学", keyword: "代謝生化学" }
                    ],
                  }
                ],
              },
              {
                label: "病理・法医学",
                children: [
                  {
                    label: "病理診断・実験病理",
                    children: [
                      { label: "病理学", keyword: "病理学" },
                      { label: "実験病理学", keyword: "実験病理学" },
                      { label: "分子病態学", keyword: "分子病態学" }
                    ],
                  },
                  {
                    label: "法医・鑑識",
                    children: [
                      { label: "法医学", keyword: "法医学" },
                      { label: "法中毒学", keyword: "法中毒学" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "感染防御・免疫基礎",
            children: [
              {
                label: "医科学基盤",
                children: [
                  {
                    label: "医科学一般",
                    children: [
                      { label: "医科学", keyword: "医科学" },
                      { label: "分子医学", keyword: "分子医学" }
                    ],
                  }
                ],
              },
              {
                label: "免疫・微生物学",
                children: [
                  {
                    label: "免疫学系",
                    children: [
                      { label: "医学免疫学", keyword: "医学免疫学" },
                      { label: "自然免疫学", keyword: "自然免疫学" },
                      { label: "粘膜免疫学", keyword: "粘膜免疫学" }
                    ],
                  },
                  {
                    label: "病原微生物学",
                    children: [
                      { label: "医学微生物学", keyword: "医学微生物学" },
                      { label: "ウイルス学", keyword: "ウイルス学" },
                      { label: "細菌学", keyword: "細菌学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "内科系医学",
        children: [
          {
            label: "循環・呼吸・消化器内科",
            children: [
              {
                label: "循環器内科",
                children: [
                  {
                    label: "循環器診療",
                    children: [
                      { label: "循環器内科学", keyword: "循環器内科学" },
                      { label: "心臓", keyword: "心臓" },
                      { label: "血管", keyword: "血管" },
                      { label: "高血圧", keyword: "高血圧" },
                      { label: "動脈硬化", keyword: "動脈硬化" },
                      { label: "不整脈学", keyword: "不整脈学" },
                      { label: "心不全", keyword: "心不全" }
                    ],
                  }
                ],
              },
              {
                label: "呼吸器内科",
                children: [
                  {
                    label: "呼吸器診療",
                    children: [
                      { label: "呼吸器内科学", keyword: "呼吸器内科学" },
                      { label: "肺", keyword: "肺" },
                      { label: "呼吸器", keyword: "呼吸器" },
                      { label: "喘息", keyword: "喘息" },
                      { label: "慢性閉塞性肺疾患", keyword: "慢性閉塞性肺疾患" }
                    ],
                  }
                ],
              },
              {
                label: "消化器・肝臓内科",
                children: [
                  {
                    label: "消化管・肝臓",
                    children: [
                      { label: "消化器内科学", keyword: "消化器内科学" },
                      { label: "肝臓病学", keyword: "肝臓病学" },
                      { label: "炎症性腸疾患", keyword: "炎症性腸疾患" },
                      { label: "消化管出血", keyword: "消化管出血" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "代謝・腎・血液内科",
            children: [
              {
                label: "内分泌・代謝内科",
                children: [
                  {
                    label: "代謝・内分泌疾患",
                    children: [
                      { label: "内分泌代謝内科学", keyword: "内分泌代謝内科学" },
                      { label: "糖尿病学", keyword: "糖尿病学" },
                      { label: "糖尿病", keyword: "糖尿病" },
                      { label: "肥満", keyword: "肥満" },
                      { label: "脂質代謝", keyword: "脂質代謝" },
                      { label: "甲状腺疾患", keyword: "甲状腺疾患" }
                    ],
                  }
                ],
              },
              {
                label: "腎臓・血液・膠原病内科",
                children: [
                  {
                    label: "腎臓・透析",
                    children: [
                      { label: "腎臓内科学", keyword: "腎臓内科学" },
                      { label: "慢性腎臓病", keyword: "慢性腎臓病" },
                      { label: "透析療法", keyword: "透析療法" }
                    ],
                  },
                  {
                    label: "血液・膠原病",
                    children: [
                      { label: "血液内科学", keyword: "血液内科学" },
                      { label: "膠原病内科学", keyword: "膠原病内科学" },
                      { label: "白血病", keyword: "白血病" },
                      { label: "関節リウマチ", keyword: "関節リウマチ" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "外科系医学",
        children: [
          {
            label: "一般・臓器外科",
            children: [
              {
                label: "消化器・心臓・呼吸器外科",
                children: [
                  {
                    label: "消化器外科系",
                    children: [
                      { label: "消化器外科学", keyword: "消化器外科学" },
                      { label: "肝胆膵外科学", keyword: "肝胆膵外科学" },
                      { label: "移植外科学", keyword: "移植外科学" }
                    ],
                  },
                  {
                    label: "心臓・呼吸器外科系",
                    children: [
                      { label: "心臓血管外科学", keyword: "心臓血管外科学" },
                      { label: "呼吸器外科学", keyword: "呼吸器外科学" },
                      { label: "小児外科学", keyword: "小児外科学" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "運動器・脳神経外科",
            children: [
              {
                label: "整形・脳神経・形成外科",
                children: [
                  {
                    label: "整形外科系",
                    children: [
                      { label: "整形外科学", keyword: "整形外科学" },
                      { label: "脊椎外科学", keyword: "脊椎外科学" },
                      { label: "手外科学", keyword: "手外科学" }
                    ],
                  },
                  {
                    label: "脳神経・形成外科系",
                    children: [
                      { label: "脳神経外科学", keyword: "脳神経外科学" },
                      { label: "形成外科学", keyword: "形成外科学" },
                      { label: "再建外科学", keyword: "再建外科学" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "周術期・感覚器",
            children: [
              {
                label: "麻酔・救急・集中治療",
                children: [
                  {
                    label: "麻酔・救急系",
                    children: [
                      { label: "麻酔科学", keyword: "麻酔科学" },
                      { label: "救急医学", keyword: "救急医学" },
                      { label: "集中治療医学", keyword: "集中治療医学" },
                      { label: "ペインクリニック", keyword: "ペインクリニック" }
                    ],
                  }
                ],
              },
              {
                label: "感覚器・体表外科",
                children: [
                  {
                    label: "感覚器科系",
                    children: [
                      { label: "眼科学", keyword: "眼科学" },
                      { label: "耳鼻咽喉科学", keyword: "耳鼻咽喉科学" }
                    ],
                  },
                  {
                    label: "皮膚・泌尿器科系",
                    children: [
                      { label: "皮膚科学", keyword: "皮膚科学" },
                      { label: "泌尿器科学", keyword: "泌尿器科学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "腫瘍学",
        children: [
          {
            label: "がん基礎科学",
            children: [
              {
                label: "がん生物学・発がん",
                children: [
                  {
                    label: "がん基礎",
                    children: [
                      { label: "がん", keyword: "がん" },
                      { label: "腫瘍", keyword: "腫瘍" },
                      { label: "発がん", keyword: "発がん" },
                      { label: "がん生物学", keyword: "がん生物学" },
                      { label: "がん遺伝子", keyword: "がん遺伝子" }
                    ],
                  },
                  {
                    label: "がん進展・微小環境",
                    children: [
                      { label: "転移", keyword: "転移" },
                      { label: "腫瘍微小環境", keyword: "腫瘍微小環境" },
                      { label: "がん幹細胞", keyword: "がん幹細胞" },
                      { label: "血管新生", keyword: "血管新生" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "臨床腫瘍学",
            children: [
              {
                label: "がん治療学",
                children: [
                  {
                    label: "薬物・放射線療法",
                    children: [
                      { label: "腫瘍内科学", keyword: "腫瘍内科学" },
                      { label: "放射線腫瘍学", keyword: "放射線腫瘍学" },
                      { label: "がん薬物療法", keyword: "がん薬物療法" }
                    ],
                  },
                  {
                    label: "がん免疫・精密医療",
                    children: [
                      { label: "がん免疫療法", keyword: "がん免疫療法" },
                      { label: "免疫チェックポイント", keyword: "免疫チェックポイント" },
                      { label: "がんゲノム医療", keyword: "がんゲノム医療" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "感染症・公衆衛生",
        children: [
          {
            label: "感染症医学",
            children: [
              {
                label: "臨床感染症学",
                children: [
                  {
                    label: "感染症診療",
                    children: [
                      { label: "感染症学", keyword: "感染症学" },
                      { label: "感染症", keyword: "感染症" },
                      { label: "ウイルス感染", keyword: "ウイルス感染" },
                      { label: "臨床微生物学", keyword: "臨床微生物学" },
                      { label: "院内感染", keyword: "院内感染" }
                    ],
                  },
                  {
                    label: "ワクチン・抗微生物薬",
                    children: [
                      { label: "ワクチン学", keyword: "ワクチン学" },
                      { label: "抗菌薬耐性", keyword: "抗菌薬耐性" },
                      { label: "熱帯感染症", keyword: "熱帯感染症" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "公衆衛生・疫学",
            children: [
              {
                label: "疫学・予防医学",
                children: [
                  {
                    label: "疫学・統計",
                    children: [
                      { label: "疫学", keyword: "疫学" },
                      { label: "医療統計学", keyword: "医療統計学" },
                      { label: "分子疫学", keyword: "分子疫学" }
                    ],
                  },
                  {
                    label: "予防・環境保健",
                    children: [
                      { label: "予防医学", keyword: "予防医学" },
                      { label: "公衆衛生", keyword: "公衆衛生" },
                      { label: "公衆衛生学", keyword: "公衆衛生学" },
                      { label: "環境保健学", keyword: "環境保健学" },
                      { label: "社会医学", keyword: "社会医学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "神経・精神・小児・産科",
        children: [
          {
            label: "神経・精神医学",
            children: [
              {
                label: "臨床神経学",
                children: [
                  {
                    label: "神経疾患",
                    children: [
                      { label: "神経内科学", keyword: "神経内科学" },
                      { label: "神経変性", keyword: "神経変性" },
                      { label: "脳卒中学", keyword: "脳卒中学" },
                      { label: "てんかん学", keyword: "てんかん学" }
                    ],
                  },
                  {
                    label: "認知症・変性疾患",
                    children: [
                      { label: "認知症医学", keyword: "認知症医学" },
                      { label: "アルツハイマー", keyword: "アルツハイマー" },
                      { label: "パーキンソン", keyword: "パーキンソン" }
                    ],
                  }
                ],
              },
              {
                label: "精神科学",
                children: [
                  {
                    label: "精神疾患",
                    children: [
                      { label: "精神医学", keyword: "精神医学" },
                      { label: "統合失調症", keyword: "統合失調症" },
                      { label: "うつ", keyword: "うつ" },
                      { label: "気分障害", keyword: "気分障害" },
                      { label: "児童精神医学", keyword: "児童精神医学" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "母子医学",
            children: [
              {
                label: "産婦人科・小児科",
                children: [
                  {
                    label: "産科・周産期",
                    children: [
                      { label: "産科婦人科学", keyword: "産科婦人科学" },
                      { label: "周産期医学", keyword: "周産期医学" },
                      { label: "生殖医学", keyword: "生殖医学" }
                    ],
                  },
                  {
                    label: "小児医学",
                    children: [
                      { label: "小児科学", keyword: "小児科学" },
                      { label: "新生児医学", keyword: "新生児医学" },
                      { label: "小児発達学", keyword: "小児発達学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "歯学・口腔科学",
        children: [
          {
            label: "口腔科学領域",
            children: [
              {
                label: "口腔臨床科学",
                children: [
                  {
                    label: "口腔外科・保存",
                    children: [
                      { label: "歯科医学", keyword: "歯科医学" },
                      { label: "口腔外科学", keyword: "口腔外科学" },
                      { label: "歯周病学", keyword: "歯周病学" },
                      { label: "保存修復学", keyword: "保存修復学" }
                    ],
                  },
                  {
                    label: "補綴・矯正",
                    children: [
                      { label: "歯科補綴学", keyword: "歯科補綴学" },
                      { label: "歯科矯正学", keyword: "歯科矯正学" },
                      { label: "口腔インプラント学", keyword: "口腔インプラント学" }
                    ],
                  }
                ],
              },
              {
                label: "口腔基礎科学",
                children: [
                  {
                    label: "口腔生物学",
                    children: [
                      { label: "口腔生化学", keyword: "口腔生化学" },
                      { label: "口腔病理学", keyword: "口腔病理学" },
                      { label: "小児歯科学", keyword: "小児歯科学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "看護・リハビリ・健康科学",
        children: [
          {
            label: "看護学領域",
            children: [
              {
                label: "臨床・地域看護学",
                children: [
                  {
                    label: "臨床看護",
                    children: [
                      { label: "看護学", keyword: "看護学" },
                      { label: "がん看護学", keyword: "がん看護学" },
                      { label: "母性看護学", keyword: "母性看護学" },
                      { label: "精神看護学", keyword: "精神看護学" }
                    ],
                  },
                  {
                    label: "地域・在宅看護",
                    children: [
                      { label: "地域看護学", keyword: "地域看護学" },
                      { label: "老年看護学", keyword: "老年看護学" },
                      { label: "在宅看護学", keyword: "在宅看護学" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "リハビリ・健康支援",
            children: [
              {
                label: "リハビリテーション科学",
                children: [
                  {
                    label: "リハビリ医学・療法",
                    children: [
                      { label: "リハビリテーション医学", keyword: "リハビリテーション医学" },
                      { label: "理学療法学", keyword: "理学療法学" },
                      { label: "作業療法学", keyword: "作業療法学" },
                      { label: "言語聴覚療法学", keyword: "言語聴覚療法学" }
                    ],
                  }
                ],
              },
              {
                label: "健康・スポーツ科学",
                children: [
                  {
                    label: "健康支援",
                    children: [
                      { label: "健康科学", keyword: "健康科学" },
                      { label: "スポーツ医学", keyword: "スポーツ医学" },
                      { label: "栄養学", keyword: "栄養学" },
                      { label: "介護福祉学", keyword: "介護福祉学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "薬学・創薬科学",
        children: [
          {
            label: "基礎薬学",
            children: [
              {
                label: "薬理・薬物動態学",
                children: [
                  {
                    label: "薬理学系",
                    children: [
                      { label: "薬理", keyword: "薬理" },
                      { label: "分子薬理学", keyword: "分子薬理学" },
                      { label: "臨床薬理学", keyword: "臨床薬理学" }
                    ],
                  },
                  {
                    label: "薬物動態・製剤",
                    children: [
                      { label: "薬物動態", keyword: "薬物動態" },
                      { label: "薬剤学", keyword: "薬剤学" },
                      { label: "製剤学", keyword: "製剤学" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "創薬・医療薬学",
            children: [
              {
                label: "創薬科学",
                children: [
                  {
                    label: "創薬・薬剤設計",
                    children: [
                      { label: "創薬", keyword: "創薬" },
                      { label: "薬剤設計", keyword: "薬剤設計" },
                      { label: "医薬品化学", keyword: "医薬品化学" },
                      { label: "天然物創薬", keyword: "天然物創薬" }
                    ],
                  }
                ],
              },
              {
                label: "臨床薬学",
                children: [
                  {
                    label: "医療薬学系",
                    children: [
                      { label: "医療薬学", keyword: "医療薬学" },
                      { label: "薬物治療学", keyword: "薬物治療学" },
                      { label: "生薬学", keyword: "生薬学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "医用生体工学",
        children: [
          {
            label: "医療技術・機器",
            children: [
              {
                label: "医用機器・材料",
                children: [
                  {
                    label: "医用機器",
                    children: [
                      { label: "医用工学", keyword: "医用工学" },
                      { label: "医療機器", keyword: "医療機器" },
                      { label: "医用画像工学", keyword: "医用画像工学" },
                      { label: "生体計測工学", keyword: "生体計測工学" }
                    ],
                  },
                  {
                    label: "生体材料・再生",
                    children: [
                      { label: "生体材料", keyword: "生体材料" },
                      { label: "再生医療", keyword: "再生医療" },
                      { label: "組織工学", keyword: "組織工学" }
                    ],
                  }
                ],
              },
              {
                label: "医療情報・イメージング",
                children: [
                  {
                    label: "医療情報学系",
                    children: [
                      { label: "医療情報学", keyword: "医療情報学" },
                      { label: "医用画像診断学", keyword: "医用画像診断学" },
                      { label: "放射線技術学", keyword: "放射線技術学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      }
    ],
  },
  {
    label: "工学",
    fieldCodes: ["15", "21", "22", "25"],
    children: [
      {
        label: "機械工学",
        children: [
          {
            label: "材料・構造力学",
            children: [
              {
                label: "固体力学系",
                children: [
                  {
                    label: "連続体・材料力学",
                    children: [
                      { label: "材料力学", keyword: "材料力学" },
                      { label: "弾性力学", keyword: "弾性力学" },
                      { label: "塑性力学", keyword: "塑性力学" },
                      { label: "連続体力学", keyword: "連続体力学" },
                      { label: "応力解析", keyword: "応力解析" }
                    ],
                  },
                  {
                    label: "構造・計算力学",
                    children: [
                      { label: "構造力学", keyword: "構造力学" },
                      { label: "計算力学", keyword: "計算力学" },
                      { label: "有限要素法", keyword: "有限要素法" },
                      { label: "構造最適化", keyword: "構造最適化" },
                      { label: "マルチスケール解析", keyword: "マルチスケール解析" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "熱・流体工学",
            children: [
              {
                label: "流体工学系",
                children: [
                  {
                    label: "流体力学基礎",
                    children: [
                      { label: "流体力学", keyword: "流体力学" },
                      { label: "流体", keyword: "流体" },
                      { label: "乱流", keyword: "乱流" }
                    ],
                  },
                  {
                    label: "数値・混相流動",
                    children: [
                      { label: "数値流体力学", keyword: "数値流体力学" },
                      { label: "混相流", keyword: "混相流" },
                      { label: "空気力学", keyword: "空気力学" },
                      { label: "キャビテーション", keyword: "キャビテーション" }
                    ],
                  }
                ],
              },
              {
                label: "熱工学系",
                children: [
                  {
                    label: "熱・伝熱工学",
                    children: [
                      { label: "熱工学", keyword: "熱工学" },
                      { label: "伝熱工学", keyword: "伝熱工学" },
                      { label: "熱交換", keyword: "熱交換" }
                    ],
                  },
                  {
                    label: "燃焼・機関",
                    children: [
                      { label: "燃焼工学", keyword: "燃焼工学" },
                      { label: "内燃機関", keyword: "内燃機関" },
                      { label: "噴霧燃焼", keyword: "噴霧燃焼" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "機械力学・設計",
            children: [
              {
                label: "機械ダイナミクス",
                children: [
                  {
                    label: "振動・動力学",
                    children: [
                      { label: "機械力学", keyword: "機械力学" },
                      { label: "振動工学", keyword: "振動工学" },
                      { label: "機械", keyword: "機械" },
                      { label: "回転機械", keyword: "回転機械" }
                    ],
                  },
                  {
                    label: "摩擦・潤滑",
                    children: [
                      { label: "トライボロジー", keyword: "トライボロジー" },
                      { label: "摩擦摩耗", keyword: "摩擦摩耗" },
                      { label: "潤滑", keyword: "潤滑" },
                      { label: "表面工学", keyword: "表面工学" }
                    ],
                  }
                ],
              },
              {
                label: "設計・生産工学",
                children: [
                  {
                    label: "機械設計論",
                    children: [
                      { label: "機械設計", keyword: "機械設計" },
                      { label: "精密加工", keyword: "精密加工" },
                      { label: "設計工学", keyword: "設計工学" }
                    ],
                  },
                  {
                    label: "生産・加工技術",
                    children: [
                      { label: "生産工学", keyword: "生産工学" },
                      { label: "積層造形", keyword: "積層造形" },
                      { label: "切削加工", keyword: "切削加工" },
                      { label: "金型", keyword: "金型" },
                      { label: "溶接工学", keyword: "溶接工学" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "ロボティクス・自動化",
            children: [
              {
                label: "ロボット・機構",
                children: [
                  {
                    label: "ロボット制御",
                    children: [
                      { label: "ロボット工学", keyword: "ロボット工学" },
                      { label: "ロボット", keyword: "ロボット" },
                      { label: "運動制御", keyword: "運動制御" },
                      { label: "移動ロボット", keyword: "移動ロボット" }
                    ],
                  },
                  {
                    label: "機構・アクチュエータ",
                    children: [
                      { label: "メカトロニクス", keyword: "メカトロニクス" },
                      { label: "アクチュエータ", keyword: "アクチュエータ" },
                      { label: "ヒューマノイド", keyword: "ヒューマノイド" },
                      { label: "ロボティクス", keyword: "ロボティクス" },
                      { label: "マニピュレータ", keyword: "マニピュレータ" },
                      { label: "医療ロボット", keyword: "医療ロボット" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "電気・電子工学",
        children: [
          {
            label: "電気エネルギー工学",
            children: [
              {
                label: "電力・電気機器",
                children: [
                  {
                    label: "電力システム",
                    children: [
                      { label: "電力工学", keyword: "電力工学" },
                      { label: "電力系統", keyword: "電力系統" },
                      { label: "送電", keyword: "送電" },
                      { label: "配電", keyword: "配電" }
                    ],
                  },
                  {
                    label: "電気機器・パワエレ",
                    children: [
                      { label: "電気機器", keyword: "電気機器" },
                      { label: "パワーエレクトロニクス", keyword: "パワーエレクトロニクス" },
                      { label: "モータ", keyword: "モータ" },
                      { label: "インバータ", keyword: "インバータ" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "電子デバイス工学",
            children: [
              {
                label: "半導体デバイス工学",
                children: [
                  {
                    label: "半導体・集積回路",
                    children: [
                      { label: "半導体デバイス", keyword: "半導体デバイス" },
                      { label: "集積回路", keyword: "集積回路" },
                      { label: "半導体", keyword: "半導体" },
                      { label: "パワー半導体", keyword: "パワー半導体" },
                      { label: "化合物半導体", keyword: "化合物半導体" }
                    ],
                  },
                  {
                    label: "マイクロ・光デバイス",
                    children: [
                      { label: "MEMS", keyword: "MEMS" },
                      { label: "光デバイス", keyword: "光デバイス" },
                      { label: "電子工学", keyword: "電子工学" },
                      { label: "光集積回路", keyword: "光集積回路" },
                      { label: "センサデバイス", keyword: "センサデバイス" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "通信・信号工学",
            children: [
              {
                label: "通信システム工学",
                children: [
                  {
                    label: "無線・移動通信",
                    children: [
                      { label: "通信工学", keyword: "通信工学" },
                      { label: "無線通信", keyword: "無線通信" },
                      { label: "通信", keyword: "通信" },
                      { label: "移動通信", keyword: "移動通信" },
                      { label: "5G通信", keyword: "5G通信" }
                    ],
                  },
                  {
                    label: "アンテナ・光通信",
                    children: [
                      { label: "アンテナ工学", keyword: "アンテナ工学" },
                      { label: "光通信工学", keyword: "光通信工学" },
                      { label: "アンテナ", keyword: "アンテナ" },
                      { label: "電波伝搬", keyword: "電波伝搬" }
                    ],
                  }
                ],
              },
              {
                label: "信号処理工学",
                children: [
                  {
                    label: "ディジタル処理",
                    children: [
                      { label: "信号処理", keyword: "信号処理" },
                      { label: "ディジタル信号処理", keyword: "ディジタル信号処理" },
                      { label: "適応信号処理", keyword: "適応信号処理" }
                    ],
                  },
                  {
                    label: "画像・映像処理",
                    children: [
                      { label: "画像処理工学", keyword: "画像処理工学" },
                      { label: "映像処理", keyword: "映像処理" },
                      { label: "パターン認識", keyword: "パターン認識" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "制御・システム工学",
            children: [
              {
                label: "制御理論・応用",
                children: [
                  {
                    label: "制御理論",
                    children: [
                      { label: "制御工学", keyword: "制御工学" },
                      { label: "システム制御", keyword: "システム制御" },
                      { label: "制御", keyword: "制御" },
                      { label: "最適制御", keyword: "最適制御" }
                    ],
                  },
                  {
                    label: "高度制御",
                    children: [
                      { label: "適応制御", keyword: "適応制御" },
                      { label: "非線形制御", keyword: "非線形制御" },
                      { label: "ロバスト制御", keyword: "ロバスト制御" },
                      { label: "モデル予測制御", keyword: "モデル予測制御" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "材料工学",
        children: [
          {
            label: "金属・構造材料",
            children: [
              {
                label: "金属材料工学",
                children: [
                  {
                    label: "金属材料・合金",
                    children: [
                      { label: "金属材料", keyword: "金属材料" },
                      { label: "合金設計", keyword: "合金設計" },
                      { label: "鉄鋼材料", keyword: "鉄鋼材料" },
                      { label: "非鉄金属", keyword: "非鉄金属" }
                    ],
                  },
                  {
                    label: "組織・加工",
                    children: [
                      { label: "材料組織", keyword: "材料組織" },
                      { label: "相変態", keyword: "相変態" },
                      { label: "塑性加工", keyword: "塑性加工" },
                      { label: "熱処理", keyword: "熱処理" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "無機・セラミックス材料",
            children: [
              {
                label: "セラミックス工学",
                children: [
                  {
                    label: "セラミックス・結晶",
                    children: [
                      { label: "セラミックス", keyword: "セラミックス" },
                      { label: "結晶成長", keyword: "結晶成長" },
                      { label: "焼結", keyword: "焼結" }
                    ],
                  },
                  {
                    label: "電子・機能材料",
                    children: [
                      { label: "電子材料", keyword: "電子材料" },
                      { label: "薄膜", keyword: "薄膜" },
                      { label: "誘電体", keyword: "誘電体" },
                      { label: "光学材料", keyword: "光学材料" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "複合・機能材料",
            children: [
              {
                label: "複合材料工学",
                children: [
                  {
                    label: "複合・高分子材料",
                    children: [
                      { label: "複合材料", keyword: "複合材料" },
                      { label: "高分子材料工学", keyword: "高分子材料工学" },
                      { label: "炭素繊維", keyword: "炭素繊維" }
                    ],
                  },
                  {
                    label: "生体・機能材料",
                    children: [
                      { label: "生体材料工学", keyword: "生体材料工学" },
                      { label: "機能性材料", keyword: "機能性材料" },
                      { label: "ナノ材料工学", keyword: "ナノ材料工学" }
                    ],
                  }
                ],
              },
              {
                label: "材料強度・評価",
                children: [
                  {
                    label: "強度・破壊評価",
                    children: [
                      { label: "材料強度", keyword: "材料強度" },
                      { label: "破壊力学", keyword: "破壊力学" },
                      { label: "疲労強度", keyword: "疲労強度" },
                      { label: "非破壊検査", keyword: "非破壊検査" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "化学・プロセス工学",
        children: [
          {
            label: "プロセス・反応工学",
            children: [
              {
                label: "反応・プロセス工学",
                children: [
                  {
                    label: "反応・触媒工学",
                    children: [
                      { label: "化学工学", keyword: "化学工学" },
                      { label: "反応工学", keyword: "反応工学" },
                      { label: "触媒反応工学", keyword: "触媒反応工学" },
                      { label: "プロセス", keyword: "プロセス" }
                    ],
                  },
                  {
                    label: "プロセスシステム",
                    children: [
                      { label: "プロセスシステム工学", keyword: "プロセスシステム工学" },
                      { label: "プロセス制御", keyword: "プロセス制御" },
                      { label: "化学プラント", keyword: "化学プラント" },
                      { label: "反応装置", keyword: "反応装置" }
                    ],
                  }
                ],
              },
              {
                label: "移動現象・分離工学",
                children: [
                  {
                    label: "移動現象",
                    children: [
                      { label: "移動現象論", keyword: "移動現象論" },
                      { label: "熱物質移動", keyword: "熱物質移動" }
                    ],
                  },
                  {
                    label: "分離・膜工学",
                    children: [
                      { label: "分離工学", keyword: "分離工学" },
                      { label: "膜分離工学", keyword: "膜分離工学" },
                      { label: "蒸留", keyword: "蒸留" },
                      { label: "吸着", keyword: "吸着" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "土木・建築工学",
        children: [
          {
            label: "構造・地盤工学",
            children: [
              {
                label: "構造工学分野",
                children: [
                  {
                    label: "構造・耐震",
                    children: [
                      { label: "構造工学", keyword: "構造工学" },
                      { label: "耐震工学", keyword: "耐震工学" },
                      { label: "コンクリート工学", keyword: "コンクリート工学" }
                    ],
                  },
                  {
                    label: "橋梁・維持管理",
                    children: [
                      { label: "橋梁工学", keyword: "橋梁工学" },
                      { label: "維持管理", keyword: "維持管理" },
                      { label: "鋼構造", keyword: "鋼構造" }
                    ],
                  }
                ],
              },
              {
                label: "地盤・水工学",
                children: [
                  {
                    label: "地盤・土質",
                    children: [
                      { label: "地盤工学", keyword: "地盤工学" },
                      { label: "地盤", keyword: "地盤" },
                      { label: "土質力学", keyword: "土質力学" }
                    ],
                  },
                  {
                    label: "水理・河川",
                    children: [
                      { label: "水工学", keyword: "水工学" },
                      { label: "河川工学", keyword: "河川工学" },
                      { label: "海岸工学", keyword: "海岸工学" },
                      { label: "水文学", keyword: "水文学" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "建築・都市工学",
            children: [
              {
                label: "建築工学分野",
                children: [
                  {
                    label: "建築構造・材料",
                    children: [
                      { label: "建築構造", keyword: "建築構造" },
                      { label: "建築", keyword: "建築" },
                      { label: "耐震設計", keyword: "耐震設計" }
                    ],
                  },
                  {
                    label: "建築環境・計画",
                    children: [
                      { label: "建築環境工学", keyword: "建築環境工学" },
                      { label: "建築計画", keyword: "建築計画" },
                      { label: "建築設備", keyword: "建築設備" },
                      { label: "建築意匠", keyword: "建築意匠" }
                    ],
                  }
                ],
              },
              {
                label: "都市・環境工学",
                children: [
                  {
                    label: "都市・交通計画",
                    children: [
                      { label: "都市計画", keyword: "都市計画" },
                      { label: "交通工学", keyword: "交通工学" },
                      { label: "交通", keyword: "交通" },
                      { label: "土木", keyword: "土木" }
                    ],
                  },
                  {
                    label: "環境・防災",
                    children: [
                      { label: "環境工学", keyword: "環境工学" },
                      { label: "防災工学", keyword: "防災工学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "エネルギー・原子力工学",
        children: [
          {
            label: "エネルギー変換工学",
            children: [
              {
                label: "エネルギーデバイス",
                children: [
                  {
                    label: "電池・蓄電",
                    children: [
                      { label: "エネルギー工学", keyword: "エネルギー工学" },
                      { label: "二次電池工学", keyword: "二次電池工学" },
                      { label: "電池", keyword: "電池" },
                      { label: "太陽電池", keyword: "太陽電池" },
                      { label: "リチウムイオン電池", keyword: "リチウムイオン電池" }
                    ],
                  },
                  {
                    label: "燃料電池・水素",
                    children: [
                      { label: "燃料電池", keyword: "燃料電池" },
                      { label: "水素", keyword: "水素" },
                      { label: "エネルギー", keyword: "エネルギー" },
                      { label: "再生可能エネルギー", keyword: "再生可能エネルギー" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "原子力・放射線工学",
            children: [
              {
                label: "原子力工学分野",
                children: [
                  {
                    label: "原子炉・核工学",
                    children: [
                      { label: "原子力工学", keyword: "原子力工学" },
                      { label: "量子ビーム工学", keyword: "量子ビーム工学" },
                      { label: "核燃料", keyword: "核燃料" }
                    ],
                  },
                  {
                    label: "放射線・計測",
                    children: [
                      { label: "放射線工学", keyword: "放射線工学" },
                      { label: "放射線計測", keyword: "放射線計測" },
                      { label: "放射線遮蔽", keyword: "放射線遮蔽" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "環境保全工学",
            children: [
              {
                label: "水・環境処理",
                children: [
                  {
                    label: "水処理・浄水",
                    children: [
                      { label: "水処理工学", keyword: "水処理工学" },
                      { label: "廃水処理", keyword: "廃水処理" }
                    ],
                  },
                  {
                    label: "環境浄化・廃棄物",
                    children: [
                      { label: "環境浄化工学", keyword: "環境浄化工学" },
                      { label: "廃棄物工学", keyword: "廃棄物工学" },
                      { label: "大気浄化", keyword: "大気浄化" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "航空宇宙・システム工学",
        children: [
          {
            label: "航空宇宙システム",
            children: [
              {
                label: "航空宇宙分野",
                children: [
                  {
                    label: "航空工学",
                    children: [
                      { label: "航空宇宙工学", keyword: "航空宇宙工学" },
                      { label: "航空", keyword: "航空" },
                      { label: "空力設計", keyword: "空力設計" },
                      { label: "飛行力学", keyword: "飛行力学" }
                    ],
                  },
                  {
                    label: "宇宙・推進工学",
                    children: [
                      { label: "推進工学", keyword: "推進工学" },
                      { label: "宇宙構造工学", keyword: "宇宙構造工学" },
                      { label: "宇宙工学", keyword: "宇宙工学" },
                      { label: "ロケット", keyword: "ロケット" },
                      { label: "推進", keyword: "推進" },
                      { label: "人工衛星", keyword: "人工衛星" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "システム・最適化工学",
            children: [
              {
                label: "システム工学分野",
                children: [
                  {
                    label: "システム設計",
                    children: [
                      { label: "システム工学", keyword: "システム工学" },
                      { label: "最適化工学", keyword: "最適化工学" },
                      { label: "システム最適化", keyword: "システム最適化" }
                    ],
                  },
                  {
                    label: "信頼性・安全",
                    children: [
                      { label: "信頼性工学", keyword: "信頼性工学" },
                      { label: "安全工学", keyword: "安全工学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "生体医工学・医療技術",
        children: [
          {
            label: "医用工学",
            children: [
              {
                label: "医療・生体工学",
                children: [
                  {
                    label: "医用計測・画像",
                    children: [
                      { label: "生体医工学", keyword: "生体医工学" },
                      { label: "医用画像工学", keyword: "医用画像工学" },
                      { label: "生体計測工学", keyword: "生体計測工学" },
                      { label: "医用センサ", keyword: "医用センサ" },
                      { label: "医療情報", keyword: "医療情報" }
                    ],
                  },
                  {
                    label: "生体材料・リハビリ",
                    children: [
                      { label: "リハビリテーション工学", keyword: "リハビリテーション工学" },
                      { label: "人工臓器", keyword: "人工臓器" },
                      { label: "福祉工学", keyword: "福祉工学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      }
    ],
  },
  {
    label: "情報工学",
    fieldCodes: ["17", "18"],
    children: [
      {
        label: "計算機科学",
        children: [
          {
            label: "理論計算機科学",
            children: [
              {
                label: "アルゴリズム理論",
                children: [
                  {
                    label: "アルゴリズム設計・解析",
                    children: [
                      { label: "アルゴリズム", keyword: "アルゴリズム" },
                      { label: "離散アルゴリズム", keyword: "離散アルゴリズム" },
                      { label: "近似アルゴリズム", keyword: "近似アルゴリズム" },
                      { label: "グラフアルゴリズム", keyword: "グラフアルゴリズム" },
                      { label: "計算幾何学", keyword: "計算幾何学" }
                    ],
                  },
                  {
                    label: "計算量理論",
                    children: [
                      { label: "計算複雑性理論", keyword: "計算複雑性理論" },
                      { label: "計算量", keyword: "計算量" },
                      { label: "量子計算", keyword: "量子計算" },
                      { label: "計算可能性", keyword: "計算可能性" }
                    ],
                  }
                ],
              },
              {
                label: "オートマトン・形式言語理論",
                children: [
                  {
                    label: "計算モデル",
                    children: [
                      { label: "オートマトン理論", keyword: "オートマトン理論" },
                      { label: "形式言語", keyword: "形式言語" },
                      { label: "計算理論", keyword: "計算理論" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "計算機システム",
            children: [
              {
                label: "システムソフトウェア",
                children: [
                  {
                    label: "OS・計算機アーキテクチャ",
                    children: [
                      { label: "計算機アーキテクチャ", keyword: "計算機アーキテクチャ" },
                      { label: "オペレーティングシステム", keyword: "オペレーティングシステム" },
                      { label: "OS", keyword: "OS" }
                    ],
                  },
                  {
                    label: "並列・分散処理",
                    children: [
                      { label: "並列計算", keyword: "並列計算" },
                      { label: "分散システム", keyword: "分散システム" },
                      { label: "並列処理", keyword: "並列処理" }
                    ],
                  },
                  {
                    label: "組込み・システム基盤",
                    children: [
                      { label: "組込みシステム", keyword: "組込みシステム" },
                      { label: "リアルタイムシステム", keyword: "リアルタイムシステム" },
                      { label: "仮想化", keyword: "仮想化" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "ソフトウェア科学",
        children: [
          {
            label: "ソフトウェア工学分野",
            children: [
              {
                label: "ソフトウェア設計・検証",
                children: [
                  {
                    label: "ソフトウェア開発手法",
                    children: [
                      { label: "ソフトウェア工学", keyword: "ソフトウェア工学" },
                      { label: "ソフトウェアテスト", keyword: "ソフトウェアテスト" },
                      { label: "アジャイル開発", keyword: "アジャイル開発" },
                      { label: "ソフトウェア保守", keyword: "ソフトウェア保守" }
                    ],
                  },
                  {
                    label: "検証・形式手法",
                    children: [
                      { label: "プログラム検証", keyword: "プログラム検証" },
                      { label: "形式手法", keyword: "形式手法" },
                      { label: "モデル検査", keyword: "モデル検査" }
                    ],
                  }
                ],
              },
              {
                label: "プログラミング言語論",
                children: [
                  {
                    label: "言語設計・意味論",
                    children: [
                      { label: "プログラミング言語", keyword: "プログラミング言語" },
                      { label: "型理論", keyword: "型理論" },
                      { label: "プログラム意味論", keyword: "プログラム意味論" },
                      { label: "関数型プログラミング", keyword: "関数型プログラミング" }
                    ],
                  },
                  {
                    label: "コンパイラ・処理系",
                    children: [
                      { label: "コンパイラ", keyword: "コンパイラ" },
                      { label: "静的解析", keyword: "静的解析" },
                      { label: "プログラム最適化", keyword: "プログラム最適化" },
                      { label: "並行プログラミング", keyword: "並行プログラミング" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "システム開発・運用",
            children: [
              {
                label: "ソフトウェアシステム基盤",
                children: [
                  {
                    label: "開発・運用技術",
                    children: [
                      { label: "ソフトウェアアーキテクチャ", keyword: "ソフトウェアアーキテクチャ" },
                      { label: "オープンソースソフトウェア", keyword: "オープンソースソフトウェア" },
                      { label: "ソフトウェア再利用", keyword: "ソフトウェア再利用" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "人工知能・機械学習",
        children: [
          {
            label: "機械学習基盤",
            children: [
              {
                label: "学習アルゴリズム",
                children: [
                  {
                    label: "教師あり・統計学習",
                    children: [
                      { label: "機械学習", keyword: "機械学習" },
                      { label: "統計的機械学習", keyword: "統計的機械学習" },
                      { label: "教師あり学習", keyword: "教師あり学習" },
                      { label: "カーネル法", keyword: "カーネル法" },
                      { label: "教師なし学習", keyword: "教師なし学習" }
                    ],
                  },
                  {
                    label: "深層ニューラルネット",
                    children: [
                      { label: "深層学習", keyword: "深層学習" },
                      { label: "ニューラルネットワーク", keyword: "ニューラルネットワーク" },
                      { label: "畳み込みニューラルネットワーク", keyword: "畳み込みニューラルネットワーク" },
                      { label: "トランスフォーマー", keyword: "トランスフォーマー" }
                    ],
                  },
                  {
                    label: "強化学習・生成モデル",
                    children: [
                      { label: "強化学習", keyword: "強化学習" },
                      { label: "生成モデル", keyword: "生成モデル" },
                      { label: "生成AI", keyword: "生成AI" },
                      { label: "敵対的生成ネットワーク", keyword: "敵対的生成ネットワーク" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "自然言語・音声処理",
            children: [
              {
                label: "自然言語処理分野",
                children: [
                  {
                    label: "言語モデル・自然言語処理",
                    children: [
                      { label: "自然言語処理", keyword: "自然言語処理" },
                      { label: "大規模言語モデル", keyword: "大規模言語モデル" },
                      { label: "機械翻訳", keyword: "機械翻訳" },
                      { label: "質問応答", keyword: "質問応答" }
                    ],
                  },
                  {
                    label: "音声・対話処理",
                    children: [
                      { label: "音声認識", keyword: "音声認識" },
                      { label: "音声合成", keyword: "音声合成" },
                      { label: "対話システム", keyword: "対話システム" },
                      { label: "話者認識", keyword: "話者認識" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "視覚情報処理",
            children: [
              {
                label: "画像認識・理解",
                children: [
                  {
                    label: "画像認識・物体検出",
                    children: [
                      { label: "コンピュータビジョン", keyword: "コンピュータビジョン" },
                      { label: "画像認識", keyword: "画像認識" },
                      { label: "パターン認識", keyword: "パターン認識" },
                      { label: "物体検出", keyword: "物体検出" }
                    ],
                  },
                  {
                    label: "三次元・映像認識",
                    children: [
                      { label: "三次元認識", keyword: "三次元認識" },
                      { label: "三次元復元", keyword: "三次元復元" },
                      { label: "動画像処理", keyword: "動画像処理" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "知識・推論",
            children: [
              {
                label: "知識処理",
                children: [
                  {
                    label: "知識表現・推論",
                    children: [
                      { label: "知識表現", keyword: "知識表現" },
                      { label: "自動推論", keyword: "自動推論" },
                      { label: "知識グラフ", keyword: "知識グラフ" },
                      { label: "オントロジー", keyword: "オントロジー" }
                    ],
                  },
                  {
                    label: "探索・プランニング",
                    children: [
                      { label: "探索アルゴリズム", keyword: "探索アルゴリズム" },
                      { label: "プランニング", keyword: "プランニング" },
                      { label: "制約充足", keyword: "制約充足" },
                      { label: "マルチエージェント", keyword: "マルチエージェント" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "データ科学",
        children: [
          {
            label: "データ管理・基盤",
            children: [
              {
                label: "データベース・大規模処理",
                children: [
                  {
                    label: "データベースシステム",
                    children: [
                      { label: "データベース", keyword: "データベース" },
                      { label: "分散データベース", keyword: "分散データベース" },
                      { label: "トランザクション処理", keyword: "トランザクション処理" }
                    ],
                  },
                  {
                    label: "大規模データ処理",
                    children: [
                      { label: "ビッグデータ処理", keyword: "ビッグデータ処理" },
                      { label: "ビッグデータ", keyword: "ビッグデータ" },
                      { label: "データストリーム処理", keyword: "データストリーム処理" },
                      { label: "並列データ処理", keyword: "並列データ処理" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "データ解析・検索",
            children: [
              {
                label: "データサイエンス分野",
                children: [
                  {
                    label: "データ分析",
                    children: [
                      { label: "データサイエンス", keyword: "データサイエンス" },
                      { label: "データマイニング", keyword: "データマイニング" },
                      { label: "統計的データ解析", keyword: "統計的データ解析" },
                      { label: "時系列解析", keyword: "時系列解析" },
                      { label: "データ可視化", keyword: "データ可視化" }
                    ],
                  },
                  {
                    label: "情報検索・推薦",
                    children: [
                      { label: "情報検索", keyword: "情報検索" },
                      { label: "推薦システム", keyword: "推薦システム" },
                      { label: "Web検索", keyword: "Web検索" },
                      { label: "情報抽出", keyword: "情報抽出" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "生命情報科学",
            children: [
              {
                label: "バイオ情報学",
                children: [
                  {
                    label: "ゲノム情報解析",
                    children: [
                      { label: "バイオインフォマティクス", keyword: "バイオインフォマティクス" },
                      { label: "計算生物学", keyword: "計算生物学" },
                      { label: "ゲノム解析", keyword: "ゲノム解析" },
                      { label: "配列解析", keyword: "配列解析" }
                    ],
                  },
                  {
                    label: "医療・健康データ",
                    children: [
                      { label: "医用画像処理", keyword: "医用画像処理" },
                      { label: "医療情報学", keyword: "医療情報学" },
                      { label: "バイオデータベース", keyword: "バイオデータベース" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "ネットワーク・セキュリティ",
        children: [
          {
            label: "情報ネットワーク",
            children: [
              {
                label: "ネットワーク工学",
                children: [
                  {
                    label: "ネットワークアーキテクチャ",
                    children: [
                      { label: "コンピュータネットワーク", keyword: "コンピュータネットワーク" },
                      { label: "ネットワーク", keyword: "ネットワーク" },
                      { label: "モバイルネットワーク", keyword: "モバイルネットワーク" },
                      { label: "無線ネットワーク", keyword: "無線ネットワーク" }
                    ],
                  },
                  {
                    label: "IoT・クラウド基盤",
                    children: [
                      { label: "IoT", keyword: "IoT" },
                      { label: "クラウド", keyword: "クラウド" },
                      { label: "クラウドコンピューティング", keyword: "クラウドコンピューティング" },
                      { label: "エッジコンピューティング", keyword: "エッジコンピューティング" },
                      { label: "センサネットワーク", keyword: "センサネットワーク" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "情報セキュリティ工学",
            children: [
              {
                label: "セキュリティ・暗号",
                children: [
                  {
                    label: "暗号・認証",
                    children: [
                      { label: "暗号理論", keyword: "暗号理論" },
                      { label: "暗号", keyword: "暗号" },
                      { label: "暗号通信", keyword: "暗号通信" },
                      { label: "認証技術", keyword: "認証技術" }
                    ],
                  },
                  {
                    label: "システムセキュリティ",
                    children: [
                      { label: "情報セキュリティ", keyword: "情報セキュリティ" },
                      { label: "セキュリティ", keyword: "セキュリティ" },
                      { label: "ネットワークセキュリティ", keyword: "ネットワークセキュリティ" },
                      { label: "マルウェア対策", keyword: "マルウェア対策" },
                      { label: "プライバシー保護", keyword: "プライバシー保護" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "ヒューマン・メディア情報",
        children: [
          {
            label: "ヒューマンインタフェース",
            children: [
              {
                label: "HCI分野",
                children: [
                  {
                    label: "インタラクション技術",
                    children: [
                      { label: "ヒューマンコンピュータインタラクション", keyword: "ヒューマンコンピュータインタラクション" },
                      { label: "HCI", keyword: "HCI" },
                      { label: "ユーザインタフェース", keyword: "ユーザインタフェース" },
                      { label: "インタフェース", keyword: "インタフェース" },
                      { label: "情報可視化", keyword: "情報可視化" }
                    ],
                  },
                  {
                    label: "ウェアラブル・ユビキタス",
                    children: [
                      { label: "ウェアラブル情報処理", keyword: "ウェアラブル情報処理" },
                      { label: "ユビキタスコンピューティング", keyword: "ユビキタスコンピューティング" },
                      { label: "生体情報インタフェース", keyword: "生体情報インタフェース" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "視覚・音メディア",
            children: [
              {
                label: "視覚メディア工学",
                children: [
                  {
                    label: "映像・CG技術",
                    children: [
                      { label: "コンピュータグラフィックス", keyword: "コンピュータグラフィックス" },
                      { label: "コンピュータアニメーション", keyword: "コンピュータアニメーション" },
                      { label: "画像生成", keyword: "画像生成" }
                    ],
                  },
                  {
                    label: "VR・AR",
                    children: [
                      { label: "拡張現実", keyword: "拡張現実" },
                      { label: "仮想現実", keyword: "仮想現実" },
                      { label: "VR", keyword: "VR" },
                      { label: "AR", keyword: "AR" }
                    ],
                  }
                ],
              },
              {
                label: "音響メディア工学",
                children: [
                  {
                    label: "音響・音楽情報処理",
                    children: [
                      { label: "音響信号処理", keyword: "音響信号処理" },
                      { label: "音楽情報処理", keyword: "音楽情報処理" },
                      { label: "音環境理解", keyword: "音環境理解" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "数理情報・意思決定科学",
        children: [
          {
            label: "最適化・オペレーションズリサーチ",
            children: [
              {
                label: "数理最適化分野",
                children: [
                  {
                    label: "最適化理論",
                    children: [
                      { label: "数理最適化", keyword: "数理最適化" },
                      { label: "組合せ最適化", keyword: "組合せ最適化" },
                      { label: "連続最適化", keyword: "連続最適化" }
                    ],
                  },
                  {
                    label: "OR・意思決定",
                    children: [
                      { label: "オペレーションズリサーチ", keyword: "オペレーションズリサーチ" },
                      { label: "意思決定科学", keyword: "意思決定科学" },
                      { label: "ゲーム理論応用", keyword: "ゲーム理論応用" },
                      { label: "スケジューリング", keyword: "スケジューリング" },
                      { label: "待ち行列理論", keyword: "待ち行列理論" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "計算科学・シミュレーション",
            children: [
              {
                label: "計算科学分野",
                children: [
                  {
                    label: "数値計算・シミュレーション",
                    children: [
                      { label: "数値計算", keyword: "数値計算" },
                      { label: "シミュレーション科学", keyword: "シミュレーション科学" },
                      { label: "数値シミュレーション", keyword: "数値シミュレーション" }
                    ],
                  },
                  {
                    label: "高性能・並列計算",
                    children: [
                      { label: "ハイパフォーマンスコンピューティング", keyword: "ハイパフォーマンスコンピューティング" },
                      { label: "高性能計算", keyword: "高性能計算" },
                      { label: "GPUコンピューティング", keyword: "GPUコンピューティング" },
                      { label: "並列数値計算", keyword: "並列数値計算" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      }
    ],
  },
  {
    label: "数学",
    fieldCodes: ["26"],
    children: [
      {
        label: "代数学",
        children: [
          {
            label: "代数構造論",
            children: [
              {
                label: "群・環・体",
                children: [
                  {
                    label: "群論研究",
                    children: [
                      { label: "群論", keyword: "群論" },
                      { label: "有限群", keyword: "有限群" },
                      { label: "リー群", keyword: "リー群" },
                      { label: "代数群", keyword: "代数群" }
                    ],
                  },
                  {
                    label: "環論・体論",
                    children: [
                      { label: "環論", keyword: "環論" },
                      { label: "可換環論", keyword: "可換環論" },
                      { label: "体論", keyword: "体論" },
                      { label: "ガロア理論", keyword: "ガロア理論" }
                    ],
                  },
                  {
                    label: "表現論・ホモロジー代数",
                    children: [
                      { label: "表現論", keyword: "表現論" },
                      { label: "ホモロジー代数", keyword: "ホモロジー代数" },
                      { label: "圏論", keyword: "圏論" }
                    ],
                  }
                ],
              },
              {
                label: "代数学一般",
                children: [
                  {
                    label: "抽象代数",
                    children: [
                      { label: "代数", keyword: "代数" },
                      { label: "線形代数", keyword: "線形代数" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "数論・代数幾何",
            children: [
              {
                label: "整数論分野",
                children: [
                  {
                    label: "整数論研究",
                    children: [
                      { label: "整数論", keyword: "整数論" },
                      { label: "代数的整数論", keyword: "代数的整数論" },
                      { label: "解析的整数論", keyword: "解析的整数論" }
                    ],
                  },
                  {
                    label: "数論的テーマ",
                    children: [
                      { label: "数論", keyword: "数論" },
                      { label: "保型形式", keyword: "保型形式" },
                      { label: "楕円曲線", keyword: "楕円曲線" }
                    ],
                  }
                ],
              },
              {
                label: "代数幾何学分野",
                children: [
                  {
                    label: "代数幾何研究",
                    children: [
                      { label: "代数幾何学", keyword: "代数幾何学" },
                      { label: "スキーム論", keyword: "スキーム論" },
                      { label: "モジュライ理論", keyword: "モジュライ理論" },
                      { label: "数論幾何", keyword: "数論幾何" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "幾何学",
        children: [
          {
            label: "微分幾何・トポロジー",
            children: [
              {
                label: "微分幾何学分野",
                children: [
                  {
                    label: "微分幾何研究",
                    children: [
                      { label: "微分幾何学", keyword: "微分幾何学" },
                      { label: "リーマン幾何学", keyword: "リーマン幾何学" },
                      { label: "シンプレクティック幾何", keyword: "シンプレクティック幾何" }
                    ],
                  },
                  {
                    label: "幾何解析",
                    children: [
                      { label: "幾何", keyword: "幾何" },
                      { label: "複素幾何", keyword: "複素幾何" },
                      { label: "微分位相幾何", keyword: "微分位相幾何" }
                    ],
                  }
                ],
              },
              {
                label: "位相幾何学分野",
                children: [
                  {
                    label: "位相幾何研究",
                    children: [
                      { label: "位相幾何学", keyword: "位相幾何学" },
                      { label: "低次元トポロジー", keyword: "低次元トポロジー" },
                      { label: "結び目理論", keyword: "結び目理論" }
                    ],
                  },
                  {
                    label: "トポロジー一般",
                    children: [
                      { label: "トポロジー", keyword: "トポロジー" },
                      { label: "代数的位相幾何", keyword: "代数的位相幾何" },
                      { label: "ホモトピー論", keyword: "ホモトピー論" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "大域解析・現代幾何",
            children: [
              {
                label: "大域幾何",
                children: [
                  {
                    label: "幾何構造",
                    children: [
                      { label: "双曲幾何", keyword: "双曲幾何" },
                      { label: "射影幾何", keyword: "射影幾何" },
                      { label: "離散幾何", keyword: "離散幾何" }
                    ],
                  },
                  {
                    label: "幾何学的トポロジー",
                    children: [
                      { label: "多様体", keyword: "多様体" },
                      { label: "ゲージ理論", keyword: "ゲージ理論" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "解析学",
        children: [
          {
            label: "実・複素解析",
            children: [
              {
                label: "解析学基礎",
                children: [
                  {
                    label: "実・複素解析研究",
                    children: [
                      { label: "実解析", keyword: "実解析" },
                      { label: "複素解析", keyword: "複素解析" },
                      { label: "調和解析", keyword: "調和解析" }
                    ],
                  },
                  {
                    label: "解析学一般",
                    children: [
                      { label: "解析", keyword: "解析" },
                      { label: "関数論", keyword: "関数論" },
                      { label: "フーリエ解析", keyword: "フーリエ解析" }
                    ],
                  }
                ],
              },
              {
                label: "測度・積分論",
                children: [
                  {
                    label: "測度論的解析",
                    children: [
                      { label: "測度論", keyword: "測度論" },
                      { label: "ポテンシャル論", keyword: "ポテンシャル論" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "微分方程式・関数解析",
            children: [
              {
                label: "微分方程式論",
                children: [
                  {
                    label: "微分方程式研究",
                    children: [
                      { label: "偏微分方程式", keyword: "偏微分方程式" },
                      { label: "常微分方程式", keyword: "常微分方程式" },
                      { label: "非線形偏微分方程式", keyword: "非線形偏微分方程式" }
                    ],
                  },
                  {
                    label: "微分方程式の解析",
                    children: [
                      { label: "微分方程式", keyword: "微分方程式" },
                      { label: "変分法", keyword: "変分法" },
                      { label: "積分方程式", keyword: "積分方程式" }
                    ],
                  }
                ],
              },
              {
                label: "関数解析分野",
                children: [
                  {
                    label: "関数解析研究",
                    children: [
                      { label: "関数解析", keyword: "関数解析" },
                      { label: "作用素論", keyword: "作用素論" },
                      { label: "スペクトル理論", keyword: "スペクトル理論" }
                    ],
                  },
                  {
                    label: "作用素環・関数空間",
                    children: [
                      { label: "作用素環", keyword: "作用素環" },
                      { label: "関数空間", keyword: "関数空間" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "確率・統計",
        children: [
          {
            label: "確率論分野",
            children: [
              {
                label: "確率過程論",
                children: [
                  {
                    label: "確率過程研究",
                    children: [
                      { label: "確率論", keyword: "確率論" },
                      { label: "確率過程", keyword: "確率過程" },
                      { label: "確率微分方程式", keyword: "確率微分方程式" }
                    ],
                  },
                  {
                    label: "確率論の展開",
                    children: [
                      { label: "確率", keyword: "確率" },
                      { label: "確率解析", keyword: "確率解析" },
                      { label: "マルコフ過程", keyword: "マルコフ過程" },
                      { label: "ランダムウォーク", keyword: "ランダムウォーク" }
                    ],
                  }
                ],
              },
              {
                label: "確率論の応用",
                children: [
                  {
                    label: "数理ファイナンス・待ち行列",
                    children: [
                      { label: "数理ファイナンス", keyword: "数理ファイナンス" },
                      { label: "待ち行列理論", keyword: "待ち行列理論" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "統計科学",
            children: [
              {
                label: "数理統計学",
                children: [
                  {
                    label: "統計的推測論",
                    children: [
                      { label: "統計学", keyword: "統計学" },
                      { label: "ベイズ統計", keyword: "ベイズ統計" },
                      { label: "統計的推測", keyword: "統計的推測" },
                      { label: "統計的学習理論", keyword: "統計的学習理論" }
                    ],
                  },
                  {
                    label: "統計手法",
                    children: [
                      { label: "統計", keyword: "統計" },
                      { label: "多変量解析", keyword: "多変量解析" },
                      { label: "時系列解析", keyword: "時系列解析" },
                      { label: "実験計画法", keyword: "実験計画法" }
                    ],
                  }
                ],
              },
              {
                label: "応用統計",
                children: [
                  {
                    label: "計算・空間統計",
                    children: [
                      { label: "計算統計", keyword: "計算統計" },
                      { label: "空間統計", keyword: "空間統計" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "応用・計算数学",
        children: [
          {
            label: "数理物理・力学系",
            children: [
              {
                label: "数理物理学",
                children: [
                  {
                    label: "数理物理研究",
                    children: [
                      { label: "数理物理", keyword: "数理物理" },
                      { label: "可積分系", keyword: "可積分系" }
                    ],
                  },
                  {
                    label: "現代数理物理",
                    children: [
                      { label: "共形場理論", keyword: "共形場理論" },
                      { label: "量子群", keyword: "量子群" }
                    ],
                  }
                ],
              },
              {
                label: "力学系理論",
                children: [
                  {
                    label: "力学系研究",
                    children: [
                      { label: "力学系", keyword: "力学系" },
                      { label: "分岐理論", keyword: "分岐理論" }
                    ],
                  },
                  {
                    label: "カオス・エルゴード",
                    children: [
                      { label: "カオス理論", keyword: "カオス理論" },
                      { label: "エルゴード理論", keyword: "エルゴード理論" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "数値解析・計算数学",
            children: [
              {
                label: "数値解析分野",
                children: [
                  {
                    label: "数値解析研究",
                    children: [
                      { label: "数値解析", keyword: "数値解析" },
                      { label: "数値線形代数", keyword: "数値線形代数" },
                      { label: "有限要素法", keyword: "有限要素法" }
                    ],
                  },
                  {
                    label: "計算アルゴリズム",
                    children: [
                      { label: "数値シミュレーション", keyword: "数値シミュレーション" },
                      { label: "数値計算", keyword: "数値計算" }
                    ],
                  }
                ],
              },
              {
                label: "最適化・数理計画",
                children: [
                  {
                    label: "最適化理論",
                    children: [
                      { label: "最適化", keyword: "最適化" },
                      { label: "数理最適化", keyword: "数理最適化" },
                      { label: "凸最適化", keyword: "凸最適化" }
                    ],
                  },
                  {
                    label: "数理計画・制御",
                    children: [
                      { label: "オペレーションズリサーチ", keyword: "オペレーションズリサーチ" },
                      { label: "制御理論", keyword: "制御理論" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "離散数学・数理論理",
            children: [
              {
                label: "離散数学分野",
                children: [
                  {
                    label: "離散数学研究",
                    children: [
                      { label: "離散数学", keyword: "離散数学" },
                      { label: "組合せ論", keyword: "組合せ論" },
                      { label: "グラフ理論", keyword: "グラフ理論" }
                    ],
                  },
                  {
                    label: "組合せ論の応用",
                    children: [
                      { label: "組合せ最適化", keyword: "組合せ最適化" },
                      { label: "符号理論", keyword: "符号理論" }
                    ],
                  }
                ],
              },
              {
                label: "数理論理学分野",
                children: [
                  {
                    label: "数理論理研究",
                    children: [
                      { label: "数理論理学", keyword: "数理論理学" },
                      { label: "計算可能性理論", keyword: "計算可能性理論" }
                    ],
                  },
                  {
                    label: "論理と基礎論",
                    children: [
                      { label: "数学基礎論", keyword: "数学基礎論" },
                      { label: "集合論", keyword: "集合論" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "数理モデリング",
            children: [
              {
                label: "応用数理",
                children: [
                  {
                    label: "数理モデル化",
                    children: [
                      { label: "応用数学", keyword: "応用数学" },
                      { label: "数理モデル", keyword: "数理モデル" },
                      { label: "数理生物学", keyword: "数理生物学" }
                    ],
                  },
                  {
                    label: "産業・計算科学",
                    children: [
                      { label: "産業数学", keyword: "産業数学" },
                      { label: "計算科学", keyword: "計算科学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      }
    ],
  },
  {
    label: "地球科学・環境",
    fieldCodes: ["19", "23"],
    children: [
      {
        label: "固体地球科学",
        children: [
          {
            label: "地質・岩石鉱物",
            children: [
              {
                label: "地質学分野",
                children: [
                  {
                    label: "地質・構造",
                    children: [
                      { label: "地質学", keyword: "地質学" },
                      { label: "地質", keyword: "地質" },
                      { label: "構造地質学", keyword: "構造地質学" }
                    ],
                  },
                  {
                    label: "堆積・層序",
                    children: [
                      { label: "堆積学", keyword: "堆積学" },
                      { label: "層序学", keyword: "層序学" },
                      { label: "堆積岩石学", keyword: "堆積岩石学" }
                    ],
                  },
                  {
                    label: "岩石・鉱物",
                    children: [
                      { label: "岩石学", keyword: "岩石学" },
                      { label: "鉱物学", keyword: "鉱物学" },
                      { label: "鉱物", keyword: "鉱物" },
                      { label: "火成岩岩石学", keyword: "火成岩岩石学" },
                      { label: "変成岩岩石学", keyword: "変成岩岩石学" }
                    ],
                  },
                  {
                    label: "地球化学・年代",
                    children: [
                      { label: "地球化学", keyword: "地球化学" },
                      { label: "同位体地球化学", keyword: "同位体地球化学" },
                      { label: "地質年代学", keyword: "地質年代学" }
                    ],
                  }
                ],
              },
              {
                label: "古生物・地史",
                children: [
                  {
                    label: "古生物研究",
                    children: [
                      { label: "古生物", keyword: "古生物" },
                      { label: "古生物学", keyword: "古生物学" },
                      { label: "微古生物学", keyword: "微古生物学" }
                    ],
                  },
                  {
                    label: "古環境・第四紀",
                    children: [
                      { label: "古環境学", keyword: "古環境学" },
                      { label: "第四紀学", keyword: "第四紀学" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "地球物理・地震",
            children: [
              {
                label: "地震・火山学",
                children: [
                  {
                    label: "地震研究",
                    children: [
                      { label: "地震学", keyword: "地震学" },
                      { label: "地震", keyword: "地震" },
                      { label: "地震波", keyword: "地震波" }
                    ],
                  },
                  {
                    label: "火山研究",
                    children: [
                      { label: "火山学", keyword: "火山学" },
                      { label: "火山", keyword: "火山" },
                      { label: "マグマ", keyword: "マグマ" }
                    ],
                  },
                  {
                    label: "地球内部構造",
                    children: [
                      { label: "地球内部物理", keyword: "地球内部物理" },
                      { label: "地球内部", keyword: "地球内部" },
                      { label: "マントル対流", keyword: "マントル対流" },
                      { label: "地球ダイナモ", keyword: "地球ダイナモ" }
                    ],
                  },
                  {
                    label: "測地・地殻変動",
                    children: [
                      { label: "測地学", keyword: "測地学" },
                      { label: "地殻変動", keyword: "地殻変動" },
                      { label: "古地磁気学", keyword: "古地磁気学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "大気・海洋科学",
        children: [
          {
            label: "大気科学",
            children: [
              {
                label: "気象・気候",
                children: [
                  {
                    label: "気象研究",
                    children: [
                      { label: "気象学", keyword: "気象学" },
                      { label: "気象", keyword: "気象" },
                      { label: "数値予報", keyword: "数値予報" },
                      { label: "メソ気象学", keyword: "メソ気象学" }
                    ],
                  },
                  {
                    label: "気候研究",
                    children: [
                      { label: "気候科学", keyword: "気候科学" },
                      { label: "気候変動", keyword: "気候変動" },
                      { label: "古気候学", keyword: "古気候学" }
                    ],
                  },
                  {
                    label: "大気物理・化学",
                    children: [
                      { label: "大気物理", keyword: "大気物理" },
                      { label: "大気", keyword: "大気" },
                      { label: "大気化学", keyword: "大気化学" },
                      { label: "エアロゾル", keyword: "エアロゾル" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "海洋科学",
            children: [
              {
                label: "海洋学分野",
                children: [
                  {
                    label: "物理海洋",
                    children: [
                      { label: "海洋学", keyword: "海洋学" },
                      { label: "海洋", keyword: "海洋" },
                      { label: "海洋物理", keyword: "海洋物理" },
                      { label: "海洋循環", keyword: "海洋循環" }
                    ],
                  },
                  {
                    label: "海洋生態・生物",
                    children: [
                      { label: "海洋生態系", keyword: "海洋生態系" },
                      { label: "海洋生物", keyword: "海洋生物" },
                      { label: "海洋生物学", keyword: "海洋生物学" },
                      { label: "プランクトン", keyword: "プランクトン" }
                    ],
                  },
                  {
                    label: "化学海洋・海洋地質",
                    children: [
                      { label: "化学海洋学", keyword: "化学海洋学" },
                      { label: "海洋化学", keyword: "海洋化学" },
                      { label: "海洋地質学", keyword: "海洋地質学" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "水循環・陸水",
            children: [
              {
                label: "水文・陸水科学",
                children: [
                  {
                    label: "水文研究",
                    children: [
                      { label: "水文学", keyword: "水文学" },
                      { label: "地下水学", keyword: "地下水学" },
                      { label: "河川水文学", keyword: "河川水文学" }
                    ],
                  },
                  {
                    label: "陸水・雪氷",
                    children: [
                      { label: "陸水学", keyword: "陸水学" },
                      { label: "雪氷学", keyword: "雪氷学" },
                      { label: "湖沼学", keyword: "湖沼学" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "惑星・宇宙地球科学",
        children: [
          {
            label: "惑星・宇宙科学",
            children: [
              {
                label: "惑星・太陽系科学",
                children: [
                  {
                    label: "惑星研究",
                    children: [
                      { label: "惑星科学", keyword: "惑星科学" },
                      { label: "太陽系科学", keyword: "太陽系科学" },
                      { label: "惑星大気", keyword: "惑星大気" }
                    ],
                  },
                  {
                    label: "地球外生命・宇宙化学",
                    children: [
                      { label: "アストロバイオロジー", keyword: "アストロバイオロジー" },
                      { label: "隕石学", keyword: "隕石学" },
                      { label: "宇宙化学", keyword: "宇宙化学" }
                    ],
                  }
                ],
              },
              {
                label: "地球電磁気・超高層",
                children: [
                  {
                    label: "超高層・電磁気",
                    children: [
                      { label: "地球電磁気学", keyword: "地球電磁気学" },
                      { label: "超高層物理学", keyword: "超高層物理学" },
                      { label: "電離圏", keyword: "電離圏" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "環境科学",
        children: [
          {
            label: "環境動態・生態",
            children: [
              {
                label: "生態系科学",
                children: [
                  {
                    label: "生態系・多様性",
                    children: [
                      { label: "生態系", keyword: "生態系" },
                      { label: "生物多様性", keyword: "生物多様性" },
                      { label: "生態系機能", keyword: "生態系機能" }
                    ],
                  },
                  {
                    label: "保全・復元生態",
                    children: [
                      { label: "保全生態学", keyword: "保全生態学" },
                      { label: "景観生態学", keyword: "景観生態学" },
                      { label: "復元生態学", keyword: "復元生態学" }
                    ],
                  }
                ],
              },
              {
                label: "環境動態科学",
                children: [
                  {
                    label: "物質循環研究",
                    children: [
                      { label: "環境動態", keyword: "環境動態" },
                      { label: "物質循環", keyword: "物質循環" },
                      { label: "生物地球化学", keyword: "生物地球化学" },
                      { label: "炭素循環", keyword: "炭素循環" }
                    ],
                  },
                  {
                    label: "地球システム変動",
                    children: [
                      { label: "地球環境変動", keyword: "地球環境変動" },
                      { label: "陸域生態系", keyword: "陸域生態系" },
                      { label: "環境放射能", keyword: "環境放射能" },
                      { label: "環境", keyword: "環境" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "環境保全・汚染",
            children: [
              {
                label: "環境汚染科学",
                children: [
                  {
                    label: "大気・水質汚染",
                    children: [
                      { label: "環境汚染", keyword: "環境汚染" },
                      { label: "大気汚染", keyword: "大気汚染" },
                      { label: "水質汚濁", keyword: "水質汚濁" }
                    ],
                  },
                  {
                    label: "土壌・化学物質",
                    children: [
                      { label: "土壌汚染", keyword: "土壌汚染" },
                      { label: "環境化学物質", keyword: "環境化学物質" },
                      { label: "環境毒性学", keyword: "環境毒性学" }
                    ],
                  }
                ],
              },
              {
                label: "持続可能性科学",
                children: [
                  {
                    label: "環境政策・社会",
                    children: [
                      { label: "環境政策科学", keyword: "環境政策科学" },
                      { label: "持続可能", keyword: "持続可能" },
                      { label: "環境経済学", keyword: "環境経済学" }
                    ],
                  },
                  {
                    label: "評価・教育",
                    children: [
                      { label: "生態系サービス", keyword: "生態系サービス" },
                      { label: "環境影響評価", keyword: "環境影響評価" },
                      { label: "環境教育", keyword: "環境教育" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "資源・防災科学",
        children: [
          {
            label: "地球資源",
            children: [
              {
                label: "資源地質学",
                children: [
                  {
                    label: "鉱物・エネルギー資源",
                    children: [
                      { label: "資源地質", keyword: "資源地質" },
                      { label: "エネルギー資源", keyword: "エネルギー資源" },
                      { label: "鉱床学", keyword: "鉱床学" }
                    ],
                  },
                  {
                    label: "資源開発・探査",
                    children: [
                      { label: "石油地質学", keyword: "石油地質学" },
                      { label: "地熱資源", keyword: "地熱資源" },
                      { label: "資源探査", keyword: "資源探査" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "自然災害・防災科学",
            children: [
              {
                label: "防災・減災",
                children: [
                  {
                    label: "防災工学研究",
                    children: [
                      { label: "自然災害科学", keyword: "自然災害科学" },
                      { label: "防災工学", keyword: "防災工学" },
                      { label: "地震防災", keyword: "地震防災" }
                    ],
                  },
                  {
                    label: "地質・火山災害",
                    children: [
                      { label: "津波", keyword: "津波" },
                      { label: "火山防災", keyword: "火山防災" },
                      { label: "土砂災害", keyword: "土砂災害" }
                    ],
                  },
                  {
                    label: "気象・水災害",
                    children: [
                      { label: "洪水", keyword: "洪水" },
                      { label: "気象災害", keyword: "気象災害" },
                      { label: "ハザードマップ", keyword: "ハザードマップ" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      }
    ],
  },
  {
    label: "農学",
    fieldCodes: ["11", "34"],
    children: [
      {
        label: "作物・園芸科学",
        children: [
          {
            label: "作物・育種",
            children: [
              {
                label: "作物・育種学",
                children: [
                  {
                    label: "作物生産",
                    children: [
                      { label: "作物学", keyword: "作物学" },
                      { label: "作物", keyword: "作物" },
                      { label: "栽培", keyword: "栽培" },
                      { label: "イネ", keyword: "イネ" },
                      { label: "コムギ", keyword: "コムギ" }
                    ],
                  },
                  {
                    label: "育種・遺伝",
                    children: [
                      { label: "育種学", keyword: "育種学" },
                      { label: "育種", keyword: "育種" },
                      { label: "植物育種", keyword: "植物育種" },
                      { label: "分子育種", keyword: "分子育種" },
                      { label: "遺伝資源", keyword: "遺伝資源" }
                    ],
                  },
                  {
                    label: "園芸",
                    children: [
                      { label: "園芸学", keyword: "園芸学" },
                      { label: "果樹", keyword: "果樹" },
                      { label: "野菜", keyword: "野菜" },
                      { label: "花卉", keyword: "花卉" }
                    ],
                  },
                  {
                    label: "植物栄養・生理",
                    children: [
                      { label: "植物栄養学", keyword: "植物栄養学" },
                      { label: "施肥", keyword: "施肥" },
                      { label: "植物ホルモン", keyword: "植物ホルモン" }
                    ],
                  }
                ],
              },
              {
                label: "植物保護科学",
                children: [
                  {
                    label: "植物病理",
                    children: [
                      { label: "植物病理学", keyword: "植物病理学" },
                      { label: "植物病害", keyword: "植物病害" }
                    ],
                  },
                  {
                    label: "害虫・防除",
                    children: [
                      { label: "応用昆虫学", keyword: "応用昆虫学" },
                      { label: "害虫防除", keyword: "害虫防除" },
                      { label: "農薬", keyword: "農薬" },
                      { label: "生物的防除", keyword: "生物的防除" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "農芸化学・食品科学",
        children: [
          {
            label: "生物資源化学",
            children: [
              {
                label: "応用生命化学",
                children: [
                  {
                    label: "農芸化学・生物化学",
                    children: [
                      { label: "農芸化学", keyword: "農芸化学" },
                      { label: "生物有機化学", keyword: "生物有機化学" }
                    ],
                  },
                  {
                    label: "応用微生物・発酵",
                    children: [
                      { label: "応用微生物学", keyword: "応用微生物学" },
                      { label: "発酵学", keyword: "発酵学" },
                      { label: "醸造", keyword: "醸造" },
                      { label: "酵素工学", keyword: "酵素工学" }
                    ],
                  },
                  {
                    label: "天然物・生理活性",
                    children: [
                      { label: "天然物有機化学", keyword: "天然物有機化学" },
                      { label: "生理活性物質", keyword: "生理活性物質" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "食品栄養科学",
            children: [
              {
                label: "食品科学分野",
                children: [
                  {
                    label: "食品科学・加工",
                    children: [
                      { label: "食品科学", keyword: "食品科学" },
                      { label: "食品", keyword: "食品" },
                      { label: "食品加工学", keyword: "食品加工学" },
                      { label: "食品工学", keyword: "食品工学" }
                    ],
                  },
                  {
                    label: "食品機能・栄養",
                    children: [
                      { label: "食品機能学", keyword: "食品機能学" },
                      { label: "栄養科学", keyword: "栄養科学" },
                      { label: "栄養", keyword: "栄養" },
                      { label: "機能性食品", keyword: "機能性食品" },
                      { label: "栄養化学", keyword: "栄養化学" }
                    ],
                  },
                  {
                    label: "食品安全・衛生",
                    children: [
                      { label: "食品衛生", keyword: "食品衛生" },
                      { label: "食品分析", keyword: "食品分析" },
                      { label: "食品微生物", keyword: "食品微生物" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "動物・畜産科学",
        children: [
          {
            label: "畜産科学",
            children: [
              {
                label: "家畜生産科学",
                children: [
                  {
                    label: "家畜飼育・生産",
                    children: [
                      { label: "畜産学", keyword: "畜産学" },
                      { label: "畜産", keyword: "畜産" },
                      { label: "家畜", keyword: "家畜" },
                      { label: "家禽", keyword: "家禽" },
                      { label: "畜産物", keyword: "畜産物" }
                    ],
                  },
                  {
                    label: "動物栄養・飼料",
                    children: [
                      { label: "動物栄養学", keyword: "動物栄養学" },
                      { label: "飼料", keyword: "飼料" },
                      { label: "反芻動物", keyword: "反芻動物" },
                      { label: "飼料作物", keyword: "飼料作物" }
                    ],
                  },
                  {
                    label: "繁殖・育種",
                    children: [
                      { label: "家畜繁殖学", keyword: "家畜繁殖学" },
                      { label: "動物遺伝育種学", keyword: "動物遺伝育種学" },
                      { label: "家畜育種", keyword: "家畜育種" },
                      { label: "人工授精", keyword: "人工授精" }
                    ],
                  },
                  {
                    label: "動物生産・行動",
                    children: [
                      { label: "家畜管理", keyword: "家畜管理" },
                      { label: "動物行動", keyword: "動物行動" },
                      { label: "家畜生理", keyword: "家畜生理" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "獣医・動物医療",
        children: [
          {
            label: "獣医科学",
            children: [
              {
                label: "動物疾病・衛生",
                children: [
                  {
                    label: "獣医基礎・臨床",
                    children: [
                      { label: "獣医学", keyword: "獣医学" },
                      { label: "獣医", keyword: "獣医" },
                      { label: "獣医臨床", keyword: "獣医臨床" },
                      { label: "獣医薬理", keyword: "獣医薬理" }
                    ],
                  },
                  {
                    label: "動物疾病・病理",
                    children: [
                      { label: "動物疾病学", keyword: "動物疾病学" },
                      { label: "動物感染症", keyword: "動物感染症" },
                      { label: "動物病理", keyword: "動物病理" },
                      { label: "野生動物医学", keyword: "野生動物医学" }
                    ],
                  },
                  {
                    label: "家畜衛生・公衆衛生",
                    children: [
                      { label: "家畜衛生学", keyword: "家畜衛生学" },
                      { label: "獣医公衆衛生学", keyword: "獣医公衆衛生学" },
                      { label: "人獣共通感染症", keyword: "人獣共通感染症" },
                      { label: "動物福祉", keyword: "動物福祉" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "森林・水産科学",
        children: [
          {
            label: "森林・林産科学",
            children: [
              {
                label: "森林・林学分野",
                children: [
                  {
                    label: "森林科学・生態",
                    children: [
                      { label: "森林科学", keyword: "森林科学" },
                      { label: "森林", keyword: "森林" },
                      { label: "森林生態", keyword: "森林生態" },
                      { label: "森林環境", keyword: "森林環境" }
                    ],
                  },
                  {
                    label: "林学・林業",
                    children: [
                      { label: "林学", keyword: "林学" },
                      { label: "林業", keyword: "林業" },
                      { label: "造林", keyword: "造林" },
                      { label: "森林経営", keyword: "森林経営" }
                    ],
                  },
                  {
                    label: "木材・林産",
                    children: [
                      { label: "木材科学", keyword: "木材科学" },
                      { label: "木質材料", keyword: "木質材料" },
                      { label: "林産化学", keyword: "林産化学" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "水産科学",
            children: [
              {
                label: "水産・増養殖",
                children: [
                  {
                    label: "水産資源・漁業",
                    children: [
                      { label: "水産学", keyword: "水産学" },
                      { label: "水産", keyword: "水産" },
                      { label: "漁業", keyword: "漁業" },
                      { label: "水産資源", keyword: "水産資源" }
                    ],
                  },
                  {
                    label: "増養殖・栽培漁業",
                    children: [
                      { label: "増養殖学", keyword: "増養殖学" },
                      { label: "養殖", keyword: "養殖" },
                      { label: "魚類養殖", keyword: "魚類養殖" }
                    ],
                  },
                  {
                    label: "水圏生態・魚病",
                    children: [
                      { label: "水圏生態学", keyword: "水圏生態学" },
                      { label: "水産増殖", keyword: "水産増殖" },
                      { label: "魚病", keyword: "魚病" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      },
      {
        label: "農業環境・経済",
        children: [
          {
            label: "農業環境科学",
            children: [
              {
                label: "土壌・環境",
                children: [
                  {
                    label: "土壌・肥料",
                    children: [
                      { label: "土壌学", keyword: "土壌学" },
                      { label: "土壌肥料", keyword: "土壌肥料" },
                      { label: "土壌微生物", keyword: "土壌微生物" }
                    ],
                  },
                  {
                    label: "農業工学・生産環境",
                    children: [
                      { label: "農業環境工学", keyword: "農業環境工学" },
                      { label: "農業土木", keyword: "農業土木" },
                      { label: "灌漑", keyword: "灌漑" },
                      { label: "農業水利", keyword: "農業水利" },
                      { label: "スマート農業", keyword: "スマート農業" }
                    ],
                  },
                  {
                    label: "農業気象・環境",
                    children: [
                      { label: "農業気象学", keyword: "農業気象学" },
                      { label: "農業環境", keyword: "農業環境" },
                      { label: "環境保全型農業", keyword: "環境保全型農業" }
                    ],
                  }
                ],
              }
            ],
          },
          {
            label: "農業経済・社会科学",
            children: [
              {
                label: "農業経済・地域",
                children: [
                  {
                    label: "農業経済・政策",
                    children: [
                      { label: "農業経済学", keyword: "農業経済学" },
                      { label: "農業政策", keyword: "農業政策" },
                      { label: "フードシステム", keyword: "フードシステム" },
                      { label: "食料経済", keyword: "食料経済" }
                    ],
                  },
                  {
                    label: "農村・地域社会",
                    children: [
                      { label: "農村社会学", keyword: "農村社会学" },
                      { label: "地域農業", keyword: "地域農業" },
                      { label: "農村計画", keyword: "農村計画" }
                    ],
                  }
                ],
              }
            ],
          }
        ],
      }
    ],
  }
];

// ============================================================
// 便利関数
// ============================================================

/**
 * ノードの「識別子」を返す。
 * - leaf は `keyword` フィールド
 * - 中間ノードは `label`（中間ノード自体もタグ／フィルタの対象になる）
 */
export function getNodeIdentifier(node: KeywordNode): string {
  return node.keyword ?? node.label;
}

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

/**
 * ツリー全体の識別子（leaf キーワード + 中間ラベル）を集める。
 * 同名重複は最初の出現を残してスキップ。
 */
export function getAllTreeIdentifiers(): {
  id: string;
  isLeaf: boolean;
}[] {
  const seen = new Set<string>();
  const out: { id: string; isLeaf: boolean }[] = [];
  function recurse(node: KeywordNode) {
    const id = getNodeIdentifier(node);
    if (!seen.has(id)) {
      seen.add(id);
      out.push({ id, isLeaf: !node.children?.length });
    }
    for (const c of node.children ?? []) recurse(c);
  }
  for (const root of KEYWORD_TREE) recurse(root);
  return out;
}

/**
 * 識別子 → 祖先ラベル配列（ルートに近い順）を返す。
 * 例: leaf "細胞" → ["生物学", "細胞生物学", "細胞の基本"] のように、
 * その識別子に至るまでの中間ラベル一覧を集めるのに使う。
 * マッチした識別子の祖先タグも保存することで、上位階層のフィルタで
 * 自動的にマッチするようになる。
 */
export function buildIdentifierAncestorMap(): Map<string, string[]> {
  const map = new Map<string, string[]>();
  function recurse(node: KeywordNode, ancestors: string[]) {
    const id = getNodeIdentifier(node);
    // 既出の識別子は最初の出現を尊重（同名ノードが複数あった場合）
    if (!map.has(id)) map.set(id, [...ancestors]);
    const isInner = node.children && node.children.length > 0;
    const nextAncestors = isInner ? [...ancestors, node.label] : ancestors;
    for (const c of node.children ?? []) recurse(c, nextAncestors);
  }
  for (const root of KEYWORD_TREE) recurse(root, []);
  return map;
}

export type NodeSelectionState = "none" | "partial" | "all";

/**
 * ノードの選択状態：
 *  - "all"      : 自身の識別子が selected
 *  - "partial"  : 自身は未選択だが、子孫のどれかが selected
 *  - "none"     : 上記以外
 *
 * 以前は「配下の leaf がすべて selected か」で判定していたが、
 * 上位ノードのクリックを「自身をタグとして選ぶ」操作に変更したため、
 * 自身の選択状態を直接見るようになった。
 */
export function nodeSelectionState(
  node: KeywordNode,
  selected: Set<string>,
): NodeSelectionState {
  if (selected.has(getNodeIdentifier(node))) return "all";
  if (hasSelectedDescendant(node, selected)) return "partial";
  return "none";
}

function hasSelectedDescendant(
  node: KeywordNode,
  selected: Set<string>,
): boolean {
  for (const c of node.children ?? []) {
    if (selected.has(getNodeIdentifier(c))) return true;
    if (hasSelectedDescendant(c, selected)) return true;
  }
  return false;
}
