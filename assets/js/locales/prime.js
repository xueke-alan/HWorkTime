"use strict";
(() => {
  const rows = {
    emptyMessage: [
      "没有可用选项",
      "沒有可用選項",
      "沒有可用選項",
      "No options available",
      "選択肢がありません",
      "선택할 항목이 없습니다",
    ],
    emptySearchMessage: [
      "没有匹配结果",
      "沒有符合的結果",
      "沒有相符結果",
      "No results found",
      "一致する結果はありません",
      "검색 결과가 없습니다",
    ],
    searchMessage: [
      "有 {0} 项结果",
      "有 {0} 項結果",
      "有 {0} 項結果",
      "{0} results available",
      "{0} 件見つかりました",
      "검색 결과 {0}개",
    ],
    selectionMessage: [
      "已选择 {0} 项",
      "已選取 {0} 項",
      "已選取 {0} 項",
      "{0} items selected",
      "{0} 件選択中",
      "{0}개 선택됨",
    ],
    emptySelectionMessage: [
      "尚未选择",
      "尚未選取",
      "尚未選取",
      "No selection",
      "未選択",
      "선택하지 않음",
    ],
    choose: [
      "选择文件",
      "選擇檔案",
      "選擇檔案",
      "Choose file",
      "ファイルを選択",
      "파일 선택",
    ],
    cancel: ["取消", "取消", "取消", "Cancel", "キャンセル", "취소"],
    upload: ["上传", "上傳", "上載", "Upload", "アップロード", "업로드"],
    completed: ["已完成", "已完成", "已完成", "Completed", "完了", "완료"],
    pending: ["等待中", "等候中", "等候中", "Pending", "待機中", "대기 중"],
  };
  for (const [i, id] of [
    "zh-CN",
    "zh-TW",
    "zh-HK",
    "en",
    "ja",
    "ko",
  ].entries()) {
    for (const [key, row] of Object.entries(rows))
      WorkTimeApp.data.locales[id]["prime." + key] = row[i];
  }
})();
