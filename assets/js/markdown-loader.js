function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function parseInline(text) {
  var escaped = escapeHtml(text);
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  escaped = escaped.replace(/\*(.*?)\*/g, "<em>$1</em>");
  escaped = escaped.replace(/\[(.*?)\]\((.*?)\)/g, function (_, label, href) {
    var external = /^(https?:|mailto:)/.test(href);
    if (external) {
      return '<a href="' + href + '" target="_blank" rel="noopener">' + label + "</a>";
    }
    return '<a href="' + href + '">' + label + "</a>";
  });
  return escaped;
}

function parseBibtexEntries(bibText) {
  var entries = [];
  var i = 0;

  while (i < bibText.length) {
    var at = bibText.indexOf("@", i);
    if (at === -1) break;

    var braceStart = bibText.indexOf("{", at);
    if (braceStart === -1) break;

    var depth = 0;
    var end = -1;
    for (var j = braceStart; j < bibText.length; j++) {
      var ch = bibText[j];
      if (ch === "{") depth++;
      if (ch === "}") {
        depth--;
        if (depth === 0) {
          end = j;
          break;
        }
      }
    }

    if (end === -1) break;

    var block = bibText.slice(at, end + 1);
    var typeMatch = block.match(/^@(\w+)\s*\{/);
    var type = typeMatch ? typeMatch[1].toLowerCase() : "article";
    var keyStart = block.indexOf("{") + 1;
    var keyEnd = block.indexOf(",", keyStart);
    var key = keyEnd > -1 ? block.slice(keyStart, keyEnd).trim() : "";
    var body = keyEnd > -1 ? block.slice(keyEnd + 1, -1) : "";

    function extractField(name) {
      var re = new RegExp("(?:^|\\n)\\s*" + name + "\\s*=\\s*([\\s\\S]*?)(?=,\\n\\s*[A-Za-z_][A-Za-z0-9_-]*\\s*=|\\n\\s*$)", "i");
      var m = body.match(re);
      if (!m) return "";
      var raw = m[1].trim().replace(/,$/, "").trim();
      if ((raw.startsWith("{") && raw.endsWith("}")) || (raw.startsWith('"') && raw.endsWith('"'))) {
        raw = raw.slice(1, -1);
      }
      raw = raw.replace(/[{}]/g, "").replace(/\s+/g, " ").trim();
      return raw;
    }

    entries.push({
      type: type,
      key: key,
      title: extractField("title"),
      journal: extractField("journal"),
      author: extractField("author"),
      year: extractField("year"),
      doi: extractField("doi"),
      url: extractField("url"),
    });

    i = end + 1;
  }

  return entries;
}

function authorsToText(authorField) {
  if (!authorField) return "";
  var authors = authorField
    .split(/\s+and\s+/i)
    .map(function (a) {
      return a.trim();
    })
    .filter(Boolean);
  return authors.join(", ");
}

function doiToUrl(doi, fallbackUrl) {
  if (doi) {
    if (/^https?:\/\//i.test(doi)) return doi;
    return "https://doi.org/" + doi;
  }
  return fallbackUrl || "";
}

function formatBibEntryHtml(entry) {
  if (!entry) return "";
  var authors = authorsToText(entry.author);
  var parts = [];
  if (authors) parts.push(parseInline(authors));
  if (entry.title) parts.push(parseInline(entry.title));

  var venue = "";
  if (entry.journal) venue += "<em>" + parseInline(entry.journal) + "</em>";
  if (entry.year) venue += (venue ? ", " : "") + parseInline(entry.year);
  if (venue) parts.push(venue);

  var out = parts.join(". ") + ".";
  var doiUrl = doiToUrl(entry.doi, entry.url);
  if (doiUrl) out += ' <a href="' + doiUrl + '" target="_blank" rel="noopener">DOI</a>';
  return out;
}

function parseCitationToken(text) {
  var t = (text || "").trim();
  var m1 = t.match(/^\[@(.+)\]$/);
  if (m1) return m1[1].trim();
  var m2 = t.match(/^@\{(.+)\}$/);
  if (m2) return m2[1].trim();
  var m3 = t.match(/^@([^\s].*)$/);
  if (m3) return m3[1].trim();
  return "";
}

function resolveCitations(items, bibMap) {
  return items.map(function (item) {
    var key = parseCitationToken(item);
    if (!key) return parseInline(item);
    var entry = bibMap[key];
    if (!entry) return parseInline(item);
    return formatBibEntryHtml(entry);
  });
}

function splitSections(md) {
  var lines = md.replace(/\r\n/g, "\n").split("\n");
  var title = "";
  var intro = [];
  var sections = {};
  var sectionOrder = [];
  var current = null;
  var buffer = [];

  function flush() {
    if (!current) return;
    sections[current] = buffer.join("\n").trim();
    sectionOrder.push(current);
    buffer = [];
  }

  lines.forEach(function (line) {
    var h1 = line.match(/^#\s+(.+)/);
    var h2 = line.match(/^##\s+(.+)/);

    if (h1) {
      title = h1[1].trim();
      return;
    }

    if (h2) {
      flush();
      current = h2[1].trim();
      return;
    }

    if (current) {
      buffer.push(line);
    } else {
      intro.push(line);
    }
  });

  flush();

  return {
    title: title,
    intro: intro.join("\n").trim(),
    sections: sections,
    sectionOrder: sectionOrder,
  };
}

function parseList(text, ordered) {
  var lines = text.split("\n");
  var pattern = ordered ? /^\d+\.\s+(.+)/ : /^-\s+(.+)/;
  return lines
    .map(function (line) {
      var match = line.trim().match(pattern);
      return match ? match[1].trim() : null;
    })
    .filter(Boolean);
}

function parseParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map(function (chunk) {
      return chunk.trim();
    })
    .filter(function (chunk) {
      return chunk && !/^[-\d]/.test(chunk);
    });
}

function formatNewsDateTime(date) {
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, "0");
  var day = String(date.getDate()).padStart(2, "0");
  var hours = String(date.getHours()).padStart(2, "0");
  var minutes = String(date.getMinutes()).padStart(2, "0");
  return year + "-" + month + "-" + day + " " + hours + ":" + minutes;
}

function parseNewsDateTimeLabel(label) {
  var m = (label || "").trim().match(/^(\d{4})[\/-](\d{2})[\/-](\d{2})(?:\s+(\d{2}):(\d{2}))?$/);
  if (!m) return NaN;

  var year = parseInt(m[1], 10);
  var month = parseInt(m[2], 10);
  var day = parseInt(m[3], 10);
  var hours = parseInt(m[4] || "0", 10);
  var minutes = parseInt(m[5] || "0", 10);

  return new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();
}

function parseNewsEntry(item, index) {
  var m = item.match(/^\*\*(.+?)(?::)?\*\*\s*:?\s*(.+)$/);
  if (!m) {
    m = item.match(/^([0-9]{4}[\/-][0-9]{2}[\/-][0-9]{2}(?:\s+[0-9]{2}:[0-9]{2})?)\s*:\s*(.+)$/);
  }

  if (m) {
    var dateLabel = m[1].trim();
    return {
      dateLabel: dateLabel,
      body: m[2],
      sortValue: parseNewsDateTimeLabel(dateLabel),
      sourceIndex: index
    };
  }

  return {
    dateLabel: formatNewsDateTime(new Date()),
    body: item,
    sortValue: NaN,
    sourceIndex: index
  };
}

function sortNewsEntries(entries) {
  return entries.slice().sort(function (a, b) {
    var aHasDate = !Number.isNaN(a.sortValue);
    var bHasDate = !Number.isNaN(b.sortValue);

    if (aHasDate && bHasDate && a.sortValue !== b.sortValue) {
      return b.sortValue - a.sortValue;
    }
    if (aHasDate && !bHasDate) return -1;
    if (!aHasDate && bHasDate) return 1;
    return a.sourceIndex - b.sourceIndex;
  });
}

function renderNewsItem(entry) {
  return '<li><span class="news-date">' + parseInline(entry.dateLabel) + '</span><span>' + parseInline(entry.body) + "</span></li>";
}

function extractNewsItemsFromMarkdown(markdown) {
  if (!markdown) return [];

  var parsed = splitSections(markdown);
  var sectionItems = parseList(parsed.sections.News || "", false);
  if (sectionItems.length) return sectionItems;

  var introItems = parseList(parsed.intro || "", false);
  if (introItems.length) return introItems;

  return parseList(markdown, false);
}

function parseSubsections(text) {
  var lines = text.split("\n");
  var sections = [];
  var currentTitle = "";
  var buffer = [];

  function flush() {
    if (!currentTitle) return;
    sections.push({ title: currentTitle, body: buffer.join("\n").trim() });
    buffer = [];
  }

  lines.forEach(function (line) {
    var h3 = line.match(/^###\s+(.+)/);
    if (h3) {
      flush();
      currentTitle = h3[1].trim();
      return;
    }
    if (currentTitle) {
      buffer.push(line);
    }
  });

  flush();
  return sections;
}

function splitRowsIntoBalancedColumns(rows) {
  var splitAt = Math.ceil(rows.length / 2);
  var left = rows.slice(0, splitAt);
  var right = rows.slice(splitAt);

  return { left: left, right: right };
}

function markdownToHtml(md) {
  var lines = md.replace(/\r\n/g, "\n").split("\n");
  var html = [];
  var inUl = false;
  var inOl = false;
  var inP = false;

  function closeListsAndParagraph() {
    if (inP) {
      html.push("</p>");
      inP = false;
    }
    if (inUl) {
      html.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      html.push("</ol>");
      inOl = false;
    }
  }

  lines.forEach(function (raw) {
    var line = raw.trim();

    if (!line) {
      closeListsAndParagraph();
      return;
    }

    var h1 = line.match(/^#\s+(.+)/);
    var h2 = line.match(/^##\s+(.+)/);
    var h3 = line.match(/^###\s+(.+)/);
    var ul = line.match(/^[-*]\s+(.+)/);
    var ol = line.match(/^\d+\.\s+(.+)/);

    if (h1) {
      closeListsAndParagraph();
      html.push("<h1>" + parseInline(h1[1]) + "</h1>");
      return;
    }

    if (h2) {
      closeListsAndParagraph();
      html.push("<h2>" + parseInline(h2[1]) + "</h2>");
      return;
    }

    if (h3) {
      closeListsAndParagraph();
      html.push("<h3>" + parseInline(h3[1]) + "</h3>");
      return;
    }

    if (ul) {
      if (inP) {
        html.push("</p>");
        inP = false;
      }
      if (inOl) {
        html.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        html.push('<ul class="mb-0">');
        inUl = true;
      }
      html.push("<li>" + parseInline(ul[1]) + "</li>");
      return;
    }

    if (ol) {
      if (inP) {
        html.push("</p>");
        inP = false;
      }
      if (inUl) {
        html.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        html.push('<ol class="mb-0">');
        inOl = true;
      }
      html.push("<li>" + parseInline(ol[1]) + "</li>");
      return;
    }

    if (!inP) {
      if (inUl) {
        html.push("</ul>");
        inUl = false;
      }
      if (inOl) {
        html.push("</ol>");
        inOl = false;
      }
      html.push("<p>");
      inP = true;
      html.push(parseInline(line));
    } else {
      html.push("<br>" + parseInline(line));
    }
  });

  closeListsAndParagraph();
  return html.join("\n");
}

function renderStructuredPage(main, html) {
  var temp = document.createElement("div");
  temp.innerHTML = html;
  var nodes = Array.from(temp.children);

  var heroTitle = "";
  if (nodes.length && nodes[0].tagName === "H1") {
    heroTitle = nodes.shift().outerHTML.replace("<h1>", '<h1 class="mb-0">').replace("</h1>", "</h1>");
  }

  var out = [];
  if (heroTitle) {
    out.push('<section class="page-hero py-4"><div class="container">' + heroTitle + "</div></section>");
  }

  out.push('<section class="section py-5"><div class="container">');

  var current = [];
  function flushCurrent() {
    if (!current.length) return;
    out.push('<div class="soft-box p-3 p-md-4 mb-4 md-section-content">' + current.join("") + "</div>");
    current = [];
  }

  nodes.forEach(function (node) {
    if (node.tagName === "H2") {
      flushCurrent();
      node.className = "h5";
      current.push(node.outerHTML);
      return;
    }
    if (node.tagName === "H3") {
      node.className = "h6 mt-3";
    }
    if (node.tagName === "OL") {
      node.classList.add("publication-list");
    }
    current.push(node.outerHTML);
  });

  flushCurrent();
  out.push("</div></section>");
  main.innerHTML = out.join("\n");
}

function renderHome(main, markdown, bibEntries, newsItems) {
  var bibMap = {};
  bibEntries.forEach(function (e) { bibMap[e.key] = e; });
  var parsed = splitSections(markdown);
  var introParas = parseParagraphs(parsed.intro);
  var lead = introParas[0] || "";
  var aboutParas = parseParagraphs(parsed.sections.About || "");
  var interests = parseList(parsed.sections["Research Interests"] || "", false);
  var officeLines = (parsed.sections["Office Location"] || "").split("\n").map(function (l) {
    return l.trim();
  }).filter(Boolean);
  var connectLinks = parseList(parsed.sections["Connect"] || "", false);
  var profileImage = (parsed.sections["Profile Image"] || "").trim() || "assets/img/about.jpg";
  var publicationItems = parseList(parsed.sections["Selected Publications"] || "", true);
  var publications = resolveCitations(publicationItems, bibMap);
  var news = Array.isArray(newsItems) && newsItems.length
    ? newsItems
    : parseList(parsed.sections.News || "", false);
  var sortedNews = sortNewsEntries(news.map(function (item, index) {
    return parseNewsEntry(item, index);
  }));
  var visibleNews = sortedNews.slice(0, 5);
  var hasMoreNews = sortedNews.length > visibleNews.length;
  var newsHtml = visibleNews.map(renderNewsItem).join("\n");
  var moreNewsHtml = hasMoreNews
    ? '<div class="mt-3 text-end"><a class="btn btn-outline-primary btn-sm" href="news.html">View all news</a></div>'
    : "";

  var connectHtml = "";
  var emailHtml = "";
  if (connectLinks.length > 0) {
    var nonEmailLinks = [];
    connectLinks.forEach(function (link) {
      var m = link.match(/\[(.*?)\]\((.*?)\)/);
      if (!m) return;
      if (m[1].toLowerCase().includes("email")) {
        var email = m[2].replace("mailto:", "");
        emailHtml = '<div class="soft-box p-3 p-md-4"><p class="small mb-1"><strong><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-envelope-at" viewBox="0 0 16 16" style="margin-right: 6px; vertical-align: -2px;"><path d="M2 2a2 2 0 0 0-2 2v8.01A2 2 0 0 0 2 14h5.5a.5.5 0 0 0 0-1H2a1 1 0 0 1-.966-.741l5.64-3.471L8 9.583l7-4.2V8.5a.5.5 0 0 0 1 0V4a2 2 0 0 0-2-2zm3.708 6.208L1 11.105V5.383zM1 4.217V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v.217l-7 4.2z"/><path d="M14.247 14.269c1.01 0 1.587-.857 1.587-2.025v-.21C15.834 10.43 14.64 9 12.52 9h-.035C10.42 9 9 10.36 9 12.432v.214C9 14.82 10.438 16 12.358 16h.044c.594 0 1.018-.074 1.237-.175v-.73c-.245.11-.673.18-1.18.18h-.044c-1.334 0-2.571-.788-2.571-2.655v-.157c0-1.657 1.058-2.724 2.64-2.724h.04c1.535 0 2.484 1.05 2.484 2.326v.118c0 .975-.324 1.39-.639 1.39-.232 0-.41-.148-.41-.42v-2.19h-.906v.569h-.03c-.084-.298-.368-.63-.954-.63-.778 0-1.259.555-1.259 1.4v.528c0 .892.49 1.434 1.26 1.434.471 0 .896-.227 1.014-.643h.043c.118.42.617.648 1.12.648m-2.453-1.588v-.227c0-.546.227-.791.573-.791.297 0 .572.192.572.708v.367c0 .573-.253.744-.564.744-.354 0-.581-.215-.581-.8Z"/></svg>Email</strong></p><p class="small mb-0"><a href="' + m[2] + '" class="text-decoration-none">' + email + '</a></p></div>';
      } else {
        nonEmailLinks.push(link);
      }
    });
    
    if (nonEmailLinks.length > 0) {
      var connectButtons = nonEmailLinks.map(function (link) {
        var m = link.match(/\[(.*?)\]\((.*?)\)/);
        if (!m) return "";
        var label = m[1].toLowerCase();
        var url = m[2];
        var icon = "";
        if (label.includes("linkedin")) {
          icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-linkedin" viewBox="0 0 16 16"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z"/></svg>';
        } else if (label.includes("github")) {
          icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-github" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/></svg>';
        } else if (label.includes("scholar")) {
          icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mortarboard" viewBox="0 0 16 16"><path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.905 3.952a.5.5 0 0 0 .422.941L6.5 7.189V13.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5V7.19l6.447-3.209a.5.5 0 0 0 .422-.94L8.211 2.047zM13.5 13a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5v-6l5-2.5 5 2.5v6z"/></svg>';
        }
        return '<a href="' + url + '" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm" title="' + label + '">' + icon + ' ' + label + '</a>';
      }).join("");
      connectHtml = '<div class="soft-box p-3 p-md-4"><p class="small mb-2"><strong>Connect</strong></p><div class="d-flex flex-wrap gap-2">' + connectButtons + "</div></div>";
    }
  }

  main.innerHTML = [
    '<section id="about" class="section py-5 hero">',
    '<div class="container">',
    '<div class="d-flex flex-wrap align-items-center gap-2 mb-3"><h1 class="display-5 mb-0">' + parseInline(parsed.title || "Home") + '</h1><a class="btn btn-outline-primary btn-sm" href="assets/pdf/chowdhury_resume.pdf" target="_blank" rel="noopener" download>Resume PDF</a></div>',
    lead ? '<p class="lead mb-4">' + parseInline(lead) + "</p>" : "",
    '<div class="row g-4 g-md-5 align-items-center">',
    '<div class="col-md-8 order-2 order-md-1">',
    aboutParas.map(function (p, i) {
      var cls = i === aboutParas.length - 1 ? ' class="mb-0"' : "";
      return "<p" + cls + ">" + parseInline(p) + "</p>";
    }).join("\n"),
    '<div class="d-flex flex-wrap gap-2 mt-4"><a class="btn btn-primary" href="publications.html">View Publications</a><a class="btn btn-outline-primary" href="repositories.html">View Repositories</a></div>',
    '<div class="soft-box p-3 p-md-4 mt-3 intro-meta-card">',
    '<h2 class="h6 text-uppercase letter mb-3">Research Interests</h2>',
    '<div class="d-flex flex-wrap gap-2">' + interests.map(function (it) { return '<span class="interest-chip">' + parseInline(it) + "</span>"; }).join("") + "</div>",
    "</div>",
    '</div><div class="col-md-4 order-1 order-md-2">',
    '<div class="profile-card"><img src="' + profileImage + '" class="img-fluid rounded-3 profile-photo" alt="H. M. A. Mohit Chowdhury portrait"></div>',
    "</div></div></div></section>",
    '<section id="publications" class="section py-5"><div class="container"><h2 class="section-title mb-4">Selected Publications</h2><div class="soft-box p-3 p-md-4"><ol class="publication-list mb-0">' + publications.map(function (p) { return "<li>" + p + "</li>"; }).join("") + '</ol><div class="mt-3 text-end"><a class="btn btn-outline-primary btn-sm" href="publications.html">View all publications</a></div></div></div></section>',
    '<section id="news" class="section section-alt py-5"><div class="container"><h2 class="section-title mb-4">News</h2><div class="soft-box p-3 p-md-4 news-box"><ul class="list-unstyled mb-0 news-list">' + newsHtml + '</ul>' + moreNewsHtml + "</div></div></section>",
    '<section class="section py-5"><div class="container"><div class="row g-4 g-lg-5">',
    '<div class="col-lg-4">',
    '<div class="soft-box p-3 p-md-4">',
    '<p class="small mb-1"><strong><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-envelope" viewBox="0 0 16 16" style="margin-right: 6px; vertical-align: -2px;"><path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1zm13 2.383-4.708 2.825L15 11.105zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741M1 11.105l4.708-2.897L1 5.383z"/></svg>Office Location</strong></p>',
    '<p class="small mb-0">' + officeLines.map(function (line) { return parseInline(line); }).join("<br>") + "</p>",
    "</div>",
    "</div>",
    emailHtml ? '<div class="col-lg-4">' + emailHtml + "</div>" : "",
    '<div class="col-lg-4">',
    connectHtml,
    "</div>",
    "</div></div></section>"
  ].join("\n");
}

function renderPublications(main, markdown, bibEntries) {
  var bibMap = {};
  bibEntries.forEach(function (e) { bibMap[e.key] = e; });
  var parsed = splitSections(markdown);
  var tokens = parseList(parsed.sections["Full Publication List"] || "", true);
  var list = [];
  if (tokens.length === 1 && tokens[0].trim().toLowerCase() === "@all") {
    list = bibEntries
      .slice()
      .sort(function (a, b) {
        var ay = parseInt(a.year || "0", 10);
        var by = parseInt(b.year || "0", 10);
        if (ay !== by) return by - ay;
        return (a.title || "").localeCompare(b.title || "");
      })
      .map(formatBibEntryHtml);

    if (!list.length) {
      list = [
        "Publication data could not be loaded from the bibliography file."
      ];
    }
  } else {
    list = resolveCitations(tokens, bibMap);
  }
  main.innerHTML = '<section class="page-hero py-4"><div class="container"><h1 class="mb-0">' + parseInline(parsed.title || "Publications") + '</h1></div></section>' +
    '<section class="section py-5"><div class="container"><div class="soft-box p-3 p-md-4"><ol class="publication-list mb-0">' +
    list.map(function (item) { return "<li>" + item + "</li>"; }).join("") +
    "</ol></div></div></section>";
}

function renderRepositories(main, markdown) {
  var parsed = splitSections(markdown);
  var profiles = parseList(parsed.sections["GitHub Profiles"] || "", false);
  var repos = parseSubsections(parsed.sections["Featured Repositories"] || "");

  var cards = repos.map(function (repo) {
    var tagMatch = repo.body.match(/\*\*Tag:\*\*\s*([^\n]+)/);
    var tags = tagMatch ? tagMatch[1].trim().split(/\s*,\s*/).map(function(t) { return t.trim(); }) : [];
    var tagHtml = tags.map(function(t) { return '<span class="repo-tag">' + parseInline(t) + '</span>'; }).join('');
    var bodyWithoutTag = repo.body.replace(/\*\*Tag:\*\*\s*[^\n]+\n?/g, "").trim();
    var bodyParts = parseParagraphs(bodyWithoutTag);
    var desc = bodyParts[0] || "";

    return '<div class="col-md-6"><article class="repo-card p-3 p-md-4 h-100"><div class="d-flex justify-content-between align-items-start gap-2 mb-2"><h3 class="h5 mb-0">' +
      parseInline(repo.title) + '</h3><div class="d-flex flex-wrap gap-1">' + tagHtml + '</div></div><p class="mb-3">' + parseInline(desc) + '</p>' + parseInline(bodyWithoutTag.replace(bodyParts[0] || "", "").trim()) + '</article></div>';
  }).join("");

  var profileButtons = profiles.map(function (profile) {
    var match = profile.match(/^\[(.*?)\]\((.*?)\)$/);
    if (!match) return "";
    return '<a class="btn btn-outline-primary" href="' + match[2] + '" target="_blank" rel="noopener">' + parseInline(match[1]) + "</a>";
  }).join("\n");

  main.innerHTML = '<section class="page-hero py-4"><div class="container"><h1 class="mb-0">' + parseInline(parsed.title || "Repositories") + '</h1></div></section>' +
    '<section class="section py-5"><div class="container"><div class="soft-box p-3 p-md-4 mb-4"><h2 class="h5 mb-3">GitHub Profiles</h2><div class="d-flex flex-wrap gap-2">' +
    profileButtons + '</div></div><h2 class="section-title mb-4">Featured Repositories</h2><div class="row g-4">' + cards + "</div></div></section>";
}

function renderNewsArchive(main, markdown) {
  var allNews = sortNewsEntries(extractNewsItemsFromMarkdown(markdown).map(function (item, index) {
    return parseNewsEntry(item, index);
  }));

  var archiveBody = "";
  if (!allNews.length) {
    archiveBody = '<p class="mb-0">No news entries yet.</p>';
  } else {
    archiveBody = '<ul class="list-unstyled mb-0 news-list">' + allNews.map(renderNewsItem).join("\n") + "</ul>";
  }

  main.innerHTML = '<section class="page-hero py-4"><div class="container d-flex flex-wrap justify-content-between align-items-center gap-2"><h1 class="mb-0">News</h1><a class="btn btn-outline-primary btn-sm" href="index.html#news">Back to Home</a></div></section>' +
    '<section class="section py-5"><div class="container"><div class="soft-box p-3 p-md-4">' + archiveBody + "</div></div></section>";
}

function renderResume(main, markdown, bibEntries) {
  var parsed = splitSections(markdown);
  var bibMap = {};
  bibEntries.forEach(function (e) { bibMap[e.key] = e; });
  var downloadMatch = (parsed.sections.Download || "").match(/\[(.*?)\]\((.*?)\)/);
  var downloadHref = downloadMatch ? downloadMatch[2] : "assets/pdf/chowdhury_resume.pdf";
  var downloadLabel = downloadMatch ? downloadMatch[1] : "Download Resume";

  var body = parsed.sectionOrder
    .filter(function (name) { return name !== "Download"; })
    .map(function (name, idx, arr) {
      var sectionMd = parsed.sections[name] || "";
      var inner = "";

      if (name === "General Information") {
        var infoItems = parseList(sectionMd, false);
        var rows = infoItems
          .map(function (item) {
            var m = item.match(/^\*\*(.+?)\*\*:?\s*(.+)$/);
            if (!m) return null;
            return { key: m[1].replace(/:\s*$/, "").trim(), value: m[2].trim() };
          })
          .filter(Boolean);
        var columns = splitRowsIntoBalancedColumns(rows);
        var left = columns.left;
        var right = columns.right;

        function toColumn(items) {
          return items
            .map(function (row, i) {
              var mb = i === items.length - 1 ? " mb-0" : " mb-2";
              return '<p class="' + mb.trim() + '"><strong>' + parseInline(row.key) + ':</strong> ' + parseInline(row.value) + "</p>";
            })
            .join("");
        }

        if (rows.length > 0) {
          inner = '<div class="resume-info-grid"><div class="resume-info-col">' + toColumn(left) + '</div><div class="resume-info-col">' + toColumn(right) + "</div></div>";
        }
      }

      if (name === "Peer-reviewed Journal Articles (08)") {
        var cites = parseList(sectionMd, true);
        var rendered = [];
        if (cites.length === 1 && cites[0].trim().toLowerCase() === "@all") {
          rendered = bibEntries
            .slice()
            .sort(function (a, b) {
              var ay = parseInt(a.year || "0", 10);
              var by = parseInt(b.year || "0", 10);
              if (ay !== by) return by - ay;
              return (a.title || "").localeCompare(b.title || "");
            })
            .map(formatBibEntryHtml);

          if (!rendered.length) {
            rendered = ["Publication data could not be loaded from the bibliography file."];
          }
        } else {
          rendered = resolveCitations(cites, bibMap);
        }
        inner = '<ol class="publication-list mb-0">' + rendered.map(function (entry) {
          return "<li>" + entry + "</li>";
        }).join("") + "</ol>";
      }

      if (!inner) {
        inner = markdownToHtml(sectionMd).replace('<ol class="mb-0">', '<ol class="publication-list mb-0">');
      }

      var cls = idx === arr.length - 1 ? "" : " mb-4";
      return '<div class="soft-box p-3 p-md-4' + cls + ' md-section-content"><h2 class="h5">' + parseInline(name) + "</h2>" + inner + "</div>";
    })
    .join("\n");

  main.innerHTML = '<section class="page-hero py-4"><div class="container d-flex flex-wrap justify-content-between align-items-center gap-2"><div><h1 class="mb-0">' +
    parseInline(parsed.title || "Resume") + '</h1></div><a class="btn btn-primary" href="' + downloadHref + '" target="_blank" rel="noopener" download>' +
    parseInline(downloadLabel) + '</a></div></section><section class="section py-5"><div class="container">' + body + "</div></section>";
}

document.addEventListener("DOMContentLoaded", async function () {
  var main = document.querySelector("main[data-md]");
  if (!main) return;

  var source = main.getAttribute("data-md");
  var view = main.getAttribute("data-view") || "";
  if (!source) return;

  try {
    var response = await fetch(source, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("Failed to load markdown: " + response.status);
    }

    var markdown = await response.text();

    async function loadBibText() {
      var bibPaths = ["assets/bibliography/papers.bib"];
      for (var p = 0; p < bibPaths.length; p++) {
        try {
          var res = await fetch(bibPaths[p], { cache: "no-cache" });
          if (res.ok) {
            return await res.text();
          }
        } catch (err) {
          // Keep trying fallback bibliography paths.
        }
      }
      return "";
    }

    async function loadNewsText() {
      try {
        var res = await fetch("assets/content/news.md", { cache: "no-cache" });
        if (res.ok) {
          return await res.text();
        }
      } catch (err) {
        // Fall back to index markdown news content if this file is unavailable.
      }
      return "";
    }

    var bibText = await loadBibText();
    var bibEntries = parseBibtexEntries(bibText);
    if (view === "news" || view === "news-archive") {
      renderNewsArchive(main, markdown);
      return;
    }

    if (source.endsWith("index.md")) {
      var newsText = await loadNewsText();
      var newsItems = extractNewsItemsFromMarkdown(newsText);
      renderHome(main, markdown, bibEntries, newsItems);
      return;
    }

    if (source.endsWith("publications.md")) {
      renderPublications(main, markdown, bibEntries);
      return;
    }

    if (source.endsWith("repositories.md")) {
      renderRepositories(main, markdown);
      return;
    }

    if (source.endsWith("resume.md")) {
      renderResume(main, markdown, bibEntries);
      return;
    }

    var html = markdownToHtml(markdown);
    renderStructuredPage(main, html);
  } catch (error) {
    main.innerHTML =
      '<section class="section py-5"><div class="container"><div class="alert alert-warning mb-0" role="alert">Content could not be loaded. If you opened this file directly, run a local server (for example: python3 -m http.server) and open the site via http://localhost.</div></div></section>';
    console.error(error);
  }
});
