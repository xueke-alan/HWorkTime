import Button from "antd/es/button";
import Input from "antd/es/input";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useLanguage } from "../ApplicationTheme";

export function BackupConverter() {
  useLanguage();
  const { t, message } = WorkTimeApp.i18n;
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");
  const generation = useRef(0);
  const picker = useRef<HTMLInputElement>(null);
  const [downloads] = useState(() =>
    WorkTimeApp.services.downloads.create({ document, URL, Blob }),
  );
  useEffect(
    () => () => {
      generation.current++;
      downloads.dispose();
    },
    [downloads],
  );

  function invalidate() {
    setOutput("");
    setStatus("");
    return ++generation.current;
  }
  async function select(event: ChangeEvent<HTMLInputElement>) {
    const request = invalidate();
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (file.size > WorkTimeApp.services.backup.MAX_BYTES) {
      setStatus(t("copy.9e4f8963f1"));
      return;
    }
    try {
      const contents = await file.text();
      if (request === generation.current) setInput(contents);
    } catch (error) {
      if (request === generation.current)
        setStatus(message((error as Error).message));
    }
  }
  async function convert() {
    const request = invalidate();
    try {
      const archive = await WorkTimeApp.services.backup.decode(
        input,
        WorkBackupConversion.convert,
      );
      if (request !== generation.current) return;
      setOutput(JSON.stringify(archive, null, 2));
      setStatus(
        t("converter.success", { count: String(archive.modules.length) }),
      );
    } catch (error) {
      if (request === generation.current)
        setStatus(t("copy.5793742753") + message((error as Error).message));
    }
  }
  return (
    <>
      <h1>{t("copy.c55d0fcace")}</h1>
      <p>{t("copy.3433eb0e22")}</p>
      <span>
        <Button onClick={() => picker.current?.click()}>
          {t("copy.0981fe54f0")}
        </Button>
        <input
          ref={picker}
          type="file"
          hidden
          accept=".json,.txt,application/json,text/plain"
          onChange={select}
        />
      </span>
      <label htmlFor="backupInput">{t("copy.8fe82e067d")}</label>
      <Input.TextArea
        id="backupInput"
        rows={8}
        spellCheck={false}
        value={input}
        onChange={(event) => {
          invalidate();
          setInput(event.target.value);
        }}
      />
      <Button id="convert" onClick={convert}>
        {t("copy.b0b46a9022")}
      </Button>
      <p id="status" aria-live="polite" data-ui="status" role="status">
        {status}
      </p>
      <label htmlFor="backupOutput">{t("copy.d82ec67b65")}</label>
      <Input.TextArea
        id="backupOutput"
        rows={8}
        readOnly
        spellCheck={false}
        value={output}
      />
      <Button
        id="download"
        disabled={!output}
        onClick={() =>
          downloads.download(
            t("copy.7a6b07d795"),
            output,
            "application/json;charset=utf-8",
          )
        }
      >
        {t("copy.0ac86c668c")}
      </Button>
      <p>
        {t("copy.75a8a24ac8")}
        <a href="../index.html">{t("copy.5cb9bad7c9")}</a>
        {t("copy.18f4734a91")}
      </p>
    </>
  );
}
