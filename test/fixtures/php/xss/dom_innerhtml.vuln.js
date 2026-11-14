var greeting = document.getElementById('greeting');
greeting.innerHTML = 'Hi ' + decodeURIComponent(location.hash.slice(1)); // @expect CWE-79
