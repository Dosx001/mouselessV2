function queries() {
  switch (location.host) {
    case "duckduckgo.com":
      return "figure";
    case "mail.google.com":
      return "div[role='checkbox'],div[role='switch']";
    case "www.hoyolab.com":
      return ".mhy-article-card__img,.pager-number,.tool-logo,.mhy-switch-tab__tag,.header-tab";
    case "www.youtube.com":
      return "yt-chip-cloud-chip-renderer,yt-tab-shape";
  }
  return "";
}

export default queries;
