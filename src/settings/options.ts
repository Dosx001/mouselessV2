import { conf, keys } from "mappings";
import "./styles.scss";

const opitons = {
  conf: conf,
  keys: keys,
};

browser.storage.sync.get().then((sync) => {
  for (const el of document.querySelectorAll("input, textarea")) {
    const [section, name] = el.getAttribute("data-value")!.split(".");
    (el as HTMLInputElement).value =
      (sync as any)[section]?.[name] ?? (opitons as any)[section][name];
  }
});

document.querySelector("form")!.onsubmit = (ev) => {
  ev.preventDefault();
  for (const el of document.querySelectorAll("input, textarea")) {
    const [section, name] = el.getAttribute("data-value")!.split(".");
    (opitons as any)[section][name] = (el as HTMLInputElement).value;
  }
  browser.storage.sync.set(opitons);
};
