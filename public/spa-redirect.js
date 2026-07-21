(function () {
  var location = window.location;
  if (location.search.startsWith('?/')) {
    var path = location.search.slice(1);
    window.history.replaceState(null, '', path + (location.hash || ''));
  }
})();
