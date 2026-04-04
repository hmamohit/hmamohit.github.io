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

function renderHome(main, markdown, bibEntries) {
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
  var publicationItems = parseList(parsed.sections["Selected Publications"] || "", true);
  var publications = resolveCitations(publicationItems, bibMap);
  var news = parseList(parsed.sections.News || "", false);

  var newsHtml = news.map(function (item) {
    var m = item.match(/^\*\*(.+?)\*\*:\s*(.+)$/);
    if (m) {
      return '<li><span class="news-date">' + parseInline(m[1]) + '</span><span>' + parseInline(m[2]) + "</span></li>";
    }
    return '<li><span class="news-date">Update</span><span>' + parseInline(item) + "</span></li>";
  }).join("\n");

  main.innerHTML = [
    '<section id="about" class="section py-5 hero">',
    '<div class="container"><div class="row g-4 g-lg-5 align-items-center">',
    '<div class="col-lg-8">',
    '<h1 class="display-5 mb-2">' + parseInline(parsed.title || "Home") + "</h1>",
    lead ? '<p class="lead mb-4">' + parseInline(lead) + "</p>" : "",
    aboutParas.map(function (p, i) {
      var cls = i === aboutParas.length - 1 ? ' class="mb-0"' : "";
      return "<p" + cls + ">" + parseInline(p) + "</p>";
    }).join("\n"),
    '<div class="d-flex flex-wrap gap-2 mt-4"><a class="btn btn-primary" href="publications.html">View Publications</a><a class="btn btn-outline-primary" href="repositories.html">View Repositories</a></div>',
    '<div class="soft-box p-3 p-md-4 mt-3 intro-meta-card">',
    '<h2 class="h6 text-uppercase letter mb-3">Research Interests</h2>',
    '<div class="d-flex flex-wrap gap-2">' + interests.map(function (it) { return '<span class="interest-chip">' + parseInline(it) + "</span>"; }).join("") + "</div>",
    "</div>",
    '</div><div class="col-lg-4">',
    '<div class="profile-card"><img src="assets/img/about.jpg" class="img-fluid rounded-3 profile-photo" alt="H. M. A. Mohit Chowdhury portrait"></div>',
    '<div class="soft-box p-3 p-md-4 mt-3 intro-meta-card">',
    '<p class="small mb-1"><strong>Office Location</strong></p>',
    '<p class="small mb-0">' + officeLines.map(function (line) { return parseInline(line); }).join("<br>") + "</p>",
    "</div></div></div></div></section>",
    '<section id="publications" class="section py-5"><div class="container"><h2 class="section-title mb-4">Selected Publications</h2><div class="soft-box p-3 p-md-4"><ol class="publication-list mb-0">' + publications.map(function (p) { return "<li>" + p + "</li>"; }).join("") + "</ol></div></div></section>",
    '<section id="news" class="section section-alt py-5"><div class="container"><h2 class="section-title mb-4">News</h2><div class="soft-box p-3 p-md-4 news-box"><ul class="list-unstyled mb-0 news-list">' + newsHtml + "</ul></div></div></section>"
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
  var tagMap = {
    EmbedTAD: "Hi-C",
    HiCForecast: "Forecasting",
    ScHiCAtt: "Attention",
    coiTAD: "TAD",
    CNNSplice: "Genomics",
    "Loop Caller Benchmark": "Benchmark",
  };

  var cards = repos.map(function (repo) {
    var bodyParts = parseParagraphs(repo.body);
    var desc = bodyParts[0] || "";
    var linkMatch = repo.body.match(/\[(.*?)\]\((.*?)\)/);
    var linkLabel = linkMatch ? linkMatch[1] : "Open Repository";
    var linkHref = linkMatch ? linkMatch[2] : "#";
    var tag = tagMap[repo.title] || "Repository";

    return '<div class="col-md-6"><article class="repo-card p-3 p-md-4 h-100"><div class="d-flex justify-content-between align-items-start gap-2 mb-2"><h3 class="h5 mb-0">' +
      parseInline(repo.title) + '</h3><span class="repo-tag">' + parseInline(tag) + '</span></div><p class="mb-3">' + parseInline(desc) + '</p><a href="' +
      linkHref + '" target="_blank" rel="noopener">' + parseInline(linkLabel) + "</a></article></div>";
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

      if (name === "Scientific Research") {
        var cites = parseList(sectionMd, true);
        var rendered = resolveCitations(cites, bibMap);
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
  if (!source) return;

  try {
    var response = await fetch(source, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error("Failed to load markdown: " + response.status);
    }

    var markdown = await response.text();
    var bibResponse = await fetch("_bibliography/papers.bib", { cache: "no-cache" });
    var bibText = bibResponse.ok ? await bibResponse.text() : "";
    var bibEntries = parseBibtexEntries(bibText);
    if (source.endsWith("index.md")) {
      renderHome(main, markdown, bibEntries);
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
