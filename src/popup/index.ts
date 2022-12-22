document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("opts")!.addEventListener("click", () => {
    window.open(browser.runtime.getURL("../settings/options.html"));
  });
});
