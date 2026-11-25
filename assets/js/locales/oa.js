"use strict";
(() => {
  const rows = {
    new: [
      "采用本次导入",
      "採用本次匯入",
      "採用本次匯入",
      "Use incoming record",
      "今回の記録を使用",
      "가져온 기록 사용",
    ],
    old: [
      "保留已有记录或此前选择",
      "保留現有記錄或先前選擇",
      "保留現有記錄或先前選擇",
      "Keep existing record or previous choice",
      "既存の記録または前の選択を保持",
      "기존 기록 또는 이전 선택 유지",
    ],
    manual: [
      "手动填写仍保留",
      "保留手動填寫",
      "保留手動填寫",
      "Manual entries are retained",
      "手入力の記録は保持されます",
      "수동 입력은 유지됩니다",
    ],
    conflict: [
      "{date} 冲突处理",
      "{date} 衝突處理",
      "{date} 衝突處理",
      "Resolve conflict for {date}",
      "{date} の競合を解決",
      "{date} 충돌 해결",
    ],
    details: [
      "查看导入详情",
      "檢視匯入詳細資料",
      "查看匯入詳情",
      "View import details",
      "取り込みの詳細を表示",
      "가져오기 세부 정보 보기",
    ],
    remove: [
      "删除导入批次",
      "刪除匯入批次",
      "刪除匯入批次",
      "Delete import batch",
      "取り込み履歴を削除",
      "가져오기 묶음 삭제",
    ],
    records: [
      "{count} 条记录",
      "{count} 筆記錄",
      "{count} 項記錄",
      "Records: {count}",
      "{count} 件の記録",
      "기록 {count}개",
    ],
    empty: [
      "暂无导入历史",
      "尚無匯入記錄",
      "暫無匯入記錄",
      "No import history",
      "取り込み履歴はありません",
      "가져오기 기록이 없습니다",
    ],
  };
  for (const [i, id] of ["zh-CN", "zh-TW", "zh-HK", "en", "ja", "ko"].entries())
    for (const [key, row] of Object.entries(rows))
      WorkTimeApp.data.locales[id]["oa." + key] = row[i];
})();
