# ラボマッチ 取り込み進捗レポート

_最終更新: 2026-08-01 11:02:52 JST_

```

> labmatch@0.1.0 progress
> tsx scripts/progress-report.ts

=================================
  ラボマッチ 取り込み進捗レポート
  2026/8/1 11:02:55 JST
=================================

■ 取り込み完了済み (labs >= 1): 111/111 機関 (100%)

■ 今回新たに完了した大学 (前回比)
  （初回スナップショット。今回を基準として記録。次回から差分を表示）

■ 残存 (未完了) 機関一覧: 0 件
  （並び順＝これから cron が取り込む順。大学が先、研究機関が後）

■ 小規模で完了扱いの機関 (1〜49 labs): 9 機関
  · 情報通信研究機構               47 labs
  · 東京都市大学                 47 labs
  · 高エネルギー加速器研究機構          39 labs
  · 宇宙航空研究開発機構             39 labs
  · 会津大学                   35 labs
  · 一橋大学                   31 labs
  · カブリ数物連携宇宙研究機構（Kavli IPMU） 23 labs
  · 豊田工業大学                 9 labs
  · 政策研究大学院大学              8 labs

■ 子センター (parent 付き、研究機関): 105 件
  · University of Tokyo Hospital                            296 labs
  · Keio University Hospital                                233 labs
  · Kyoto University Hospital                               221 labs
  · Okayama University Hospital                             200 labs
  · Yokohama City University Medical Center                 185 labs
  · Kyushu University Hospital                              178 labs
  · Fujita Health University Hospital                       175 labs
  · RIKEN Center for Integrative Medical Sciences           150 labs
  · RIKEN Center for Sustainable Resource Science           148 labs
  · Niigata University Medical and Dental Hospital          146 labs

■ 全体統計
  ラボ総数:     50,100
  論文総数:     1,456,169
  AI 要約済み:  49,808 (99%)
  タグ付き:     49,733 (99%)

■ config に登録されている総数: 111 機関（大学 + 公的研究機関 + 学内研究所）
  残: 0 機関 (4 本/日 cron で約 0 日で完走)
```
