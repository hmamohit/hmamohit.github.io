document.addEventListener("DOMContentLoaded", function () {
  var headerHost = document.getElementById("site-header");
  var footerHost = document.getElementById("site-footer");

  var fileName = window.location.pathname.split("/").pop() || "index.html";
  var navItems = [
    { href: "index.html", label: "Home" },
    { href: "publications.html", label: "Publications" },
    { href: "repositories.html", label: "Repositories" },
    { href: "resume.htm", label: "Resume" },
  ];

  if (headerHost) {
    var navHtml = navItems
      .map(function (item) {
        var active = item.href === fileName;
        return (
          '<li class="nav-item"><a class="nav-link' +
          (active ? " active" : "") +
          '"' +
          (active ? ' aria-current="page"' : "") +
          ' href="' +
          item.href +
          '">' +
          item.label +
          "</a></li>"
        );
      })
      .join("\n");

    headerHost.innerHTML =
      '<nav class="navbar navbar-expand-lg bg-white border-bottom sticky-top" aria-label="Main navigation">' +
      '<div class="container">' +
      '<a class="navbar-brand fw-semibold" href="index.html">H. M. A. Mohit Chowdhury</a>' +
      '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">' +
      '<span class="navbar-toggler-icon"></span>' +
      "</button>" +
      '<div class="collapse navbar-collapse" id="mainNav">' +
      '<ul class="navbar-nav ms-auto mb-2 mb-lg-0">' +
      navHtml +
      "</ul>" +
      "</div>" +
      "</div>" +
      "</nav>";
  }

  if (footerHost) {
    footerHost.innerHTML =
      '<footer class="py-4 border-top">' +
      '<div class="container d-flex flex-column flex-md-row justify-content-between gap-2">' +
      '<p class="mb-0 small">&copy; 2026 H. M. A. Mohit Chowdhury</p>' +
      '<p class="mb-0 small text-body-secondary">Built with GitHub Copilot &#129302;</p>' +
      "</div>" +
      "</footer>";
  }
});
