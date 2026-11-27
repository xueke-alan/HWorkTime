/* Numeric views pass values and formatting directly to this component. */
(() => {
  "use strict";
  let previous = new WeakMap();
  const history = new Map(),
    active = new Map();
  const reduced = WorkTimeApp.ui.animationCompat.preference();
  let unlisten;
  let disposed = true;
  function finish(track) {
    const entry = active.get(track);
    if (!entry) return;
    track.removeEventListener("animationend", entry.end);
    track.removeEventListener("animationcancel", entry.end);
    clearTimeout(entry.timer);
    track.style.removeProperty("animation-play-state");
    // The final digit always occupies its resting line. Only the absolutely
    // positioned outgoing digit is removed; layout and paint origin stay fixed.
    entry.outgoing?.remove();
    track.classList.remove(
      "number-roll-up",
      "number-roll-down",
      "number-sign-in",
      "number-sign-out",
    );
    active.delete(track);
  }
  function start(track) {
    const entry = active.get(track);
    if (!entry || entry.timer !== null) return;
    track.style.animationPlayState = "running";
    entry.timer = setTimeout(() => finish(track), entry.duration + 100);
  }
  function set(
    element,
    value,
    {
      decimals = null,
      suffix = "",
      unit = "",
      placeholder = "—",
      key,
      animateInitial = true,
      animateWhole = false,
      animateWholeOnLengthChange = false,
      preserveText = false,
      integerDigits = 0,
      retainIntegerWidth = false,
      digitAlign = "right",
      reserveSign = false,
      motion = true,
      deferAnimation = false,
    } = {},
  ) {
    if (disposed) return;
    element.classList.toggle("summary-number-value", Boolean(unit));
    const number =
      value === null
        ? null
        : decimals === null
          ? typeof value === "number"
            ? WorkTimeApp.i18n.number(value, {
                useGrouping: false,
                maximumFractionDigits: 20,
              })
            : String(value)
          : WorkTimeApp.i18n.number(value, {
              useGrouping: false,
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            });
    const raw = number === null ? placeholder : number + suffix;
    const old = previous.get(element);
    const signature = JSON.stringify([
      raw,
      unit,
      animateWhole,
      animateWholeOnLengthChange,
      preserveText,
      integerDigits,
      retainIntegerWidth,
      digitAlign,
      reserveSign,
    ]);
    if (old?.signature === signature) return;
    for (const track of element.querySelectorAll(
      ".summary-number-track, .summary-number-sign",
    ))
      finish(track);
    const oldValue =
      old?.number ?? (key === undefined ? undefined : history.get(key)) ?? "0";
    const integerWidth = retainIntegerWidth
      ? Math.max(
          integerDigits,
          old?.integerWidth || 0,
          number?.match(/^[+-]?(\d+)/)?.[1].length || 0,
        )
      : integerDigits;
    previous.set(element, { signature, number, integerWidth });
    if (key !== undefined) history.set(key, number);
    if (number === null) element.textContent = placeholder;
    else {
      const wrapper = document.createElement("span");
      wrapper.className = "summary-number";
      const accessible = document.createElement("span");
      accessible.className = "summary-number-accessible";
      accessible.textContent = raw;
      const visual = document.createElement("span");
      visual.className = "summary-number-visual";
      if (!preserveText) visual.setAttribute("aria-hidden", "true");
      const decimal = WorkTimeApp.i18n.decimalSeparator;
      const oldDot = oldValue.includes(decimal)
        ? oldValue.indexOf(decimal)
        : oldValue.length;
      const newDot = number.includes(decimal)
        ? number.indexOf(decimal)
        : number.length;
      // ISO dates sort chronologically as strings; ordinary values sort numerically.
      const decreasing =
        Number.isNaN(Number(number.replace(decimal, "."))) ||
        Number.isNaN(Number(oldValue.replace(decimal, ".")))
          ? number < oldValue
          : Number(number.replace(decimal, ".")) <
            Number(oldValue.replace(decimal, "."));
      const animate =
        motion &&
        !reduced.matches &&
        !WorkTimeApp.i18n.changing &&
        !document.hidden &&
        (animateInitial || old?.number != null) &&
        oldValue !== number;
      const rollWhole =
        animateWhole ||
        (animate &&
          animateWholeOnLengthChange &&
          old?.number != null &&
          oldValue.length !== number.length);
      const pending = [];
      const leadingNumber = number.match(/^([+-]?)(\d+)/);
      const oldLeadingNumber = oldValue.match(/^([+-]?)(\d+)/);
      const padding =
        !rollWhole && retainIntegerWidth && leadingNumber
          ? Math.max(0, integerWidth - leadingNumber[2].length)
          : 0;
      if (!rollWhole && leadingNumber) {
        for (
          let count = leadingNumber[2].length;
          !retainIntegerWidth && count < integerDigits;
          count++
        ) {
          const spacer = document.createElement("span");
          spacer.className = "summary-number-spacer";
          spacer.setAttribute("aria-hidden", "true");
          visual.append(spacer);
        }
        if (reserveSign) {
          const sign = document.createElement("span");
          sign.className = "summary-number-sign";
          const before = oldLeadingNumber?.[1] || "";
          const after = leadingNumber[1];
          sign.textContent = after || before || "-";
          sign.dataset.numberSignHidden = String(!after);
          if (animate && Boolean(before) !== Boolean(after)) {
            sign.classList.add(after ? "number-sign-in" : "number-sign-out");
            const end = (event) => {
              if (event.target === sign) finish(sign);
            };
            sign.addEventListener("animationend", end);
            sign.addEventListener("animationcancel", end);
            sign.style.animationPlayState = "paused";
            active.set(sign, { end, timer: null, duration: 240 });
            pending.push(sign);
          }
          visual.append(sign);
        }
      }
      const digits = rollWhole ? [number] : [...number];
      // Keep missing columns on the side required by the view's alignment.
      // Accessible text still contains only the formatted number.
      if (padding) {
        const blanks = Array(padding).fill("");
        if (digitAlign === "left") digits.push(...blanks);
        else digits.splice(leadingNumber[1].length, 0, ...blanks);
      }
      for (const [index, digit] of digits.entries()) {
        if (reserveSign && index === 0 && leadingNumber?.[1]) continue;
        if (!rollWhole && digit !== "" && !/\d/.test(digit)) {
          const punctuation = document.createElement("span");
          punctuation.textContent = digit === " " ? "\u00a0" : digit;
          visual.append(punctuation);
          continue;
        }
        const numberIndex = index - (digitAlign === "left" ? 0 : padding);
        const oldIndex =
          digitAlign === "left"
            ? numberIndex -
              (leadingNumber?.[1].length || 0) +
              (oldLeadingNumber?.[1].length || 0)
            : numberIndex < newDot
              ? oldDot - (newDot - numberIndex)
              : oldDot + (numberIndex - newDot);
        const before = rollWhole
          ? oldValue
          : /\d/.test(oldValue[oldIndex] || "")
            ? oldValue[oldIndex]
            : retainIntegerWidth
              ? ""
              : "0";
        const column = document.createElement("span");
        column.className = "summary-number-column";
        if (rollWhole) column.classList.add("summary-number-word");
        const track = document.createElement("span");
        track.className = "summary-number-track";
        const row = (text) => {
          const item = document.createElement("span");
          item.className = "summary-number-digit";
          // Empty blocks use their bottom edge as a baseline. Keep a text line
          // even for blank slots so adjacent digits never jump vertically.
          item.textContent = text || "\u00a0";
          return item;
        };
        const finalRow = row(digit);
        if (animate && before !== digit) {
          track.classList.add(
            decreasing ? "number-roll-down" : "number-roll-up",
          );
          const delay = Math.min(pending.length * 12, 48);
          track.style.setProperty("--number-delay", delay + "ms");
          const outgoing = row(before);
          if (preserveText) {
            outgoing.textContent = "";
            outgoing.dataset.numberBefore = before;
            outgoing.setAttribute("aria-hidden", "true");
          }
          outgoing.classList.add("summary-number-outgoing");
          track.append(finalRow, outgoing);
          const end = (event) => {
            if (event.target === track) finish(track);
          };
          track.addEventListener("animationend", end);
          track.addEventListener("animationcancel", end);
          track.style.animationPlayState = "paused";
          active.set(track, {
            end,
            outgoing,
            timer: null,
            duration: 400 + delay,
          });
          pending.push(track);
        } else track.append(finalRow);
        column.append(track);
        visual.append(column);
      }
      if (suffix) {
        const label = document.createElement("span");
        label.textContent = suffix;
        label.style.whiteSpace = "pre";
        visual.append(label);
      }
      if (!preserveText) wrapper.append(accessible);
      wrapper.append(visual);
      element.replaceChildren(wrapper);
      // The final row owns layout; the outgoing row never contributes geometry.
      if (
        !deferAnimation &&
        !document.documentElement.classList.contains("app-loading")
      )
        pending.forEach(start);
    }
    if (unit) {
      const label = document.createElement("small");
      label.textContent = unit;
      element.append(label);
    }
  }
  function reveal(root) {
    if (document.hidden || reduced.matches) return settle();
    for (const track of active.keys())
      if (!(root instanceof Element) || root.contains(track)) start(track);
  }
  function settle(root) {
    for (const track of [...active.keys()])
      if (!(root instanceof Element) || root.contains(track)) finish(track);
  }
  function visibilityChanged() {
    if (document.hidden) settle();
  }
  function preferenceChanged() {
    if (reduced.matches) settle();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    settle();
    history.clear();
    previous = new WeakMap();
    unlisten?.();
    unlisten = null;
    document.removeEventListener("visibilitychange", visibilityChanged);
  }
  function mount() {
    if (!disposed) return;
    disposed = false;
    unlisten = WorkTimeApp.ui.animationCompat.listen(
      reduced,
      preferenceChanged,
    );
    document.addEventListener("visibilitychange", visibilityChanged);
  }
  WorkTimeApp.ui.numbers = { set, reveal, settle, mount, dispose };
  mount();
})();
