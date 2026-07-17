
  window.onerror = function(msg, url, line, col, error) {
    const err = document.createElement('div');
    err.style = "position:absolute; top:0; left:0; z-index:999999; background:red; color:white; padding:20px; font-size:20px;";
    err.innerText = msg + ' at ' + line + ':' + col;
    if (error && error.stack) err.innerText += '\n' + error.stack;
    document.body.appendChild(err);
  };
  window.addEventListener('unhandledrejection', function(event) {
    const err = document.createElement('div');
    err.style = "position:absolute; top:0; left:0; z-index:999999; background:red; color:white; padding:20px; font-size:20px;";
    err.innerText = 'Unhandled Promise Rejection: ' + event.reason;
    document.body.appendChild(err);
  });
