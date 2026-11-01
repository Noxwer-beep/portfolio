/* Show the requested path so a mistyped URL is obvious. */
(function () {
  "use strict";
  var el = document.getElementById("path");
  if (el) el.textContent = location.pathname + location.search;
})();
