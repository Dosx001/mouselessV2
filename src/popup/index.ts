import "./styles.scss";
import browser from "webextension-polyfill";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("opts")!.addEventListener("click", () => {
    window.open(browser.runtime.getURL("src/settings/options.html"));
  });
});
